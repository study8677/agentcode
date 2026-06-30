import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import type { ChallengeDifficulty, ChallengeStatus, LocalizedText } from "@/lib/types/problem";

export type ReviewSourceLink = {
  label: string;
  url: string;
};

export type ReviewTerm = {
  term: string;
  description: string;
};

export type ReviewBehaviorCheck = {
  input: string;
  expected: string;
  reviewQuestion: string;
};

export type ReviewScoringHints = {
  coreRiskTerms: string[];
  boundaryTerms: string[];
  testTerms: string[];
  fixTerms: string[];
};

export type ReviewChallengeMetadata = {
  id: string;
  order: number;
  slug: string;
  mode: "review";
  difficulty: ChallengeDifficulty;
  status: ChallengeStatus;
  title: LocalizedText;
  summary: LocalizedText;
  language: string;
  tags: string[];
  source: {
    project: string;
    benchmarkInstance?: string;
    upstreamIssue?: string;
    upstreamPullRequest?: string;
    securityAdvisory?: string;
    references: ReviewSourceLink[];
  };
  reviewTarget: {
    file: string;
    kind: string;
    note: string;
  };
  learningGoal: string;
  scenario: string;
  context: string[];
  reviewFocus: string[];
  terms: ReviewTerm[];
  behaviorChecks: ReviewBehaviorCheck[];
  scoringHints: ReviewScoringHints;
};

export type ReviewChallenge = {
  metadata: ReviewChallengeMetadata;
  diff: string;
};

const reviewRoot = join(process.cwd(), "challenges", "review");

export function getReviewChallengeSlugs() {
  return readdirSync(reviewRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((slug) => existsSync(join(reviewRoot, slug, "metadata.json")))
    .sort();
}

export function getReviewChallenge(slug: string): ReviewChallenge | null {
  const dir = join(reviewRoot, slug);
  const metadataPath = join(dir, "metadata.json");

  if (!existsSync(metadataPath)) {
    return null;
  }

  const metadata = JSON.parse(readFileSync(metadataPath, "utf8")) as ReviewChallengeMetadata;
  const diffPath = join(dir, metadata.reviewTarget.file);
  const diff = existsSync(diffPath) ? readFileSync(diffPath, "utf8") : "";

  return { metadata, diff };
}
