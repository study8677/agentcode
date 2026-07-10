import { describe, expect, it } from "vitest";

import { calculateAdjudicationScore, type AdjudicationInput } from "./adjudication";

function input(overrides: Partial<AdjudicationInput> = {}): AdjudicationInput {
  return {
    mergeDecision: "hit",
    items: [{
      rubricItemId: "required-1",
      core: "hit",
      impact: "hit",
      testQuality: "hit",
      fixOrRationale: "hit"
    }],
    falsePositives: [],
    contradictionConfirmed: false,
    feedback: "Final reviewer feedback.",
    overrideReason: "Manual rubric adjudication.",
    ...overrides
  };
}

describe("calculateAdjudicationScore", () => {
  it("awards the fixed 30/30/15/10/15 weights", () => {
    expect(calculateAdjudicationScore(input())).toEqual({
      score: 100,
      dimensions: {
        mergeDecision: 30,
        core: 30,
        impact: 15,
        testQuality: 10,
        fixOrRationale: 15
      },
      penalties: { falsePositive: 0, contradiction: 0 }
    });
  });

  it("deducts at most twenty points for confirmed false positives", () => {
    const result = calculateAdjudicationScore(input({
      falsePositives: [
        { ruleId: "fp-1", confirmed: true },
        { ruleId: "fp-2", confirmed: true },
        { ruleId: "fp-3", confirmed: true }
      ]
    }));

    expect(result.score).toBe(80);
    expect(result.penalties.falsePositive).toBe(20);
  });

  it("caps a wrong merge decision at sixty", () => {
    expect(calculateAdjudicationScore(input({ mergeDecision: "miss" })).score).toBe(60);
  });

  it("caps a submission with every core item missed at fifty", () => {
    const result = calculateAdjudicationScore(input({
      items: [{
        rubricItemId: "required-1",
        core: "miss",
        impact: "hit",
        testQuality: "hit",
        fixOrRationale: "hit"
      }]
    }));

    expect(result.score).toBe(50);
  });

  it("requires feedback and an audit reason", () => {
    expect(() => calculateAdjudicationScore(input({ overrideReason: "" }))).toThrow(/audit reason/i);
  });
});
