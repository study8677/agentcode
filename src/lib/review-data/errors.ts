import { Prisma } from "@prisma/client";

import { DatabaseUnavailableError } from "../db";

export class ReviewDataError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "ReviewDataError";
  }
}

export function asReviewDataError(error: unknown): ReviewDataError {
  if (error instanceof ReviewDataError) {
    return error;
  }

  if (error instanceof DatabaseUnavailableError) {
    return new ReviewDataError(error.code, error.message, 503);
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return new ReviewDataError("DATABASE_REQUEST_FAILED", "The review data store rejected the request.", 503);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new ReviewDataError("DATABASE_UNAVAILABLE", "The review data store is unavailable.", 503);
  }

  return new ReviewDataError("INTERNAL_ERROR", "Unable to complete the review data request.", 500);
}
