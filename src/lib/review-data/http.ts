import { NextResponse } from "next/server";

import { asReviewDataError } from "./errors";

export function reviewDataErrorResponse(error: unknown) {
  const normalized = asReviewDataError(error);

  return NextResponse.json(
    {
      error: normalized.message,
      code: normalized.code,
      ...(normalized.details === undefined ? {} : { details: normalized.details })
    },
    { status: normalized.status }
  );
}
