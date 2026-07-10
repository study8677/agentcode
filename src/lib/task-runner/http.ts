import { TaskRunnerError } from "./errors";

export const TASK_REQUEST_MAX_BYTES = 600 * 1024;

export async function readTaskJsonBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.startsWith("application/json")) {
    throw new TaskRunnerError("INVALID_REQUEST", "Content-Type must be application/json.", 415);
  }

  const declaredLength = Number(request.headers.get("content-length"));

  if (Number.isFinite(declaredLength) && declaredLength > TASK_REQUEST_MAX_BYTES) {
    throw new TaskRunnerError("PATCH_TOO_LARGE", "Request body is too large.", 413);
  }

  if (!request.body) {
    throw new TaskRunnerError("INVALID_REQUEST", "Request body is required.", 400);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    bytes += value.byteLength;

    if (bytes > TASK_REQUEST_MAX_BYTES) {
      await reader.cancel();
      throw new TaskRunnerError("PATCH_TOO_LARGE", "Request body is too large.", 413);
    }

    chunks.push(value);
  }

  const body = Buffer.concat(chunks).toString("utf8");

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new TaskRunnerError("INVALID_REQUEST", "Request body must be valid JSON.", 400);
  }
}
