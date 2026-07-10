export function isTaskRunnerEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.TASK_RUNNER_ENABLED?.trim().toLowerCase() === "true";
}
