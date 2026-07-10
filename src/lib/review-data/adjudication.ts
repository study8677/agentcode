import { Prisma, ReviewAttemptStatus } from "@prisma/client";

import { getDb } from "../db";

import { ReviewDataError } from "./errors";

export const ADJUDICATION_RESULTS = ["hit", "partial", "miss"] as const;
export type AdjudicationResult = typeof ADJUDICATION_RESULTS[number];

export type RubricAdjudication = {
  rubricItemId: string;
  core: AdjudicationResult;
  impact: AdjudicationResult;
  testQuality: AdjudicationResult;
  fixOrRationale: AdjudicationResult;
};

export type AdjudicationInput = {
  mergeDecision: AdjudicationResult;
  items: RubricAdjudication[];
  falsePositives: Array<{ ruleId: string; confirmed: boolean }>;
  contradictionConfirmed: boolean;
  feedback: string;
  overrideReason: string;
};

function factor(result: AdjudicationResult) {
  return result === "hit" ? 1 : result === "partial" ? 0.5 : 0;
}

function average(items: RubricAdjudication[], key: keyof Omit<RubricAdjudication, "rubricItemId">) {
  if (items.length === 0) {
    return 0;
  }

  return items.reduce((sum, item) => sum + factor(item[key]), 0) / items.length;
}

function validateInput(input: AdjudicationInput) {
  if (!ADJUDICATION_RESULTS.includes(input.mergeDecision)) {
    throw new ReviewDataError("INVALID_ADJUDICATION", "mergeDecision must be hit, partial, or miss.", 422);
  }

  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new ReviewDataError("INVALID_ADJUDICATION", "At least one rubric item must be adjudicated.", 422);
  }

  if (!Array.isArray(input.falsePositives)) {
    throw new ReviewDataError("INVALID_ADJUDICATION", "falsePositives must be an array.", 422);
  }

  const ids = new Set<string>();

  for (const item of input.items) {
    if (!item.rubricItemId || ids.has(item.rubricItemId)) {
      throw new ReviewDataError("INVALID_ADJUDICATION", "Rubric item IDs must be present and unique.", 422);
    }

    ids.add(item.rubricItemId);

    for (const key of ["core", "impact", "testQuality", "fixOrRationale"] as const) {
      if (!ADJUDICATION_RESULTS.includes(item[key])) {
        throw new ReviewDataError("INVALID_ADJUDICATION", `${key} must be hit, partial, or miss.`, 422);
      }
    }
  }

  if (!input.feedback.trim() || !input.overrideReason.trim()) {
    throw new ReviewDataError(
      "INVALID_ADJUDICATION",
      "Final feedback and an audit reason are required.",
      422
    );
  }
}

function expectedRubricIds(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return [];
  }

  const record = snapshot as Record<string, unknown>;
  const reveal = record.reveal && typeof record.reveal === "object" && !Array.isArray(record.reveal)
    ? record.reveal as Record<string, unknown>
    : record;
  const candidates = Array.isArray(reveal.requiredFindings)
    ? reveal.requiredFindings
    : Array.isArray(reveal.rubricItems)
      ? reveal.rubricItems.filter((item) => !item || typeof item !== "object" || (item as Record<string, unknown>).required !== false)
      : [];

  return candidates
    .map((item) => item && typeof item === "object" ? (item as Record<string, unknown>).id : null)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

export function calculateAdjudicationScore(input: AdjudicationInput) {
  validateInput(input);

  const dimensions = {
    mergeDecision: Math.round(30 * factor(input.mergeDecision)),
    core: Math.round(30 * average(input.items, "core")),
    impact: Math.round(15 * average(input.items, "impact")),
    testQuality: Math.round(10 * average(input.items, "testQuality")),
    fixOrRationale: Math.round(15 * average(input.items, "fixOrRationale"))
  };
  const falsePositiveCount = input.falsePositives.filter((item) => item.confirmed).length;
  const falsePositivePenalty = Math.min(20, falsePositiveCount * 10);
  const contradictionPenalty = input.contradictionConfirmed ? 15 : 0;
  let score = Object.values(dimensions).reduce((sum, value) => sum + value, 0)
    - falsePositivePenalty
    - contradictionPenalty;

  if (input.mergeDecision === "miss" || input.contradictionConfirmed) {
    score = Math.min(score, 60);
  }

  if (input.items.every((item) => item.core === "miss")) {
    score = Math.min(score, 50);
  }

  return {
    score: Math.max(0, score),
    dimensions,
    penalties: {
      falsePositive: falsePositivePenalty,
      contradiction: contradictionPenalty
    }
  };
}

export async function adjudicateReviewAttempt(attemptId: string, reviewerGithubId: string, input: AdjudicationInput) {
  const calculated = calculateAdjudicationScore(input);
  const db = getDb();

  return db.$transaction(async (tx) => {
    const attempt = await tx.reviewAttempt.findUnique({
      where: { id: attemptId },
      include: { adjudication: true }
    });

    if (!attempt) {
      throw new ReviewDataError("ATTEMPT_NOT_FOUND", "Review attempt not found.", 404);
    }

    if (attempt.adjudication || attempt.status === ReviewAttemptStatus.ADJUDICATED) {
      throw new ReviewDataError("ALREADY_ADJUDICATED", "This attempt already has a final adjudication.", 409);
    }

    const expectedIds = expectedRubricIds(attempt.answerSnapshot);

    if (expectedIds.length > 0) {
      const submittedIds = new Set(input.items.map((item) => item.rubricItemId));
      const exactMatch = expectedIds.length === submittedIds.size && expectedIds.every((id) => submittedIds.has(id));

      if (!exactMatch) {
        throw new ReviewDataError(
          "INCOMPLETE_ADJUDICATION",
          "Every required rubric item must be adjudicated exactly once.",
          422,
          { expectedIds }
        );
      }
    }

    const adjudication = await tx.reviewAdjudication.create({
      data: {
        attemptId,
        reviewerGithubId,
        itemResults: {
          mergeDecision: input.mergeDecision,
          items: input.items,
          contradictionConfirmed: input.contradictionConfirmed,
          dimensions: calculated.dimensions,
          penalties: calculated.penalties
        } as Prisma.InputJsonValue,
        falsePositiveResults: input.falsePositives as Prisma.InputJsonValue,
        finalScore: calculated.score,
        feedback: input.feedback.trim(),
        overrideReason: input.overrideReason.trim()
      }
    });

    await tx.reviewAttempt.update({
      where: { id: attemptId },
      data: { status: ReviewAttemptStatus.ADJUDICATED }
    });

    return adjudication;
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
}
