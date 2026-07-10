import { createHash } from "node:crypto";
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

export const REVIEW_EVALUATOR_VERSION = "review-evaluator-v2";

export type ReviewSeverity = "critical" | "high" | "medium" | "low" | "check";

export type ReviewRubricKind = "defect" | "verification" | "test";

export type ReviewSkill =
  | "security-boundary"
  | "authorization"
  | "behavior-contract"
  | "state-semantics"
  | "error-boundary"
  | "performance-resource"
  | "test-quality"
  | "evidence-location"
  | "impact-reasoning"
  | "remediation"
  | "false-positive-control"
  | "concurrency"
  | "compatibility"
  | "maintainability";

export type ReviewRubricAnchor = {
  fileName: string;
  /** 1-based line in the physical challenge file shown by the file browser. */
  startLine: number;
  /** Inclusive 1-based line in the physical challenge file. */
  endLine: number;
  /** A stable snippet used by the compiler to detect stale anchors. */
  lineIncludes: string;
};

export type ReviewMatchCriteria = {
  problem?: string[][];
  evidence?: string[][];
  impact?: string[][];
  fix?: string[][];
  tests?: string[][];
};

export type ReviewDisallowedRule = {
  id: string;
  description: string;
  fields: Array<"conclusion" | "problem" | "evidence" | "impact" | "fix" | "tests">;
  match: string[][];
  penalty: number;
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
  skills: ReviewSkill[];
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
  reviewable: boolean;
};

export type ReviewExpectedFinding = {
  id: string;
  /** V2 fields are optional at the type boundary so old assets remain loadable. */
  kind?: ReviewRubricKind;
  required?: boolean;
  severity: ReviewSeverity;
  blocksMerge?: boolean;
  summary: string;
  expectedReasoning?: string;
  acceptableFix?: string;
  anchors?: ReviewRubricAnchor[];
  criteria?: ReviewMatchCriteria;
  /** @deprecated Migrated into criteria; retained for old challenge assets. */
  matchTerms?: string[][];
};

export type ReviewExpectedFindings = {
  schemaVersion?: 2;
  canMerge: boolean;
  mergeRationale?: string;
  requiredFindings: ReviewExpectedFinding[];
  optionalFindings?: ReviewExpectedFinding[];
  disallowedConclusions?: Array<string | ReviewDisallowedRule>;
};

/** Everything shown only after the user submits a review. */
export type ReviewReveal = {
  canMerge: boolean;
  mergeRationale?: string;
  requiredFindings: ReviewExpectedFinding[];
  optionalFindings: ReviewExpectedFinding[];
  disallowedConclusions: Array<string | ReviewDisallowedRule>;
  analysisNotes: string[];
  behaviorChecks: ReviewBehaviorCheck[];
  learningGoal: string;
  references: ReviewSourceLink[];
  challengeVersion: string;
  evaluatorVersion: typeof REVIEW_EVALUATOR_VERSION;
  /** Physical file line counts used for server-side anchor validation. */
  fileLineCounts: Record<string, number>;
};

export type ReviewChallenge = {
  metadata: ReviewChallengeMetadata;
  files: ReviewChallengeFile[];
  reveal: ReviewReveal;
};

