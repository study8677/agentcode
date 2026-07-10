import { runCapturedProcess } from "./process-runner";

const GIT_TIMEOUT_MS = 10_000;
const GIT_OUTPUT_LIMIT_BYTES = 128 * 1024;

function gitEnvironment(): NodeJS.ProcessEnv {
  return {
    HOME: process.env.HOME,
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    NODE_ENV: process.env.NODE_ENV,
    PATH: process.env.PATH,
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_CONFIG_GLOBAL: "/dev/null"
  };
}

async function gitApply(workspace: string, patch: string, checkOnly: boolean): Promise<string> {
  const args = [
    "-c",
    "core.symlinks=false",
    "-c",
    "protocol.file.allow=never",
    "apply",
    ...(checkOnly ? ["--check"] : []),
    "--whitespace=error-all",
    "-"
  ];
  const result = await runCapturedProcess("git", args, {
    cwd: workspace,
    env: gitEnvironment(),
    input: patch,
    timeoutMs: GIT_TIMEOUT_MS,
    maxOutputBytes: GIT_OUTPUT_LIMIT_BYTES
  });

  if (result.exitCode !== 0 || result.timedOut || result.outputLimitExceeded) {
    const detail = result.output.trim() || "git apply rejected the patch";
    throw new Error(detail);
  }

  return result.output;
}

export async function validateAndApplyPatch(workspace: string, patch: string): Promise<string> {
  const checkOutput = await gitApply(workspace, patch, true);
  const applyOutput = await gitApply(workspace, patch, false);
  return [checkOutput, applyOutput].filter(Boolean).join("\n");
}
