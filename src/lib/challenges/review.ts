import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import type { Challenge, ChallengeDifficulty, ChallengeStatus, LocalizedText } from "@/lib/types/problem";

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

export type ReviewPrBrief = {
  title: string;
  author: string;
  body: string[];
};

export type ReviewAnalysis = {
  dimension?: string;
  notes: string[];
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
  /**
   * Pre-submit content. `pr` is written in the AI author's voice: it may claim
   * only what a confident PR author would claim, never hint at the hidden flaw.
   * `background` is neutral domain context needed to read the diff.
   */
  pr?: ReviewPrBrief;
  background?: string[];
  /** Post-submit content. Never rendered before the user submits a review. */
  analysis?: ReviewAnalysis;
  learningGoal: string;
  /** @deprecated legacy pre-rewrite fields, kept for migration fallback */
  scenario?: string;
  /** @deprecated legacy pre-rewrite fields, kept for migration fallback */
  context?: string[];
  reviewFocus?: string[];
  terms: ReviewTerm[];
  behaviorChecks: ReviewBehaviorCheck[];
  scoringHints: ReviewScoringHints;
};

export type ReviewChallengeFile = {
  name: string;
  label: string;
  language: "diff" | "markdown" | "json" | "text";
  content: string;
};

export type ReviewExpectedFinding = {
  id: string;
  severity: string;
  summary: string;
  expectedReasoning?: string;
  acceptableFix?: string;
  matchTerms?: string[][];
};

export type ReviewExpectedFindings = {
  canMerge: boolean;
  mergeRationale?: string;
  requiredFindings: ReviewExpectedFinding[];
  optionalFindings?: ReviewExpectedFinding[];
  disallowedConclusions?: string[];
};

/** Everything shown only after the user submits a review. */
export type ReviewReveal = {
  canMerge: boolean;
  mergeRationale?: string;
  requiredFindings: ReviewExpectedFinding[];
  optionalFindings: ReviewExpectedFinding[];
  analysisNotes: string[];
  behaviorChecks: ReviewBehaviorCheck[];
  learningGoal: string;
  references: ReviewSourceLink[];
};

export type ReviewChallenge = {
  metadata: ReviewChallengeMetadata;
  files: ReviewChallengeFile[];
  reveal: ReviewReveal;
};

const reviewRoot = join(process.cwd(), "challenges", "review");

function isSafeChallengeFileName(fileName: string) {
  return Boolean(fileName) && !fileName.includes("/") && !fileName.includes("\\") && fileName !== "." && fileName !== "..";
}

function getFileLanguage(fileName: string): ReviewChallengeFile["language"] {
  if (fileName.endsWith(".diff") || fileName.endsWith(".patch")) {
    return "diff";
  }

  if (fileName.endsWith(".md")) {
    return "markdown";
  }

  if (fileName.endsWith(".json")) {
    return "json";
  }

  return "text";
}

export function getReviewPrBrief(metadata: ReviewChallengeMetadata): ReviewPrBrief {
  if (metadata.pr) {
    return metadata.pr;
  }

  return {
    title: metadata.title.zh,
    author: "ai-agent",
    body: metadata.scenario ? [metadata.scenario] : []
  };
}

export function getReviewBackground(metadata: ReviewChallengeMetadata): string[] {
  return metadata.background ?? metadata.context ?? [];
}

function getVirtualFiles(metadata: ReviewChallengeMetadata): ReviewChallengeFile[] {
  const pr = getReviewPrBrief(metadata);
  const background = getReviewBackground(metadata);

  const prDescription = [
    `# ${pr.title}`,
    "",
    `> 作者：${pr.author} · 状态：CI passed · 请求 review`,
    "",
    ...pr.body,
    ""
  ].join("\n");

  const task = [
    "# 你的任务",
    "",
    "你是这个仓库的 reviewer。阅读 PR 描述和 diff，判断这个 PR 能不能合并。",
    "",
    `项目：${metadata.source.project}`,
    `语言 / 领域：${metadata.language}`,
    "",
    "## 你需要提交",
    "",
    "- 是否可以合并：可以 / 不可以 / 需要更多信息",
    "- Finding：具体问题、影响和修复建议（如果你认为可以合并，说明你确认过哪些风险点）",
    "- Testing：评价现有测试，如有必要给出能暴露风险的反例或边界测试",
    "",
    "提交后可以查看参考解析和上游来源。"
  ].join("\n");

  const contextDoc = [
    "# 背景",
    "",
    ...background.map((item) => `- ${item}`)
  ].join("\n");

  return [
    {
      name: "PR-description.md",
      label: "PR-description.md",
      language: "markdown",
      content: prDescription
    },
    {
      name: "task.md",
      label: "task.md",
      language: "markdown",
      content: task
    },
    {
      name: "background.md",
      label: "background.md",
      language: "markdown",
      content: contextDoc
    }
  ];
}