const reviewRoot = join(process.cwd(), "challenges", "review");
const virtualFileNames = new Set(["PR-description.md", "task.md", "background.md"]);

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
      content: prDescription,
      reviewable: false
    },
    {
      name: "task.md",
      label: "task.md",
      language: "markdown",
      content: task,
      reviewable: false
    },
    {
      name: "background.md",
      label: "background.md",
      language: "markdown",
      content: contextDoc,
      reviewable: false
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
    content: readFileSync(join(dir, fileName), "utf8"),
    reviewable: true
  }));

  return [...physicalFiles, ...getVirtualFiles(metadata)];
}

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([first], [second]) => first.localeCompare(second))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableJson(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function getChallengeVersion(
  metadata: ReviewChallengeMetadata,
  expected: ReviewExpectedFindings | null,
  files: ReviewChallengeFile[]
) {
  const versionInput = {
    metadata,
    expected,
    files: files
      .filter((file) => !virtualFileNames.has(file.name))
      .map((file) => ({ name: file.name, content: file.content }))
  };

  return createHash("sha256").update(stableJson(versionInput)).digest("hex");
}

function normalizeSeverity(severity: string): ReviewSeverity {
  return severity === "blocking" ? "critical" :
    severity === "critical" || severity === "high" || severity === "medium" || severity === "low" || severity === "check"
      ? severity
      : "medium";
}

function inferFindingKind(finding: ReviewExpectedFinding, canMerge: boolean): ReviewRubricKind {
  if (finding.kind) {
    return finding.kind;
  }

  const searchable = `${finding.id} ${finding.summary}`.toLowerCase();
  if (/test|测试|coverage|覆盖/.test(searchable)) {
    return "test";
  }

  return canMerge || finding.severity === "check" ? "verification" : "defect";
}

function normalizeFinding(
  finding: ReviewExpectedFinding,
  canMerge: boolean,
  required: boolean
): ReviewExpectedFinding {
  const kind = inferFindingKind(finding, canMerge);
  const fallbackCriteria = finding.matchTerms?.length
    ? kind === "test" ? { tests: finding.matchTerms } : { problem: finding.matchTerms }
    : {};

  return {
    ...finding,
    kind,
    required,
    severity: normalizeSeverity(finding.severity),
    blocksMerge: finding.blocksMerge ?? (kind === "defect" && !canMerge),
    anchors: finding.anchors ?? [],
    criteria: finding.criteria ?? fallbackCriteria
  };
}

function getReviewReveal(
  metadata: ReviewChallengeMetadata,
  files: ReviewChallengeFile[],
  expected: ReviewExpectedFindings | null
): ReviewReveal {
  const requiredFindings = (expected?.requiredFindings ?? []).map((finding) =>
    normalizeFinding(finding, expected?.canMerge ?? false, true)
  );
  const optionalFindings = (expected?.optionalFindings ?? []).map((finding) =>
    normalizeFinding(finding, expected?.canMerge ?? false, false)
  );
  const physicalFiles = files.filter((file) => !virtualFileNames.has(file.name));

  return {
    canMerge: expected?.canMerge ?? false,
    mergeRationale: expected?.mergeRationale,
    requiredFindings,
    optionalFindings,
    disallowedConclusions: expected?.disallowedConclusions ?? [],
    analysisNotes: metadata.analysis?.notes ?? metadata.context ?? [],
    behaviorChecks: metadata.behaviorChecks,
    learningGoal: metadata.learningGoal,
    references: metadata.source.references,
    challengeVersion: getChallengeVersion(metadata, expected, physicalFiles),
    evaluatorVersion: REVIEW_EVALUATOR_VERSION,
    fileLineCounts: Object.fromEntries(
      physicalFiles.map((file) => [file.name, file.content.split(/\r?\n/).length])
    )
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
  if (!isSafeChallengeFileName(slug)) {
    return null;
  }

  const dir = join(reviewRoot, slug);
  const metadataPath = join(dir, "metadata.json");

  if (!existsSync(metadataPath)) {
    return null;
  }

  const metadata = JSON.parse(readFileSync(metadataPath, "utf8")) as ReviewChallengeMetadata;
  const files = getReviewFiles(dir, metadata);
  const expectedPath = join(dir, "expected-findings.json");
  const expected = existsSync(expectedPath)
    ? (JSON.parse(readFileSync(expectedPath, "utf8")) as ReviewExpectedFindings)
    : null;
  const reveal = getReviewReveal(metadata, files, expected);

  return { metadata, files, reveal };
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
      // Public acceptance rates are only shown once persisted, adjudicated
      // attempts provide a real denominator. Never fabricate V0 statistics.
      acceptanceRate: null,
      tags: metadata.tags,
      runStatus: "idle" as const
    }));
}
