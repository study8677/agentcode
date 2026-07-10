import { access } from "node:fs/promises";

import { assertPinnedImage } from "../src/lib/task-runner/docker-command";
import { isTaskRunnerEnabled } from "../src/lib/task-runner/feature";
import { runCapturedProcess } from "./process-runner";

const PREFLIGHT_TIMEOUT_MS = 10_000;
const PREFLIGHT_OUTPUT_BYTES = 64 * 1024;

async function runDockerPreflight(args: string[]): Promise<string> {
  const result = await runCapturedProcess("docker", args, {
    timeoutMs: PREFLIGHT_TIMEOUT_MS,
    maxOutputBytes: PREFLIGHT_OUTPUT_BYTES,
    env: {
      DOCKER_HOST: process.env.DOCKER_HOST,
      HOME: process.env.HOME,
      NODE_ENV: process.env.NODE_ENV,
      PATH: process.env.PATH
    }
  });

  if (result.exitCode !== 0 || result.timedOut || result.outputLimitExceeded) {
    throw new Error("Rootless Docker preflight command failed.");
  }

  return result.output;
}

export async function assertWorkerPreflight(image: string): Promise<void> {
  if (!isTaskRunnerEnabled()) {
    throw new Error("TASK_RUNNER_ENABLED must be true before the worker starts.");
  }

  if (process.platform !== "linux") {
    throw new Error("Production task worker is supported only on Linux.");
  }

  const uid = process.getuid?.();
  const gid = process.getgid?.();

  if (!uid || !gid) {
    throw new Error("Task worker must run as a dedicated non-root user.");
  }

  await access("/sys/fs/cgroup/cgroup.controllers");
  assertPinnedImage(image);

  const securityOptions = await runDockerPreflight(["info", "--format", "{{json .SecurityOptions}}"]);

  if (!securityOptions.toLowerCase().includes("rootless")) {
    throw new Error("Docker daemon is not running in rootless mode.");
  }

  await runDockerPreflight(["image", "inspect", image, "--format", "{{.Id}}"]);
}
