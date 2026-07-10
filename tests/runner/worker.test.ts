import { describe, expect, it } from "vitest";

import { InMemoryTaskRepository } from "../../src/lib/task-runner/repository";
import type { CompleteTaskRunInput } from "../../src/lib/task-runner/types";
import type { TaskExecutor } from "../../task-worker/docker-executor";
import { TaskWorker } from "../../task-worker/worker";
import { VALID_TASK_PATCH } from "./fixtures";

const IMAGE = "node:22@sha256:b04ce4ae4e95b522112c2e5c52f781471a5cbc3b594527bcddedee9bc48c03a0";

class FakeExecutor implements TaskExecutor {
  active = 0;
  maxActive = 0;

  async execute(): Promise<CompleteTaskRunInput> {
    this.active += 1;
    this.maxActive = Math.max(this.maxActive, this.active);
    await Promise.resolve();
    this.active -= 1;

    return {
      status: "success",
      checks: [{ id: "fake", kind: "public", status: "passed", exitCode: 0, durationMs: 1 }],
      logs: "ok",
      verdict: "accepted",
      resourceUsage: { durationMs: 1, timedOut: false, outputLimitExceeded: false }
    };
  }
}

describe("TaskWorker", () => {
  it("enforces process-local concurrency one", async () => {
    const repository = new InMemoryTaskRepository();
    const executor = new FakeExecutor();
    const worker = new TaskWorker(repository, executor, { workerId: "test-worker", pollIntervalMs: 100 });

    await repository.enqueue({
      challengeSlug: "task",
      challengeVersion: "v1",
      imageDigest: IMAGE,
      patch: VALID_TASK_PATCH,
      patchHash: "hash",
      patchBytes: Buffer.byteLength(VALID_TASK_PATCH)
    });
    await repository.enqueue({
      challengeSlug: "task",
      challengeVersion: "v1",
      imageDigest: IMAGE,
      patch: VALID_TASK_PATCH,
      patchHash: "hash",
      patchBytes: Buffer.byteLength(VALID_TASK_PATCH)
    });

    const firstPair = await Promise.all([worker.runOnce(), worker.runOnce()]);
    expect(firstPair.filter(Boolean)).toHaveLength(1);
    expect(await worker.runOnce()).toBe(true);
    expect(executor.maxActive).toBe(1);
    expect(worker.concurrency).toBe(1);
  });
});
