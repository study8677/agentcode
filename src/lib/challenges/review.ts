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

export type ReviewChallengeFile = {
  name: string;
  label: string;
  language: "diff" | "markdown" | "json" | "text";
  content: string;
};

export type ReviewChallenge = {
  metadata: ReviewChallengeMetadata;
  files: ReviewChallengeFile[];
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

function getVirtualFiles(metadata: ReviewChallengeMetadata): ReviewChallengeFile[] {
  const task = [
    `# ${metadata.title.zh}`,
    "",
    metadata.scenario,
    "",
    `项目：${metadata.source.project}`,
    `语言 / 领域：${metadata.language}`,
    `学习目标：${metadata.learningGoal}`,
    "",
    "## 你需要提交",
    "",
    "- 是否可以合并：可以 / 不可以 / 需要更多信息",
    "- Blocking finding：具体问题、影响和修复建议",
    "- Testing：至少一个能暴露风险的反例或边界测试"
  ].join("\n");

  const context = [
    "# 题目上下文",
    "",
    "## 背景",
    "",
    ...metadata.context.map((item) => `- ${item}`)
  ].join("\n");

  const checks = [
    "# 审查清单",
    "",
    "把这些场景和 AI PR diff 对照起来，判断补丁是否破坏原有约束。",
    "",
    ...metadata.behaviorChecks.flatMap((item, index) => [
      `## ${index + 1}. ${item.input}`,
      "",
      `- 原有约束：${item.expected}`,
      `- 需要验证：${item.reviewQuestion}`,
      ""
    ])
  ].join("\n");

  const sources = [
    "# 来源链接",
    "",
    "题目来自真实工程问题，但当前页面里的 AI PR diff 是 AgentCode 改编的审核训练补丁。",
    "",
    ...metadata.source.references.map((reference) => `- [${reference.label}](${reference.url})`)
  ].join("\n");

  return [
    {
      name: "task.md",
      label: "task.md",
      language: "markdown",
      content: task
    },
    {
      name: "context.md",
      label: "context.md",
      language: "markdown",
      content: context
    },
    {
      name: "checks.md",
      label: "checks.md",
      language: "markdown",
      content: checks
    },
    {
      name: "sources.md",
      label: "sources.md",
      language: "markdown",
      content: sources
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

  return { metadata, files };
}
