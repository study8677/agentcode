import { sanitizeTaskLog } from "../src/lib/task-runner/logs";
import type { TaskRepository } from "../src/lib/task-runner/repository";
import { TASK_WORKER_CONCURRENCY, type CompleteTaskRunInput } from "../src/lib/task-runner/types";
import type { TaskExecutor } from "./docker-executor";

export type TaskWorkerOptions = {
  workerId: string;
  pollIntervalMs?: number;
};

function waitForNextPoll(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(resolve, delayMs);
    signal?.addEventListener("abort", () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
}

export class TaskWorker {
  readonly concurrency = TASK_WORKER_CONCURRENCY;
  private busy = false;
  private readonly pollIntervalMs: number;

  constructor(
    private readonly repository: TaskRepository,
    private readonly executor: TaskExecutor,
    private readonly options: TaskWorkerOptions
  ) {
    this.pollIntervalMs = options.pollIntervalMs ?? 1_000;

    if (!options.workerId || this.pollIntervalMs < 100 || this.pollIntervalMs > 60_000) {
      throw new Error("Task worker options are invalid.");
    }
  }

  async runOnce(): Promise<boolean> {
    if (this.busy) {
      return false;
    }

    this.busy = true;

    try {
      const run = await this.repository.claimNext(this.options.workerId);

      if (!run) {
        return false;
      }

      let result: CompleteTaskRunInput;

      try {
        result = await this.executor.execute(run);
      } catch (error) {
        result = {
          status: "failed",
          checks: [],
          logs: sanitizeTaskLog(`[runner-error]\n${error instanceof Error ? error.message : "Unknown task worker error."}\n`),
          verdict: "error",
          resourceUsage: {
            durationMs: 0,
            timedOut: false,
            outputLimitExceeded: false
          }
        };
      }

      await this.repository.complete(run.id, this.options.workerId, result);
      return true;
    } finally {
      this.busy = false;
    }
  }

  async start(signal?: AbortSignal): Promise<void> {
    while (!signal?.aborted) {
      const processed = await this.runOnce();

      if (!processed) {
        await waitForNextPoll(this.pollIntervalMs, signal);
      }
    }
  }
}
