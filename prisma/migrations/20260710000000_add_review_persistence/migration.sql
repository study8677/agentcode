-- CreateEnum
CREATE TYPE "ReviewAttemptStatus" AS ENUM ('PENDING', 'ADJUDICATED');

-- CreateEnum
CREATE TYPE "TaskVerdict" AS ENUM ('ACCEPTED', 'REJECTED', 'ERROR');

-- CreateTable
CREATE TABLE "AnonymousReviewSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnonymousReviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewAttempt" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "challengeSlug" TEXT NOT NULL,
    "challengeVersion" TEXT NOT NULL,
    "evaluatorVersion" TEXT NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "isFirstAttempt" BOOLEAN NOT NULL,
    "retryOfId" TEXT,
    "rawDraft" JSONB,
    "provisionalFeedback" JSONB NOT NULL,
    "answerSnapshot" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "adjudicationDeadline" TIMESTAMP(3) NOT NULL,
    "status" "ReviewAttemptStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReviewAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewAdjudication" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "reviewerGithubId" TEXT NOT NULL,
    "itemResults" JSONB NOT NULL,
    "falsePositiveResults" JSONB NOT NULL,
    "finalScore" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "overrideReason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ReviewAdjudication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AnonymousReviewSession_tokenHash_key" ON "AnonymousReviewSession"("tokenHash");
CREATE INDEX "AnonymousReviewSession_lastSeenAt_idx" ON "AnonymousReviewSession"("lastSeenAt");
CREATE UNIQUE INDEX "ReviewAttempt_sessionId_submissionId_key" ON "ReviewAttempt"("sessionId", "submissionId");
CREATE UNIQUE INDEX "ReviewAttempt_sessionId_challengeSlug_attemptNumber_key" ON "ReviewAttempt"("sessionId", "challengeSlug", "attemptNumber");
CREATE INDEX "ReviewAttempt_sessionId_challengeSlug_createdAt_idx" ON "ReviewAttempt"("sessionId", "challengeSlug", "createdAt");
CREATE INDEX "ReviewAttempt_status_adjudicationDeadline_idx" ON "ReviewAttempt"("status", "adjudicationDeadline");
CREATE INDEX "ReviewAttempt_createdAt_idx" ON "ReviewAttempt"("createdAt");
CREATE UNIQUE INDEX "ReviewAdjudication_attemptId_key" ON "ReviewAdjudication"("attemptId");
CREATE INDEX "ReviewAdjudication_reviewerGithubId_createdAt_idx" ON "ReviewAdjudication"("reviewerGithubId", "createdAt");
CREATE INDEX "ReviewAdjudication_createdAt_idx" ON "ReviewAdjudication"("createdAt");

-- AddForeignKey
ALTER TABLE "ReviewAttempt" ADD CONSTRAINT "ReviewAttempt_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AnonymousReviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewAttempt" ADD CONSTRAINT "ReviewAttempt_retryOfId_fkey" FOREIGN KEY ("retryOfId") REFERENCES "ReviewAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ReviewAdjudication" ADD CONSTRAINT "ReviewAdjudication_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ReviewAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "TaskSubmission" (
    "id" TEXT NOT NULL,
    "challengeSlug" TEXT NOT NULL,
    "challengeVersion" TEXT NOT NULL,
    "patchHash" TEXT NOT NULL,
    "patchText" TEXT NOT NULL,
    "patchBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TaskSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskRun" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "challengeSlug" TEXT NOT NULL,
    "challengeVersion" TEXT NOT NULL,
    "imageDigest" TEXT NOT NULL,
    "status" "RunStatus" NOT NULL DEFAULT 'QUEUED',
    "structuredChecks" JSONB NOT NULL,
    "logs" TEXT NOT NULL,
    "verdict" "TaskVerdict",
    "resourceUsage" JSONB,
    "workerId" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    CONSTRAINT "TaskRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaskSubmission_challengeSlug_createdAt_idx" ON "TaskSubmission"("challengeSlug", "createdAt");
CREATE INDEX "TaskSubmission_patchHash_idx" ON "TaskSubmission"("patchHash");
CREATE UNIQUE INDEX "TaskRun_submissionId_key" ON "TaskRun"("submissionId");
CREATE INDEX "TaskRun_status_queuedAt_idx" ON "TaskRun"("status", "queuedAt");
CREATE INDEX "TaskRun_challengeSlug_queuedAt_idx" ON "TaskRun"("challengeSlug", "queuedAt");
ALTER TABLE "TaskRun" ADD CONSTRAINT "TaskRun_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "TaskSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
