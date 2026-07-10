import { Prisma } from "@prisma/client";

import { getDb } from "@/lib/db";

export async function purgeExpiredReviewData(now = new Date()) {
  const rawDraftCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sessionCutoff = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  const db = getDb();
  const rawDrafts = await db.reviewAttempt.updateMany({
    where: { createdAt: { lt: rawDraftCutoff }, rawDraft: { not: Prisma.DbNull } },
    data: { rawDraft: Prisma.DbNull }
  });
  const sessions = await db.anonymousReviewSession.deleteMany({
    where: { lastSeenAt: { lt: sessionCutoff } }
  });

  return {
    rawDraftsPurged: rawDrafts.count,
    sessionsDeleted: sessions.count,
    ranAt: now
  };
}
