import { Prisma, ReviewAttemptStatus } from "@prisma/client";

import { getDb } from "@/lib/db";

import { ReviewDataError } from "./errors";

const SUBMISSION_ID_PATTERN = /^[A-Za-z0-9_-]{8,128}$/;
const MAX_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function jsonValue(value: unknown, field: string): Prisma.InputJsonValue {
  try {
    const normalized = JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

    if (normalized === undefined) {
      throw new Error("undefined");
    }

    return normalized;
  } catch {
    throw new ReviewDataError("INVALID_JSON_VALUE", `${field} must be JSON serializable.`, 422);
  }
}

function validateSubmissionId(submissionId: string) {
  if (!SUBMISSION_ID_PATTERN.test(submissionId)) {
    throw new ReviewDataError(
      "INVALID_SUBMISSION_ID",
      "submissionId must contain 8-128 letters, numbers, underscores, or hyphens.",
      422
    );
  }
}

function normalizeTiming(timing?: { startedAt?: string | Date | null; durationMs?: number | null }) {
  let startedAt: Date | null = null;

  if (timing?.startedAt) {
    startedAt = timing.startedAt instanceof Date ? timing.startedAt : new Date(timing.startedAt);

    if (Number.isNaN(startedAt.getTime()) || startedAt.getTime() > Date.now() + 60_000) {
      throw new ReviewDataError("INVALID_TIMING", "timing.startedAt is invalid.", 422);
    }
  }

  const durationMs = timing?.durationMs ?? null;

  if (durationMs !== null && (!Number.isInteger(durationMs) || durationMs < 0 || durationMs > MAX_DURATION_MS)) {
    throw new ReviewDataError("INVALID_TIMING", "timing.durationMs is invalid.", 422);
  }

  return { startedAt, durationMs };
}

export type CreateReviewAttemptInput = {
  sessionId: string;
  submissionId: string;
  challengeSlug: string;
  challengeVersion: string;
  evaluatorVersion: string;
  draft: unknown;
  provisionalFeedback: unknown;
  answerSnapshot: unknown;
  timing?: {
    startedAt?: string | Date | null;
    durationMs?: number | null;
  };
};

export async function createReviewAttempt(input: CreateReviewAttemptInput) {
  validateSubmissionId(input.submissionId);

  if (!input.challengeSlug || !input.challengeVersion || !input.evaluatorVersion) {
    throw new ReviewDataError("INVALID_ATTEMPT", "Challenge and evaluator versions are required.", 422);
  }

  const timing = normalizeTiming(input.timing);
  const db = getDb();

  const existing = await db.reviewAttempt.findUnique({
    where: {
      sessionId_submissionId: {
        sessionId: input.sessionId,
        submissionId: input.submissionId
      }
    },
    include: { adjudication: true }
  });

  if (existing) {
    return { attempt: existing, idempotent: true };
  }

  try {
    const attempt = await db.$transaction(async (tx) => {
      const previous = await tx.reviewAttempt.findFirst({
        where: { sessionId: input.sessionId, challengeSlug: input.challengeSlug },
        orderBy: [{ attemptNumber: "desc" }, { createdAt: "desc" }]
      });
      const now = new Date();

      return tx.reviewAttempt.create({
        data: {
          sessionId: input.sessionId,
          submissionId: input.submissionId,
          challengeSlug: input.challengeSlug,
          challengeVersion: input.challengeVersion,
          evaluatorVersion: input.evaluatorVersion,
          attemptNumber: (previous?.attemptNumber ?? 0) + 1,
          isFirstAttempt: previous === null,
          retryOfId: previous?.id,
          rawDraft: jsonValue(input.draft, "draft"),
          provisionalFeedback: jsonValue(input.provisionalFeedback, "provisionalFeedback"),
          answerSnapshot: jsonValue(input.answerSnapshot, "answerSnapshot"),
          startedAt: timing.startedAt,
          durationMs: timing.durationMs,
          adjudicationDeadline: new Date(now.getTime() + 24 * 60 * 60 * 1000)
        },
        include: { adjudication: true }
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    return { attempt, idempotent: false };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const duplicate = await db.reviewAttempt.findUnique({
        where: {
          sessionId_submissionId: {
            sessionId: input.sessionId,
            submissionId: input.submissionId
          }
        },
        include: { adjudication: true }
      });

      if (duplicate) {
        return { attempt: duplicate, idempotent: true };
      }
    }

    throw error;
  }
}

export async function getOwnedReviewAttempt(sessionId: string, attemptId: string) {
  const attempt = await getDb().reviewAttempt.findFirst({
    where: { id: attemptId, sessionId },
    include: { adjudication: true }
  });

  if (!attempt) {
    throw new ReviewDataError("ATTEMPT_NOT_FOUND", "Review attempt not found.", 404);
  }

  return attempt;
}

export function serializeReviewAttempt(attempt: Awaited<ReturnType<typeof getOwnedReviewAttempt>>) {
  return {
    id: attempt.id,
    challengeSlug: attempt.challengeSlug,
    challengeVersion: attempt.challengeVersion,
    evaluatorVersion: attempt.evaluatorVersion,
    attemptNumber: attempt.attemptNumber,
    isFirstAttempt: attempt.isFirstAttempt,
    retryOfId: attempt.retryOfId,
    provisionalFeedback: attempt.provisionalFeedback,
    startedAt: attempt.startedAt,
    durationMs: attempt.durationMs,
    adjudicationDeadline: attempt.adjudicationDeadline,
    status: attempt.status === ReviewAttemptStatus.ADJUDICATED ? "adjudicated" : "pending",
    createdAt: attempt.createdAt,
    final: attempt.adjudication
      ? {
          score: attempt.adjudication.finalScore,
          feedback: attempt.adjudication.feedback,
          itemResults: attempt.adjudication.itemResults,
          falsePositiveResults: attempt.adjudication.falsePositiveResults,
          adjudicatedAt: attempt.adjudication.createdAt
        }
      : null
  };
}
