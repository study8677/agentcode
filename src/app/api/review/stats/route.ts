import { ReviewAttemptStatus } from "@prisma/client";
import { NextResponse } from "next/server";

import { getDb } from "@/lib/db";
import { reviewDataErrorResponse } from "@/lib/review-data/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const totalSessions = await db.anonymousReviewSession.count();

    if (totalSessions < 20) {
      return NextResponse.json({ publishable: false, totalSessions, acceptanceRates: {} });
    }

    const attempts = await db.reviewAttempt.findMany({
      where: {
        isFirstAttempt: true,
        status: ReviewAttemptStatus.ADJUDICATED,
        adjudication: { isNot: null }
      },
      select: {
        challengeSlug: true,
        adjudication: { select: { finalScore: true } }
      }
    });
    const totals = new Map<string, { accepted: number; total: number }>();

    for (const attempt of attempts) {
      if (!attempt.adjudication) continue;
      const current = totals.get(attempt.challengeSlug) ?? { accepted: 0, total: 0 };
      current.total += 1;
      current.accepted += attempt.adjudication.finalScore >= 80 ? 1 : 0;
      totals.set(attempt.challengeSlug, current);
    }

    return NextResponse.json({
      publishable: true,
      totalSessions,
      acceptanceRates: Object.fromEntries(
        [...totals].map(([slug, value]) => [slug, Math.round(value.accepted / value.total * 1_000) / 10])
      )
    });
  } catch (error) {
    return reviewDataErrorResponse(error);
  }
}
