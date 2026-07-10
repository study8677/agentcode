import { NextResponse } from "next/server";

import { getTaskChallenge } from "../../../../../lib/task-runner/challenge";
import { TaskRepositoryUnavailableError, TaskRunnerError } from "../../../../../lib/task-runner/errors";
import { isTaskRunnerEnabled } from "../../../../../lib/task-runner/feature";
import { readTaskJsonBody } from "../../../../../lib/task-runner/http";
import { validateUnifiedDiff } from "../../../../../lib/task-runner/patch-validator";
import { getTaskRepository } from "../../../../../lib/task-runner/repository";

export const runtime = "nodejs";

type TaskSubmitRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

function errorResponse(error: TaskRunnerError): NextResponse {
  return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
}

export async function POST(request: Request, { params }: TaskSubmitRouteProps): Promise<NextResponse> {
  if (!isTaskRunnerEnabled()) {
    return errorResponse(new TaskRunnerError("TASK_RUNNER_DISABLED", "Task runner is not available.", 404));
  }

  const { slug } = await params;
  const challenge = getTaskChallenge(slug);

  if (!challenge) {
    return errorResponse(new TaskRunnerError("CHALLENGE_NOT_FOUND", "Task challenge not found.", 404));
  }

  try {
    const body = await readTaskJsonBody(request);

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new TaskRunnerError("INVALID_REQUEST", "Request body must be a JSON object.", 400);
    }

    const fields = body as Record<string, unknown>;

    if (typeof fields.patch !== "string") {
      throw new TaskRunnerError("INVALID_REQUEST", "patch must be a unified diff string.", 400);
    }

    const unknownFields = Object.keys(fields).filter((field) => field !== "patch");

    if (unknownFields.length > 0) {
      throw new TaskRunnerError("INVALID_REQUEST", "Only the patch field is accepted.", 400);
    }

    const validatedPatch = validateUnifiedDiff(fields.patch, challenge.manifest.editablePaths);
    const run = await getTaskRepository().enqueue({
      challengeSlug: challenge.manifest.slug,
      challengeVersion: challenge.version,
      imageDigest: challenge.manifest.image,
      patch: fields.patch,
      patchHash: validatedPatch.hash,
      patchBytes: validatedPatch.bytes
    });

    return NextResponse.json({ runId: run.id, status: run.status }, { status: 202 });
  } catch (error) {
    if (error instanceof TaskRunnerError) {
      return errorResponse(error);
    }

    if (error instanceof TaskRepositoryUnavailableError) {
      return errorResponse(new TaskRunnerError("TASK_RUNNER_UNAVAILABLE", "Task queue is temporarily unavailable.", 503));
    }

    return errorResponse(new TaskRunnerError("TASK_RUNNER_UNAVAILABLE", "Task runner is temporarily unavailable.", 503));
  }
}
