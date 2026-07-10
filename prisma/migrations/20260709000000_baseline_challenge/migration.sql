-- Baseline the schema that existed before migrations were introduced. The
-- guards make this safe for installations that previously used `prisma db push`.
DO $$ BEGIN
  CREATE TYPE "ChallengeMode" AS ENUM ('TASK', 'REVIEW');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ChallengeDifficulty" AS ENUM ('JUNIOR', 'MID', 'SENIOR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ChallengeStatus" AS ENUM ('DRAFT', 'READY', 'NEEDS_REVIEW');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RunStatus" AS ENUM ('IDLE', 'QUEUED', 'RUNNING', 'SUCCESS', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "Challenge" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "mode" "ChallengeMode" NOT NULL,
    "difficulty" "ChallengeDifficulty" NOT NULL,
    "status" "ChallengeStatus" NOT NULL DEFAULT 'DRAFT',
    "acceptanceRate" DOUBLE PRECISION NOT NULL,
    "tags" TEXT[],
    "runStatus" "RunStatus" NOT NULL DEFAULT 'IDLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Challenge_slug_key" ON "Challenge"("slug");
