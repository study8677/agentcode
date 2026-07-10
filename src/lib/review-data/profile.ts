import { ReviewAttemptStatus } from "@prisma/client";

import { getReviewChallenge, getReviewChallengeList } from "@/lib/challenges/review";
import { getDb } from "@/lib/db";

type SkillProfile = {
  skill: string;
  score: number;
  samples: number;
  confidence: "low" | "medium" | "high";
};

type RoutableChallenge = ReturnType<typeof getReviewChallengeList>[number] & { href: string };

function challengeSkills(slug: string) {
  const challenge = getReviewChallenge(slug);
  const metadata = challenge?.metadata as { skills?: string[]; tags?: string[] } | undefined;

  return metadata?.skills?.filter(Boolean) ?? metadata?.tags ?? [];
}

function confidence(samples: number): SkillProfile["confidence"] {
  return samples >= 6 ? "high" : samples >= 3 ? "medium" : "low";
}

function dimensionScoreForSkill(itemResults: unknown, skill: string, fallback: number) {
  if (!itemResults || typeof itemResults !== "object" || Array.isArray(itemResults)) {
    return fallback;
  }

  const record = itemResults as Record<string, unknown>;
  const dimensions = record.dimensions && typeof record.dimensions === "object" && !Array.isArray(record.dimensions)
    ? record.dimensions as Record<string, unknown>
    : {};
  const penalties = record.penalties && typeof record.penalties === "object" && !Array.isArray(record.penalties)
    ? record.penalties as Record<string, unknown>
    : {};
  const normalized = (key: string, max: number) => {
    const value = dimensions[key];
    return typeof value === "number" ? Math.round(Math.max(0, Math.min(100, value / max * 100))) : fallback;
  };

  if (skill === "test-quality") return normalized("testQuality", 10);
  if (skill === "impact-reasoning") return normalized("impact", 15);
  if (skill === "remediation") return normalized("fixOrRationale", 15);
  if (skill === "false-positive-control") {
    const points = typeof penalties.falsePositive === "number" ? penalties.falsePositive : 0;
    return Math.max(0, 100 - points * 5);
  }
  if (skill === "evidence-location") return normalized("core", 30);

  return normalized("core", 30);
}

export async function getReviewProfile(sessionId: string) {
  const attempts = await getDb().reviewAttempt.findMany({
    where: { sessionId },
    include: { adjudication: true },
    orderBy: [{ challengeSlug: "asc" }, { attemptNumber: "asc" }]
  });
  const firstAttempts = attempts.filter((attempt) => attempt.isFirstAttempt);
  const finalizedFirstAttempts = firstAttempts.filter(
    (attempt) => attempt.status === ReviewAttemptStatus.ADJUDICATED && attempt.adjudication
  );
  const completedSlugs = new Set(finalizedFirstAttempts.map((attempt) => attempt.challengeSlug));
  const skillSamples = new Map<string, number[]>();

  for (const attempt of finalizedFirstAttempts) {
    for (const skill of challengeSkills(attempt.challengeSlug)) {
      const values = skillSamples.get(skill) ?? [];
      values.push(dimensionScoreForSkill(attempt.adjudication!.itemResults, skill, attempt.adjudication!.finalScore));
      skillSamples.set(skill, values);
    }
  }

  const skills: SkillProfile[] = [...skillSamples.entries()]
    .map(([skill, values]) => ({
      skill,
      score: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
      samples: values.length,
      confidence: confidence(values.length)
    }))
    .sort((first, second) => first.score - second.score || first.skill.localeCompare(second.skill));
  const overallScore = finalizedFirstAttempts.length > 0
    ? Math.round(finalizedFirstAttempts.reduce((sum, attempt) => sum + attempt.adjudication!.finalScore, 0) / finalizedFirstAttempts.length)
    : null;
  const weakest = skills[0] ?? null;
  const challengeList = getReviewChallengeList()
    .filter((challenge): challenge is RoutableChallenge => challenge.status === "ready" && typeof challenge.href === "string")
    .sort((first, second) => Number(first.id) - Number(second.id));
  const incomplete = challengeList.filter((challenge) => !completedSlugs.has(challenge.href.split("/").pop() ?? ""));
  const weakSkillCandidates = weakest
    ? incomplete.filter((challenge) => challengeSkills(challenge.href.split("/").pop() ?? "").includes(weakest.skill))
    : incomplete;
  const candidates = weakSkillCandidates.length > 0 ? weakSkillCandidates : incomplete;
  const preferMid = overallScore === null || overallScore < 70 || finalizedFirstAttempts.length < 3;
  const difficultyCandidates = preferMid
    ? candidates.filter((challenge) => challenge.difficulty === "mid")
    : candidates;
  let next: RoutableChallenge | null = (difficultyCandidates.length > 0 ? difficultyCandidates : candidates)[0] ?? null;

  if (!next && weakest) {
    const weakestAttempts = finalizedFirstAttempts
      .filter((attempt) => challengeSkills(attempt.challengeSlug).includes(weakest.skill))
      .sort((first, second) => first.adjudication!.finalScore - second.adjudication!.finalScore);
    const slug = weakestAttempts[0]?.challengeSlug;
    next = slug ? challengeList.find((challenge) => challenge.href.endsWith(`/${slug}`)) ?? null : null;
  }

  const retries = attempts
    .filter((attempt) => !attempt.isFirstAttempt)
    .map((attempt) => ({
      attemptId: attempt.id,
      challengeSlug: attempt.challengeSlug,
      attemptNumber: attempt.attemptNumber,
      provisionalScore: attempt.provisionalFeedback && typeof attempt.provisionalFeedback === "object" && !Array.isArray(attempt.provisionalFeedback)
        ? (attempt.provisionalFeedback as Record<string, unknown>).score ?? null
        : null,
      finalScore: attempt.adjudication?.finalScore ?? null,
      status: attempt.status === ReviewAttemptStatus.ADJUDICATED ? "adjudicated" : "pending"
    }));

  return {
    progress: {
      finalized: finalizedFirstAttempts.length,
      pending: firstAttempts.filter((attempt) => attempt.status === ReviewAttemptStatus.PENDING).length,
      total: challengeList.length
    },
    overallScore,
    skills,
    nextChallenge: next
      ? { slug: next.href.split("/").pop(), title: next.title, difficulty: next.difficulty, href: next.href }
      : null,
    recentAttempts: attempts
      .slice(-10)
      .reverse()
      .map((attempt) => ({
        attemptId: attempt.id,
        challengeSlug: attempt.challengeSlug,
        attemptNumber: attempt.attemptNumber,
        isFirstAttempt: attempt.isFirstAttempt,
        provisionalScore: attempt.provisionalFeedback && typeof attempt.provisionalFeedback === "object" && !Array.isArray(attempt.provisionalFeedback)
          ? (attempt.provisionalFeedback as Record<string, unknown>).score ?? null
          : null,
        finalScore: attempt.adjudication?.finalScore ?? null,
        status: attempt.status === ReviewAttemptStatus.ADJUDICATED ? "adjudicated" : "pending",
        adjudicationDeadline: attempt.adjudicationDeadline,
        createdAt: attempt.createdAt
      })),
    retries
  };
}
