import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { getReviewChallenge, getReviewChallengeSlugs } from "../../src/lib/challenges/review";
import {
  ReviewDraftValidationError,
  scoreReviewDraft,
  validateReviewDraft,
  type ReviewDraft
} from "../../src/lib/challenges/review-submission";

type GoldenFixture = {
  expected: {
    minScore?: number;
    maxScore?: number;
    validationError?: boolean;
  };
  draft: ReviewDraft;
};

const fixtureNames = [
  "strong-zh.json",
  "strong-en.json",
  "partial.json",
  "wrong-disallowed.json",
  "keyword-stuffing-fabricated-location.json"
] as const;

function loadFixture(slug: string, name: string): GoldenFixture {
  return JSON.parse(readFileSync(join(process.cwd(), "challenges", "review", slug, "fixtures", name), "utf8")) as GoldenFixture;
}

describe("review evaluator v2 golden fixtures", () => {
  for (const slug of getReviewChallengeSlugs()) {
    const challenge = getReviewChallenge(slug);
    if (!challenge) throw new Error(`Missing challenge ${slug}`);

    for (const fixtureName of fixtureNames) {
      it(`${slug}/${fixtureName}`, () => {
        const fixture = loadFixture(slug, fixtureName);
        if (fixture.expected.validationError) {
          expect(() => scoreReviewDraft(fixture.draft, challenge.metadata.scoringHints, challenge.reveal))
            .toThrow(ReviewDraftValidationError);
          return;
        }

        const feedback = scoreReviewDraft(fixture.draft, challenge.metadata.scoringHints, challenge.reveal);
        expect(feedback.score, JSON.stringify({ dimensions: feedback.dimensions, penalties: feedback.penalties, matched: feedback.matchedItems })).toBeGreaterThanOrEqual(fixture.expected.minScore ?? 0);
        expect(feedback.score).toBeLessThanOrEqual(fixture.expected.maxScore ?? 100);
        expect(feedback.status).toBe("provisional");
        expect(feedback.challengeVersion).toMatch(/^[a-f0-9]{64}$/);
        expect(feedback.evaluatorVersion).toBe("review-evaluator-v2");
      });
    }
  }
});

describe("review evaluator v2 adversarial behavior", () => {
  const challenge = getReviewChallenge("013-requests-urllib3-exception-boundary");
  if (!challenge) throw new Error("Missing approve challenge");
  const strong = loadFixture(challenge.metadata.slug, "strong-en.json").draft;

  it("does not let one finding satisfy two required rubric items", () => {
    const [first, second] = strong.findings;
    const stuffed: ReviewDraft = {
      ...strong,
      findings: [{
        ...first,
        problem: `${first.problem} ${second.problem}`,
        evidence: `${first.evidence} ${second.evidence}`,
        impact: `${first.impact} ${second.impact}`,
        fix: `${first.fix} ${second.fix}`
      }]
    };
    const feedback = scoreReviewDraft(stuffed, challenge.metadata.scoringHints, challenge.reveal);
    expect(feedback.matchedItems.filter((item) => item.kind !== "test" && item.matched)).toHaveLength(1);
    expect(feedback.score).toBeLessThan(100);
  });

  it("does not let test text replace a core finding", () => {
    const feedback = scoreReviewDraft({
      ...strong,
      findings: [],
      tests: strong.findings.map((finding) => [finding.problem, finding.evidence, finding.impact, finding.fix].join(" ")).join(" ")
    }, challenge.metadata.scoringHints, challenge.reveal);
    expect(feedback.dimensions.coreRisk).toBe(0);
    expect(feedback.score).toBeLessThanOrEqual(50);
  });

  it("rejects unknown files, invalid lines, duplicate ids, and invalid severities without answer details", () => {
    const invalid: ReviewDraft = {
      ...strong,
      findings: [
        { ...strong.findings[0], id: "duplicate", fileName: "task.md", lineNumber: 1, severity: "urgent" },
        { ...strong.findings[1], id: "duplicate", lineNumber: 1.5 }
      ]
    };
    const issues = validateReviewDraft(invalid, challenge.reveal);
    expect(issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "unknown_file", "invalid_severity", "duplicate_id", "invalid_line"
    ]));
    expect(JSON.stringify(issues)).not.toContain("ClosedPoolError");
  });

  it("accepts the legacy blocking severity alias", () => {
    const legacy = {
      ...strong,
      findings: strong.findings.map((finding) => ({
        ...finding,
        severity: finding.severity === "critical" ? "blocking" : finding.severity
      }))
    };
    expect(validateReviewDraft(legacy, challenge.reveal)).toEqual([]);
  });

  it("applies a disallowed-conclusion penalty and keeps a wrong merge at or below 60", () => {
    const wrong = loadFixture(challenge.metadata.slug, "wrong-disallowed.json").draft;
    const feedback = scoreReviewDraft(wrong, challenge.metadata.scoringHints, challenge.reveal);
    expect(feedback.penalties.some((penalty) => penalty.id.startsWith("disallowed-"))).toBe(true);
    expect(feedback.score).toBeLessThanOrEqual(60);
  });
});

describe("challenge loading and versioning", () => {
  it("loads all 20 challenges with stable content hashes and structured rubrics", () => {
    const slugs = getReviewChallengeSlugs();
    expect(slugs).toHaveLength(20);
    for (const slug of slugs) {
      const first = getReviewChallenge(slug);
      const second = getReviewChallenge(slug);
      expect(first).not.toBeNull();
      expect(first?.reveal.challengeVersion).toBe(second?.reveal.challengeVersion);
      expect(first?.reveal.requiredFindings.every((finding) => finding.kind && finding.criteria && finding.anchors?.length)).toBe(true);
    }
  });
});
