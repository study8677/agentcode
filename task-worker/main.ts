import { hostname } from "node:os";

import { getTaskChallenge } from "../src/lib/task-runner/challenge";
import { createDefaultTaskRepository } from "../src/lib/task-runner/repository";
import { DockerTaskExecutor } from "./docker-executor";
import { assertWorkerPreflight } from "./preflight";
import { TaskWorker } from "./worker";

async function main(): Promise<void> {
  const challenge = getTaskChallenge("001-typescript-slug-normalization");

  if (!challenge) {
    throw new Error("Runner Alpha task challenge is missing.");
  }

  await assertWorkerPreflight(challenge.manifest.image);
  const worker = new TaskWorker(
    createDefaultTaskRepository(),
    new DockerTaskExecutor(),
    { workerId: `${hostname()}-${process.pid}` }
  );
  const controller = new AbortController();
  const shutdown = () => controller.abort();

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  await worker.start(controller.signal);
}

void main().catch((error: unknown) => {
  process.stderr.write(`Task worker failed to start: ${error instanceof Error ? error.message : "unknown error"}\n`);
  process.exitCode = 1;
});
