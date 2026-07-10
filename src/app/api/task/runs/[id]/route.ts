import { NextResponse } from "next/server";

import { TaskRepositoryUnavailableError, TaskRunnerError } from "../../../../../lib/task-runner/errors";
import { isTaskRunnerEnabled } from "../../../../../lib/task-runner/feature";
import { getTaskRepository } from "../../../../../lib/task-runner/repository";
import { toTaskRunPublicView } from "../../../../../lib/task-runner/types";

export const runtime = "nodejs";

type TaskRunRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function errorResponse(error: TaskRunnerError): NextResponse {
  return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
}

export async function GET(_request: Request, { params }: TaskRunRouteProps): Promise<NextResponse> {
  if (!isTaskRunnerEnabled()) {
    return errorResponse(new TaskRunnerError("TASK_RUNNER_DISABLED", "Task runner is not available.", 404));
  }

  const { id } = await params;

  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(id)) {
    return errorResponse(new TaskRunnerError("RUN_NOT_FOUND", "Task run not found.", 404));
  }

  try {
    const run = await getTaskRepository().findRun(id);

    if (!run) {
      return errorResponse(new TaskRunnerError("RUN_NOT_FOUND", "Task run not found.", 404));
    }

    return NextResponse.json({ run: toTaskRunPublicView(run) });
  } catch (error) {
    if (error instanceof TaskRepositoryUnavailableError) {
      return errorResponse(new TaskRunnerError("TASK_RUNNER_UNAVAILABLE", "Task queue is temporarily unavailable.", 503));
    }

    return errorResponse(new TaskRunnerError("TASK_RUNNER_UNAVAILABLE", "Task runner is temporarily unavailable.", 503));
  }
}
