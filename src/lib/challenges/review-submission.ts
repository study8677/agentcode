import type { ReviewExpectedFinding, ReviewReveal, ReviewScoringHints } from "@/lib/challenges/review";

export type MergeDecision = "yes" | "no" | "unknown" | "";

export type ReviewLineFinding = {
  id: string;
  fileName: string;
  lineNumber: number;
  severity: string;
  problem: string;
  fix: string;
};

export type ReviewDraft = {
  mergeDecision: MergeDecision;
  conclusion: string;
  findings: ReviewLineFinding[];
  tests: string;
};

export type MatchedFinding = {
  finding: ReviewExpectedFinding;
  matched: boolean;
};

export type ReviewFeedback = {
  score: number;
  checks: Array<{
    label: string;
    passed: boolean;
    detail: string;
  }>;
  requiredMatches: MatchedFinding[];
  optionalMatches: MatchedFinding[];
};

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function matchFinding(body: string, finding: ReviewExpectedFinding): boolean {
  if (!finding.matchTerms || finding.matchTerms.length === 0) {
    return false;
  }

  return finding.matchTerms.some((group) => group.every((term) => body.includes(term.toLowerCase())));
}

export function scoreReviewDraft(
  draft: ReviewDraft,
  scoringHints: ReviewScoringHints,
  reveal: ReviewReveal
): ReviewFeedback {
  const findingBody = draft.findings
    .map((finding) => `${finding.severity}\n${finding.fileName}:${finding.lineNumber}\n${finding.problem}\n${finding.fix}`)
    .join("\n");
  const body = `${draft.conclusion}\n${findingBody}\n${draft.tests}`.toLowerCase();

  const requiredMatches = reveal.requiredFindings.map((finding) => ({
    finding,
    matched: matchFinding(body, finding)
  }));
  const optionalMatches = reveal.optionalFindings.map((finding) => ({
    finding,
    matched: matchFinding(body, finding)
  }));
  const matchedRequired = requiredMatches.filter((item) => item.matched).length;
  const totalRequired = requiredMatches.length;

  const mergePassed = reveal.canMerge ? draft.mergeDecision === "yes" : draft.mergeDecision === "no";
  const hasMatchTerms = reveal.requiredFindings.some((finding) => finding.matchTerms && finding.matchTerms.length > 0);
  const regressionPassed = hasMatchTerms
    ? matchedRequired > 0
    : includesAny(body, scoringHints.coreRiskTerms.map((term) => term.toLowerCase())) &&
      includesAny(body, ["回归", "风险", "破坏", "泄漏", "绕过", "跳过", "允许", "正确", "regression", "risk", "leak", "bypass", "correct"]);
  const semanticPassed =
    includesAny(body, scoringHints.boundaryTerms.map((term) => term.toLowerCase())) &&
    includesAny(body, ["边界", "语义", "明确", "确定", "不确定", "约束", "unknown", "contract", "boundary", "semantics"]);
  const testPassed =
    includesAny(body, ["测试", "test"]) &&
    includesAny(body, scoringHints.testTerms.map((term) => term.toLowerCase()));
  const fixPassed =
    includesAny(body, scoringHints.fixTerms.map((term) => term.toLowerCase())) ||
    (includesAny(body, ["保留", "继续执行", "不能跳过", "不要", "不能", "无需修改"]) &&
      includesAny(body, scoringHints.coreRiskTerms.map((term) => term.toLowerCase())));

  const checks = [
    {
      label: "合并判断",
      passed: mergePassed,
      detail: mergePassed
        ? "你的 merge 结论和参考答案一致。"
        : draft.mergeDecision === "unknown"
          ? "参考答案有明确结论。“需要更多信息”只有在你说清缺什么信息、且主要风险点已确认时才是好答案。"
          : "你的 merge 结论和参考答案不一致，对照下方解析看看漏掉或误判了什么。"
    },
    {
      label: "核心判断点",
      passed: regressionPassed,
      detail: hasMatchTerms
        ? `你命中了 ${matchedRequired}/${totalRequired} 个必须 finding，逐条对照见下方解析。`
        : regressionPassed
          ? "你的分析覆盖了这道题的核心判断点。"
          : "待补：你的分析可能没有落到这道题真正的判断点上，对照解析确认。"
    },
    {
      label: "语义边界",
      passed: semanticPassed,
      detail: semanticPassed
        ? "你说明了原有行为契约和补丁涉及的边界。"
        : "待补：需要解释补丁是否改变了输入、权限、状态或数据语义。"
    },
    {
      label: "测试覆盖",
      passed: testPassed,
      detail: testPassed
        ? "你对测试覆盖给出了具体评价。"
        : "待补：需要评价现有测试是否覆盖了关键场景，最好给出具体输入。"
    },
    {
      label: "修复建议",
      passed: fixPassed,
      detail: fixPassed
        ? "你的建议能落到具体代码、配置或测试边界。"
        : "待补：建议需要可执行，说明改哪里、怎么改，而不是只说方向。"
    }
  ];

  const findingScore = totalRequired > 0 ? Math.round(30 * (matchedRequired / totalRequired)) : (regressionPassed ? 30 : 0);
  const mergeScore = mergePassed ? 30 : draft.mergeDecision === "unknown" && matchedRequired > 0 ? 10 : 0;
  const score =
    mergeScore +
    (hasMatchTerms ? findingScore : checks[1].passed ? 30 : 0) +
    (semanticPassed ? 15 : 0) +
    (testPassed ? 10 : 0) +
    (fixPassed ? 15 : 0);

  return { score, checks, requiredMatches, optionalMatches };
}
