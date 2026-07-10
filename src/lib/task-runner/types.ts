export const TASK_PATCH_MAX_BYTES = 256 * 1024;
export const TASK_LOG_MAX_BYTES = 1024 * 1024;
export const TASK_RUN_TIMEOUT_MS = 120_000;
export const TASK_WORKER_CONCURRENCY = 1 as const;

export type TaskRunStatus = "queued" | "running" | "success" | "failed";
export type TaskVerdict = "accepted" | "rejected" | "error" | null;
export type TaskCheckStatus = "passed" | "failed" | "skipped";

export type TaskCheckResult = {
  id: string;
  kind: "public" | "hidden";
  status: TaskCheckStatus;
  exitCode: number | null;
  durationMs: number;
};

export type TaskResourceUsage = {
  durationMs: number;
  timedOut: boolean;
  outputLimitExceeded: boolean;
};

export type TaskRunRecord = {
  id: string;
  submissionId: string;
  challengeSlug: string;
  challengeVersion: string;
  imageDigest: string;
  status: TaskRunStatus;
  checks: TaskCheckResult[];
  logs: string;
  verdict: TaskVerdict;
  resourceUsage: TaskResourceUsage | null;
  queuedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
};

export type ClaimedTaskRun = TaskRunRecord & {
  patch: string;
  patchHash: string;
  workerId: string;
};

export type EnqueueTaskInput = {
  challengeSlug: string;
  challengeVersion: string;
  imageDigest: string;
  patch: string;
  patchHash: string;
  patchBytes: number;
};

export type CompleteTaskRunInput = {
  status: "success" | "failed";
  checks: TaskCheckResult[];
  logs: string;
  verdict: Exclude<TaskVerdict, null>;
  resourceUsage: TaskResourceUsage;
};

export type TaskRunPublicView = Omit<TaskRunRecord, "submissionId" | "imageDigest">;

export function toTaskRunPublicView(run: TaskRunRecord): TaskRunPublicView {
  return {
    id: run.id,
    challengeSlug: run.challengeSlug,
    challengeVersion: run.challengeVersion,
    status: run.status,
    checks: run.checks,
    logs: run.logs,
    verdict: run.verdict,
    resourceUsage: run.resourceUsage,
    queuedAt: run.queuedAt,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt
  };
}
