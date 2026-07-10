import { createHash } from "node:crypto";
import { spawn } from "node:child_process";

import { getTaskChallenge } from "../src/lib/task-runner/challenge";
import { buildRootlessDockerCommand } from "../src/lib/task-runner/docker-command";
import { sanitizeTaskLog } from "../src/lib/task-runner/logs";
import { validateUnifiedDiff } from "../src/lib/task-runner/patch-validator";
import {
  TASK_LOG_MAX_BYTES,
  TASK_RUN_TIMEOUT_MS,
  type ClaimedTaskRun,
  type CompleteTaskRunInput,
  type TaskCheckResult
} from "../src/lib/task-runner/types";
import { validateAndApplyPatch } from "./git-patch";
import { runCapturedProcess } from "./process-runner";
import { createTaskWorkspace, removeTaskWorkspace, type TaskWorkspace } from "./workspace";

const RAW_OUTPUT_LIMIT_BYTES = TASK_LOG_MAX_BYTES + 64 * 1024;

export interface TaskExecutor {
  execute(run: ClaimedTaskRun): Promise<CompleteTaskRunInput>;
}

function currentWorkerIdentity(): { uid: number; gid: number } {
  const uid = process.getuid?.();
  const gid = process.getgid?.();

  if (!uid || !gid) {
    throw new Error("Task worker must run as a non-root Unix user.");
  }

  return { uid, gid };
}

function killContainer(containerName: string): void {
  const child = spawn("docker", ["kill", containerName], {
    shell: false,
    stdio: "ignore"
  });
  child.unref();
}

function skippedChecks(
  checks: readonly { id: string; kind: "public" | "hidden" }[],
  startIndex: number
): TaskCheckResult[] {
  return checks.slice(startIndex).map((check) => ({
    id: check.id,
    kind: check.kind,
    status: "skipped",
    exitCode: null,
    durationMs: 0
  }));
}

export class DockerTaskExecutor implements TaskExecutor {
  async execute(run: ClaimedTaskRun): Promise<CompleteTaskRunInput> {
    const startedAt = Date.now();
    const checks: TaskCheckResult[] = [];
    const logParts: string[] = [];
    let workspace: TaskWorkspace | null = null;
    let timedOut = false;
    let outputLimitExceeded = false;

    try {
      const challenge = getTaskChallenge(run.challengeSlug);

      if (!challenge || challenge.version !== run.challengeVersion || challenge.manifest.image !== run.imageDigest) {
        throw new Error("Queued task challenge version is no longer available.");
      }

      const validatedPatch = validateUnifiedDiff(run.patch, challenge.manifest.editablePaths);
      const actualPatchHash = createHash("sha256").update(run.patch, "utf8").digest("hex");

      if (validatedPatch.hash !== run.patchHash || actualPatchHash !== run.patchHash) {
        throw new Error("Queued patch hash does not match its stored content.");
      }

      workspace = await createTaskWorkspace(challenge);

      try {
        const gitOutput = await validateAndApplyPatch(workspace.root, run.patch);
        checks.push({ id: "patch-apply", kind: "public", status: "passed", exitCode: 0, durationMs: 0 });
        logParts.push("[patch-apply]\n", gitOutput, "\n");
      } catch (error) {
        checks.push({ id: "patch-apply", kind: "public", status: "failed", exitCode: 1, durationMs: 0 });
        logParts.push("[patch-apply]\n", error instanceof Error ? error.message : "Patch application failed.", "\n");

        return this.result("rejected", checks, logParts, workspace.root, startedAt, false, false);
      }

      const identity = currentWorkerIdentity();

      for (let index = 0; index < challenge.manifest.checks.length; index += 1) {
        const check = challenge.manifest.checks[index];
        const elapsedMs = Date.now() - startedAt;
        const remainingMs = TASK_RUN_TIMEOUT_MS - elapsedMs;

        if (remainingMs <= 0) {
          timedOut = true;
          checks.push(...skippedChecks(challenge.manifest.checks, index));
          break;
        }

        const containerName = `agentcode-${run.id.replace(/[^a-zA-Z0-9_.-]/g, "-").slice(0, 64)}-${index}`;
        const dockerCommand = buildRootlessDockerCommand({
          image: challenge.manifest.image,
          workspacePath: workspace.root,
          containerName,
          argv: check.argv,
          uid: identity.uid,
          gid: identity.gid,
          timeoutMs: remainingMs,
          readOnlyMounts: check.kind === "hidden" ? [{
            source: workspace.hidden,
            destination: "/workspace/.agentcode-hidden"
          }] : []
        });
        const commandResult = await runCapturedProcess(dockerCommand.command, dockerCommand.args, {
          timeoutMs: dockerCommand.timeoutMs,
          maxOutputBytes: RAW_OUTPUT_LIMIT_BYTES,
          onForcedTermination: () => killContainer(containerName)
        });

        timedOut ||= commandResult.timedOut;
        outputLimitExceeded ||= commandResult.outputLimitExceeded;
        const passed = commandResult.exitCode === 0 && !commandResult.timedOut && !commandResult.outputLimitExceeded;
        checks.push({
          id: check.id,
          kind: check.kind,
          status: passed ? "passed" : "failed",
          exitCode: commandResult.exitCode,
          durationMs: commandResult.durationMs
        });
        logParts.push(
          `[${check.id}]\n`,
          check.kind === "hidden" ? (passed ? "hidden check passed" : "hidden check failed") : commandResult.output,
          "\n"
        );

        if (!passed) {
          checks.push(...skippedChecks(challenge.manifest.checks, index + 1));
          break;
        }
      }

      const allPassed = checks.every((check) => check.status === "passed");
      const verdict = allPassed ? "accepted" : timedOut || outputLimitExceeded ? "error" : "rejected";
      return this.result(verdict, checks, logParts, workspace.root, startedAt, timedOut, outputLimitExceeded);
    } catch (error) {
      logParts.push("[runner-error]\n", error instanceof Error ? error.message : "Unknown runner error.", "\n");
      return this.result("error", checks, logParts, workspace?.root ?? "", startedAt, timedOut, outputLimitExceeded);
    } finally {
      if (workspace) {
        await removeTaskWorkspace(workspace);
      }
    }
  }

  private result(
    verdict: "accepted" | "rejected" | "error",
    checks: TaskCheckResult[],
    logParts: string[],
    workspace: string,
    startedAt: number,
    timedOut: boolean,
    outputLimitExceeded: boolean
  ): CompleteTaskRunInput {
    return {
      status: verdict === "accepted" ? "success" : "failed",
      checks,
      logs: sanitizeTaskLog(logParts.join(""), { workspacePaths: workspace ? [workspace] : [] }),
      verdict,
      resourceUsage: {
        durationMs: Date.now() - startedAt,
        timedOut,
        outputLimitExceeded
      }
    };
  }
}
