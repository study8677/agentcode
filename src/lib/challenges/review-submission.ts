import type {
  ReviewDisallowedRule,
  ReviewExpectedFinding,
  ReviewMatchCriteria,
  ReviewReveal,
  ReviewRubricAnchor,
  ReviewScoringHints,
  ReviewSeverity
} from "@/lib/challenges/review";

export type MergeDecision = "yes" | "no" | "unknown" | "";

export type ReviewLineFinding = {
  id: string;
  fileName: string;
  lineNumber: number;
  /** `blocking` is accepted only as a legacy alias for `critical`. */
  severity: string;
  blocksMerge?: boolean;
  problem: string;
  evidence?: string;
  impact?: string;
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
  findingId?: string;
};

export type ReviewScoreDimensions = {
  mergeDecision: number;
  coreRisk: number;
  semanticImpact: number;
  testQuality: number;
  repairOrRationale: number;
};

export type ReviewRubricMatch = {
  rubricId: string;
  kind: "defect" | "verification" | "test";
  required: boolean;
  findingId: string | null;
  matched: boolean;
  fields: {
    problem: boolean;
    anchor: boolean;
    evidence: boolean;
    severity: boolean;
    impact: boolean;
    fix: boolean;
    tests: boolean;
  };
};

export type ReviewPenalty = {
  id: string;
  points: number;
  reason: string;
  cap?: number;
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

export type ReviewFeedbackV2 = ReviewFeedback & {
  apiVersion: 2;
  evaluatorVersion: string;
  challengeVersion: string;
  status: "provisional";
  dimensions: ReviewScoreDimensions;
  matchedItems: ReviewRubricMatch[];
  penalties: ReviewPenalty[];
  unverifiedFindings: string[];
  capsApplied: number[];
};

export type ReviewDraftValidationIssue = {
  path: string;
  code:
    | "too_many_findings"
    | "missing_id"
    | "duplicate_id"
    | "unknown_file"
    | "invalid_line"
    | "invalid_severity";
  message: string;
};

export class ReviewDraftValidationError extends Error {
  readonly issues: ReviewDraftValidationIssue[];

  constructor(issues: ReviewDraftValidationIssue[]) {
    super("Review draft failed validation.");
    this.name = "ReviewDraftValidationError";
    this.issues = issues;
  }
}

const severities = new Set<ReviewSeverity>(["critical", "high", "medium", "low", "check"]);

function normalizeSeverity(value: string): ReviewSeverity | null {
  const normalized = value === "blocking" ? "critical" : value;
  return severities.has(normalized as ReviewSeverity) ? normalized as ReviewSeverity : null;
}

/**
 * Validate only user-controlled structure. The returned issues deliberately do
 * not reveal rubric anchors or reference answers, so callers can safely expose
 * them in a 422 response.
 */
export function validateReviewDraft(draft: ReviewDraft, reveal: ReviewReveal): ReviewDraftValidationIssue[] {
  const issues: ReviewDraftValidationIssue[] = [];
  const ids = new Set<string>();

  if (draft.findings.length > 20) {
    issues.push({
      path: "findings",
      code: "too_many_findings",
      message: "A review can contain at most 20 findings."
    });
  }

  draft.findings.forEach((finding, index) => {
    const path = `findings.${index}`;
    if (!finding.id) {
      issues.push({ path: `${path}.id`, code: "missing_id", message: "Finding id is required." });
    } else if (ids.has(finding.id)) {
      issues.push({ path: `${path}.id`, code: "duplicate_id", message: "Finding ids must be unique." });
    } else {
      ids.add(finding.id);
    }

    const isLegacyFlatDraft = finding.id === "legacy-finding" && finding.fileName === "";
    const lineCount = reveal.fileLineCounts[finding.fileName];
    if (!isLegacyFlatDraft && lineCount === undefined) {
      issues.push({ path: `${path}.fileName`, code: "unknown_file", message: "Finding file is not reviewable." });
    }

    if (!Number.isInteger(finding.lineNumber) || finding.lineNumber < 1 || (!isLegacyFlatDraft && finding.lineNumber > lineCount)) {
      issues.push({ path: `${path}.lineNumber`, code: "invalid_line", message: "Finding line is outside the reviewable file." });
    }

    if (!normalizeSeverity(finding.severity)) {
      issues.push({ path: `${path}.severity`, code: "invalid_severity", message: "Finding severity is invalid." });
    }
  });

  return issues;
}

function normalizeText(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function includesTerm(value: string, rawTerm: string) {
  const term = normalizeText(rawTerm);
  if (!term) {
    return false;
  }

  if (/^[a-z0-9_-]+$/.test(term)) {
    return new RegExp(`(?:^|[^a-z0-9_])${escapeRegExp(term)}(?:$|[^a-z0-9_])`, "i").test(value);
  }

  return value.includes(term);
}

function matchesCriteria(value: string, groups?: string[][]) {
  if (!groups?.length) {
    return false;
  }

  const normalized = normalizeText(value);
  return groups.some((group) => group.length > 0 && group.every((term) => includesTerm(normalized, term)));
}

function matchesAnchor(finding: ReviewLineFinding, anchors?: ReviewRubricAnchor[]) {
  if (!anchors?.length) {
    return false;
  }

  return anchors.some((anchor) =>
    finding.fileName === anchor.fileName &&
    finding.lineNumber >= anchor.startLine &&
    finding.lineNumber <= anchor.endLine
  );
}

function findingCriteria(item: ReviewExpectedFinding): ReviewMatchCriteria {
  if (item.criteria) {
    return item.criteria;
  }

  if (item.kind === "test") {
    return { tests: item.matchTerms ?? [] };
  }

  return { problem: item.matchTerms ?? [] };
}

function emptyFields(): ReviewRubricMatch["fields"] {
  return {
    problem: false,
    anchor: false,
    evidence: false,
    severity: false,
    impact: false,
    fix: false,
    tests: false
  };
}

type CandidateMatch = {
  itemIndex: number;
  findingIndex: number;
  weight: number;
  fields: ReviewRubricMatch["fields"];
};

function candidateFor(
  item: ReviewExpectedFinding,
  itemIndex: number,
  finding: ReviewLineFinding,
  findingIndex: number
): CandidateMatch | null {
  const criteria = findingCriteria(item);
  const fields = {
    problem: matchesCriteria(finding.problem, criteria.problem ?? item.matchTerms),
    anchor: matchesAnchor(finding, item.anchors),
    evidence: matchesCriteria(finding.evidence ?? "", criteria.evidence),
    severity: normalizeSeverity(finding.severity) === item.severity,
    impact: matchesCriteria(finding.impact ?? "", criteria.impact),
    fix: matchesCriteria(finding.fix, criteria.fix),
    tests: false
  };

  // A location or severity alone must never manufacture a semantic match.
  if (!fields.problem) {
    return null;
  }

  const weight =
    Number(fields.problem) * 12 +
    Number(fields.anchor) * 6 +
    Number(fields.evidence) * 6 +
    Number(fields.severity) * 6 +
    Number(fields.impact) * 15 +
    Number(fields.fix) * 15;

  return { itemIndex, findingIndex, weight, fields };
}

/** Exact maximum-weight bipartite assignment. Challenge rubrics are small. */
function assignFindings(items: ReviewExpectedFinding[], findings: ReviewLineFinding[]) {
  const candidates = items.map((item, itemIndex) =>
    findings
      .map((finding, findingIndex) => candidateFor(item, itemIndex, finding, findingIndex))
      .filter((candidate): candidate is CandidateMatch => Boolean(candidate))
  );
  let bestWeight = -1;
  let best: Array<CandidateMatch | null> = items.map(() => null);

  function visit(itemIndex: number, used: Set<number>, weight: number, selected: Array<CandidateMatch | null>) {
    if (itemIndex === items.length) {
      if (weight > bestWeight) {
        bestWeight = weight;
        best = [...selected];
      }
      return;
    }

    selected.push(null);
    visit(itemIndex + 1, used, weight, selected);
    selected.pop();

    for (const candidate of candidates[itemIndex]) {
      if (used.has(candidate.findingIndex)) {
        continue;
      }
      used.add(candidate.findingIndex);
      selected.push(candidate);
      visit(itemIndex + 1, used, weight + candidate.weight, selected);
      selected.pop();
      used.delete(candidate.findingIndex);
    }
  }

  visit(0, new Set(), 0, []);
  return best;
}

function normalizeDisallowedRule(value: string | ReviewDisallowedRule, index: number): ReviewDisallowedRule {
  if (typeof value !== "string") {
    return value;
  }

  return {
    id: `legacy-disallowed-${index + 1}`,
    description: value,
    fields: ["conclusion", "problem", "evidence", "impact", "fix", "tests"],
    match: [[value]],
    penalty: 10
  };
}

function disallowedBody(draft: ReviewDraft, fields: ReviewDisallowedRule["fields"]) {
  const values: string[] = [];
  if (fields.includes("conclusion")) values.push(draft.conclusion);
  if (fields.includes("problem")) values.push(...draft.findings.map((finding) => finding.problem));
  if (fields.includes("evidence")) values.push(...draft.findings.map((finding) => finding.evidence ?? ""));
  if (fields.includes("impact")) values.push(...draft.findings.map((finding) => finding.impact ?? ""));
  if (fields.includes("fix")) values.push(...draft.findings.map((finding) => finding.fix));
  if (fields.includes("tests")) values.push(draft.tests);
  return values.join("\n");
}

function roundDimension(value: number) {
  return Math.max(0, Math.round(value));
}

export function scoreReviewDraft(
  draft: ReviewDraft,
  scoringHints: ReviewScoringHints,
  reveal: ReviewReveal
): ReviewFeedbackV2 {
  const validationIssues = validateReviewDraft(draft, reveal);
  if (validationIssues.length) {
    throw new ReviewDraftValidationError(validationIssues);
  }

  const requiredCore = reveal.requiredFindings.filter((item) => item.kind !== "test");
  const requiredTests = reveal.requiredFindings.filter((item) => item.kind === "test");
  const optionalCore = reveal.optionalFindings.filter((item) => item.kind !== "test");
  const requiredAssignments = assignFindings(requiredCore, draft.findings);
  const requiredFindingIndexes = new Set(
    requiredAssignments.flatMap((assignment) => assignment ? [assignment.findingIndex] : [])
  );
  const remainingFindings = draft.findings.filter((_, index) => !requiredFindingIndexes.has(index));
  const optionalAssignments = assignFindings(optionalCore, remainingFindings);
  const optionalFindingIndexes = new Set<number>();
  optionalAssignments.forEach((assignment) => {
    if (assignment) {
      optionalFindingIndexes.add(draft.findings.indexOf(remainingFindings[assignment.findingIndex]));
    }
  });

  const coreRatios = requiredAssignments.map((assignment) => assignment
    ? Number(assignment.fields.problem) * 0.4 +
      Number(assignment.fields.anchor) * 0.2 +
      Number(assignment.fields.evidence) * 0.2 +
      Number(assignment.fields.severity) * 0.2
    : 0
  );
  const impactRatios = requiredAssignments.map((assignment) => Number(Boolean(assignment?.fields.impact)));
  const fixRatios = requiredAssignments.map((assignment) => Number(Boolean(assignment?.fields.fix)));
  const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

  const expectedMergeDecision: MergeDecision = reveal.canMerge ? "yes" : "no";
  const mergePassed = draft.mergeDecision === expectedMergeDecision;
  const testMatches = requiredTests.map((item) => matchesCriteria(draft.tests, findingCriteria(item).tests ?? item.matchTerms));
  const fallbackTestMatch = requiredTests.length === 0 &&
    matchesCriteria(draft.tests, scoringHints.testTerms.map((term) => [term]));
  const dimensions: ReviewScoreDimensions = {
    mergeDecision: mergePassed ? 30 : 0,
    coreRisk: roundDimension(average(coreRatios) * 30),
    semanticImpact: roundDimension(average(impactRatios) * 15),
    testQuality: roundDimension((requiredTests.length ? average(testMatches.map(Number)) : Number(fallbackTestMatch)) * 10),
    repairOrRationale: roundDimension(average(fixRatios) * 15)
  };

  const penalties: ReviewPenalty[] = [];
  let disallowedPoints = 0;
  reveal.disallowedConclusions
    .map(normalizeDisallowedRule)
    .forEach((rule) => {
      if (disallowedPoints >= 20 || !matchesCriteria(disallowedBody(draft, rule.fields), rule.match)) {
        return;
      }
      const points = Math.min(rule.penalty, 20 - disallowedPoints);
      disallowedPoints += points;
      penalties.push({ id: rule.id, points, reason: rule.description });
    });

  const explicitBlockers = draft.findings.filter((finding) => finding.blocksMerge === true);
  const explicitNonBlockers = draft.findings.filter((finding) => finding.blocksMerge === false);
  const contradictoryDecision =
    (draft.mergeDecision === "yes" && explicitBlockers.length > 0) ||
    (draft.mergeDecision === "no" && draft.findings.length > 0 && explicitNonBlockers.length === draft.findings.length);
  if (contradictoryDecision) {
    penalties.push({
      id: "merge-blocker-contradiction",
      points: 15,
      reason: "Merge decision contradicts the submitted blocking flags.",
      cap: 60
    });
  }

  const allCoreMissed = requiredCore.length > 0 && requiredAssignments.every((assignment) => !assignment);
  const allMatchedCoreAnchorsMissed = requiredCore.length > 0 &&
    requiredAssignments.some(Boolean) &&
    requiredAssignments.every((assignment) => !assignment?.fields.anchor);
  const capsApplied: number[] = [];
  if (!mergePassed) capsApplied.push(60);
  if (allCoreMissed) capsApplied.push(50);
  if (allMatchedCoreAnchorsMissed) capsApplied.push(60);
  if (contradictoryDecision) capsApplied.push(60);

  const subtotal = Object.values(dimensions).reduce((sum, value) => sum + value, 0);
  const penaltyPoints = penalties.reduce((sum, penalty) => sum + penalty.points, 0);
  const cap = capsApplied.length ? Math.min(...capsApplied) : 100;
  const score = Math.max(0, Math.min(cap, subtotal - penaltyPoints));

  const requiredCoreMatches = requiredCore.map((item, index): ReviewRubricMatch => {
    const assignment = requiredAssignments[index];
    return {
      rubricId: item.id,
      kind: item.kind ?? "defect",
      required: true,
      findingId: assignment ? draft.findings[assignment.findingIndex].id : null,
      matched: Boolean(assignment?.fields.problem && assignment.fields.anchor),
      fields: assignment?.fields ?? emptyFields()
    };
  });
  const requiredTestMatches = requiredTests.map((item, index): ReviewRubricMatch => ({
    rubricId: item.id,
    kind: "test",
    required: true,
    findingId: null,
    matched: testMatches[index],
    fields: { ...emptyFields(), tests: testMatches[index] }
  }));
  const optionalMatches = reveal.optionalFindings.map((item): MatchedFinding => {
    if (item.kind === "test") {
      return { finding: item, matched: matchesCriteria(draft.tests, findingCriteria(item).tests ?? item.matchTerms) };
    }
    const index = optionalCore.indexOf(item);
    const assignment = optionalAssignments[index];
    return {
      finding: item,
      matched: Boolean(assignment?.fields.problem && assignment.fields.anchor),
      findingId: assignment ? remainingFindings[assignment.findingIndex].id : undefined
    };
  });
  const usedFindingIndexes = new Set([...requiredFindingIndexes, ...optionalFindingIndexes]);
  const unverifiedFindings = draft.findings
    .filter((_, index) => !usedFindingIndexes.has(index))
    .map((finding) => finding.id);

  const requiredMatches: MatchedFinding[] = reveal.requiredFindings.map((item) => {
    const matched = [...requiredCoreMatches, ...requiredTestMatches].find((candidate) => candidate.rubricId === item.id);
    return { finding: item, matched: Boolean(matched?.matched), findingId: matched?.findingId ?? undefined };
  });
  const checks = [
    {
      label: "合并判断",
      passed: mergePassed,
      detail: mergePassed ? "你的 merge 结论和参考答案一致。" : "你的 merge 结论和参考答案不一致。"
    },
    {
      label: "核心判断点",
      passed: dimensions.coreRisk >= 24,
      detail: `核心 finding 得分 ${dimensions.coreRisk}/30；语义、位置、证据和严重程度分别校验。`
    },
    {
      label: "语义边界",
      passed: dimensions.semanticImpact >= 12,
      detail: `影响与行为边界得分 ${dimensions.semanticImpact}/15。`
    },
    {
      label: "测试覆盖",
      passed: dimensions.testQuality >= 8,
      detail: `测试质量得分 ${dimensions.testQuality}/10，测试文本不会替代核心 finding。`
    },
    {
      label: reveal.canMerge ? "Approve 依据" : "修复建议",
      passed: dimensions.repairOrRationale >= 12,
      detail: `${reveal.canMerge ? "Approve 依据" : "修复方向"}得分 ${dimensions.repairOrRationale}/15。`
    }
  ];

  return {
    apiVersion: 2,
    score,
    status: "provisional",
    evaluatorVersion: reveal.evaluatorVersion,
    challengeVersion: reveal.challengeVersion,
    dimensions,
    checks,
    requiredMatches,
    optionalMatches,
    matchedItems: [...requiredCoreMatches, ...requiredTestMatches],
    penalties,
    unverifiedFindings,
    capsApplied: [...new Set(capsApplied)].sort((first, second) => first - second)
  };
}

/**
 * Emergency rollback scorer used only by REVIEW_EVALUATOR_MODE=legacy/shadow.
 * It preserves the pre-v2 broad-text behavior while keeping v2 structural
 * validation and response shape, so a rollback never re-enables fake anchors.
 */
export function scoreReviewDraftLegacyCompat(
  draft: ReviewDraft,
  scoringHints: ReviewScoringHints,
  reveal: ReviewReveal
): ReviewFeedbackV2 {
  const validationIssues = validateReviewDraft(draft, reveal);
  if (validationIssues.length) throw new ReviewDraftValidationError(validationIssues);

  const body = normalizeText([
    draft.conclusion,
    ...draft.findings.flatMap((finding) => [finding.problem, finding.evidence ?? "", finding.impact ?? "", finding.fix]),
    draft.tests
  ].join("\n"));
  const itemMatched = (item: ReviewExpectedFinding) => matchesCriteria(
    body,
    item.matchTerms ?? item.criteria?.problem ?? item.criteria?.tests
  );
  const requiredMatches = reveal.requiredFindings.map((finding) => ({ finding, matched: itemMatched(finding) }));
  const optionalMatches = reveal.optionalFindings.map((finding) => ({ finding, matched: itemMatched(finding) }));
  const requiredHitRate = requiredMatches.length
    ? requiredMatches.filter((item) => item.matched).length / requiredMatches.length
    : 0;
  const mergeDecision = draft.mergeDecision === (reveal.canMerge ? "yes" : "no") ? 30 : 0;
  const coreRisk = Math.round(requiredHitRate * 30);
  const semanticImpact = matchesCriteria(body, scoringHints.boundaryTerms.map((term) => [term])) ? 15 : 0;
  const testQuality = matchesCriteria(body, scoringHints.testTerms.map((term) => [term])) ? 10 : 0;
  const repairOrRationale = matchesCriteria(body, scoringHints.fixTerms.map((term) => [term])) ? 15 : 0;
  const dimensions = { mergeDecision, coreRisk, semanticImpact, testQuality, repairOrRationale };
  const matchedItems: ReviewRubricMatch[] = reveal.requiredFindings.map((item, index) => ({
    rubricId: item.id,
    kind: item.kind ?? "defect",
    required: true,
    findingId: null,
    matched: requiredMatches[index].matched,
    fields: { ...emptyFields(), problem: requiredMatches[index].matched }
  }));

  return {
    apiVersion: 2,
    status: "provisional",
    evaluatorVersion: `${reveal.evaluatorVersion}-legacy-compat`,
    challengeVersion: reveal.challengeVersion,
    score: Object.values(dimensions).reduce((sum, value) => sum + value, 0),
    dimensions,
    checks: [
      { label: "合并判断", passed: mergeDecision === 30, detail: `Legacy compatibility score ${mergeDecision}/30.` },
      { label: "核心判断点", passed: coreRisk >= 24, detail: `Legacy compatibility score ${coreRisk}/30.` },
      { label: "语义边界", passed: semanticImpact === 15, detail: `Legacy compatibility score ${semanticImpact}/15.` },
      { label: "测试覆盖", passed: testQuality === 10, detail: `Legacy compatibility score ${testQuality}/10.` },
      { label: reveal.canMerge ? "Approve 依据" : "修复建议", passed: repairOrRationale === 15, detail: `Legacy compatibility score ${repairOrRationale}/15.` }
    ],
    requiredMatches,
    optionalMatches,
    matchedItems,
    penalties: [],
    unverifiedFindings: draft.findings.map((finding) => finding.id),
    capsApplied: []
  };
}
