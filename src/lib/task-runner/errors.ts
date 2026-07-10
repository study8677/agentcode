export type TaskRunnerErrorCode =
  | "TASK_RUNNER_DISABLED"
  | "TASK_RUNNER_UNAVAILABLE"
  | "INVALID_REQUEST"
  | "PATCH_TOO_LARGE"
  | "INVALID_PATCH"
  | "UNSAFE_PATCH"
  | "CHALLENGE_NOT_FOUND"
  | "RUN_NOT_FOUND";

export class TaskRunnerError extends Error {
  constructor(
    readonly code: TaskRunnerErrorCode,
    message: string,
    readonly status: number,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = "TaskRunnerError";
  }
}

export class TaskRepositoryUnavailableError extends Error {
  constructor(message = "Task queue storage is unavailable.", options?: ErrorOptions) {
    super(message, options);
    this.name = "TaskRepositoryUnavailableError";
  }
}
