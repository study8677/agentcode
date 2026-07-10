import { ReviewAttemptStatus } from "@prisma/client";

import { getDb } from "@/lib/db";

import { ReviewDataError } from "./errors";

export type ReviewQueueFilter = "pending" | "overdue" | "adjudicated" | "all";

export async function listReviewQueue(filter: ReviewQueueFilter = "pending", limit = 100) {
  const now = new Date();
  const where = filter === "pending"
    ? { status: ReviewAttemptStatus.PENDING }
    : filter === "overdue"
      ? { status: ReviewAttemptStatus.PENDING, adjudicationDeadline: { lt: now } }
      : filter === "adjudicated"
        ? { status: ReviewAttemptStatus.ADJUDICATED }
        : {};

  return getDb().reviewAttempt.findMany({
    where,
    orderBy: filter === "adjudicated"
      ? [{ updatedAt: "desc" }]
      : [{ adjudicationDeadline: "asc" }, { createdAt: "asc" }],
    take: Math.min(Math.max(limit, 1), 200),
    select: {
      id: true,
      challengeSlug: true,
      challengeVersion: true,
      evaluatorVersion: true,
      attemptNumber: true,
      isFirstAttempt: true,
      durationMs: true,
      adjudicationDeadline: true,
      status: true,
      createdAt: true,
      provisionalFeedback: true,
      adjudication: {
        select: { finalScore: true, reviewerGithubId: true, createdAt: true }
      }
    }
  });
}

export async function getReviewAttemptForAdmin(attemptId: string) {
  const attempt = await getDb().reviewAttempt.findUnique({
    where: { id: attemptId },
    include: { adjudication: true }
  });

  if (!attempt) {
    throw new ReviewDataError("ATTEMPT_NOT_FOUND", "Review attempt not found.", 404);
  }

  return attempt;
}

function numericScore(feedback: unknown) {
  if (!feedback || typeof feedback !== "object") {
    return null;
  }

  const score = (feedback as Record<string, unknown>).score;
  return typeof score === "number" && Number.isFinite(score) ? score : null;
}

function mergePassed(feedback: unknown) {
  if (!feedback || typeof feedback !== "object") {
    return null;
  }

  const record = feedback as Record<string, unknown>;
  const dimensions = record.dimensions;

  if (dimensions && typeof dimensions === "object") {
    const merge = (dimensions as Record<string, unknown>).mergeDecision;

    if (typeof merge === "number") {
      return merge >= 30;
    }
  }

  const checks = record.checks;

  if (Array.isArray(checks)) {
    const mergeCheck = checks.find((item) => item && typeof item === "object" && (item as Record<string, unknown>).label === "合并判断");
    const passed = mergeCheck && (mergeCheck as Record<string, unknown>).passed;
    return typeof passed === "boolean" ? passed : null;
  }

  return null;
}

export async function getReviewMetrics() {
  const db = getDb();
  const now = new Date();
  const soon = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  const [pending, overdue, dueSoon, totalSessions, recentFinals] = await Promise.all([
    db.reviewAttempt.count({ where: { status: ReviewAttemptStatus.PENDING } }),
    db.reviewAttempt.count({ where: { status: ReviewAttemptStatus.PENDING, adjudicationDeadline: { lt: now } } }),
    db.reviewAttempt.count({
      where: {
        status: ReviewAttemptStatus.PENDING,
        adjudicationDeadline: { gte: now, lte: soon }
      }
    }),
    db.anonymousReviewSession.count(),
    db.reviewAttempt.findMany({
      where: { status: ReviewAttemptStatus.ADJUDICATED, adjudication: { isNot: null } },
      include: { adjudication: true },
      orderBy: { updatedAt: "desc" },
      take: 1000
    })
  ]);

  let scoreSamples = 0;
  let absoluteError = 0;
  let mergeSamples = 0;
  let mergeAgreements = 0;
  let withinSla = 0;

  for (const attempt of recentFinals) {
    if (!attempt.adjudication) {
      continue;
    }

    const provisional = numericScore(attempt.provisionalFeedback);

    if (provisional !== null) {
      scoreSamples += 1;
      absoluteError += Math.abs(provisional - attempt.adjudication.finalScore);
    }

    const provisionalMerge = mergePassed(attempt.provisionalFeedback);
    const itemResults = attempt.adjudication.itemResults;
    const finalMerge = itemResults && typeof itemResults === "object" && !Array.isArray(itemResults)
      ? (itemResults as Record<string, unknown>).mergeDecision
      : null;

    if (provisionalMerge !== null && typeof finalMerge === "string") {
      mergeSamples += 1;
      mergeAgreements += provisionalMerge === (finalMerge === "hit") ? 1 : 0;
    }

    withinSla += attempt.adjudication.createdAt <= attempt.adjudicationDeadline ? 1 : 0;
  }

  return {
    queue: { pending, overdue, dueSoon },
    sessions: { total: totalSessions, acceptanceRatePublishable: totalSessions >= 20 },
    adjudication: {
      samples: recentFinals.length,
      slaRate: recentFinals.length > 0 ? withinSla / recentFinals.length : null,
      scoreMae: scoreSamples > 0 ? absoluteError / scoreSamples : null,
      mergeAgreementRate: mergeSamples > 0 ? mergeAgreements / mergeSamples : null,
      mergeSamples
    }
  };
}