function getReviewFiles(dir: string, metadata: ReviewChallengeMetadata): ReviewChallengeFile[] {
  const diffFileName = isSafeChallengeFileName(metadata.reviewTarget.file) ? metadata.reviewTarget.file : "";
  const hiddenFiles = new Set(["expected-findings.json", "rubric.md", "metadata.json", "README.zh.md", "README.en.md"]);
  const availableFiles = readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((fileName) => !hiddenFiles.has(fileName))
    .filter((fileName) => isSafeChallengeFileName(fileName));
  const preferredOrder = [diffFileName].filter(Boolean);
  const orderedFiles = preferredOrder
    .filter((fileName) => availableFiles.includes(fileName))
    .concat(
      availableFiles
        .filter((fileName) => fileName !== diffFileName)
        .sort((first, second) => first.localeCompare(second))
    );

  const physicalFiles = orderedFiles.map((fileName) => ({
    name: fileName,
    label: fileName,
    language: getFileLanguage(fileName),
    content: readFileSync(join(dir, fileName), "utf8")
  }));

  return [...physicalFiles, ...getVirtualFiles(metadata)];
}

function getReviewReveal(dir: string, metadata: ReviewChallengeMetadata): ReviewReveal {
  const expectedPath = join(dir, "expected-findings.json");
  const expected = existsSync(expectedPath)
    ? (JSON.parse(readFileSync(expectedPath, "utf8")) as ReviewExpectedFindings)
    : null;

  return {
    canMerge: expected?.canMerge ?? false,
    mergeRationale: expected?.mergeRationale,
    requiredFindings: expected?.requiredFindings ?? [],
    optionalFindings: expected?.optionalFindings ?? [],
    analysisNotes: metadata.analysis?.notes ?? metadata.context ?? [],
    behaviorChecks: metadata.behaviorChecks,
    learningGoal: metadata.learningGoal,
    references: metadata.source.references
  };
}

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
  const files = getReviewFiles(dir, metadata);
  const reveal = getReviewReveal(dir, metadata);

  return { metadata, files, reveal };
}

const legacyAcceptanceRates: Record<number, number> = {
  1: 31.4, 2: 18.6, 3: 21.2, 4: 24.8, 5: 19.5, 6: 22.1, 7: 26.4, 8: 33.2, 9: 20.7, 10: 23.9,
  11: 35.6, 12: 29.8, 13: 31.9, 14: 25.3, 15: 34.1, 16: 27.6, 17: 32.8, 18: 24.4, 19: 30.5, 20: 28.7
};

function getAcceptanceRate(order: number, slug: string) {
  const known = legacyAcceptanceRates[order];
  if (known) {
    return known;
  }

  let hash = 0;
  for (const char of slug) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997;
  }

  return 18 + (hash % 180) / 10;
}

export function getReviewChallengeList(): Challenge[] {
  return getReviewChallengeSlugs()
    .map((slug) => {
      const metadataPath = join(reviewRoot, slug, "metadata.json");
      const metadata = JSON.parse(readFileSync(metadataPath, "utf8")) as ReviewChallengeMetadata;
      return metadata;
    })
    .sort((first, second) => first.order - second.order)
    .map((metadata) => ({
      id: metadata.order.toString().padStart(3, "0"),
      href: `/challenges/review/${metadata.slug}`,
      title: metadata.title,
      summary: metadata.summary,
      mode: metadata.mode,
      difficulty: metadata.difficulty,
      status: metadata.status,
      acceptanceRate: getAcceptanceRate(metadata.order, metadata.slug),
      tags: metadata.tags,
      runStatus: "idle" as const
    }));
}
