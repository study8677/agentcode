import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { POST } from "../../src/app/api/review/[slug]/submit/route";

const routeContext = {
  params: Promise.resolve({ slug: "003-next-server-actions-ssrf" })
};

function fixtureDraft() {
  const path = join(
    process.cwd(),
    "challenges/review/003-next-server-actions-ssrf/fixtures/strong-zh.json"
  );
  return (JSON.parse(readFileSync(path, "utf8")) as { draft: unknown }).draft;
}

function request(body: unknown) {
  return new Request("http://agentcode.test/api/review/003-next-server-actions-ssrf/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

afterEach(() => {
  delete process.env.REVIEW_PERSISTENCE_ENABLED;
  delete process.env.REVIEW_EVALUATOR_MODE;
  delete process.env.DATABASE_URL;
});

describe("review submit API", () => {
  it("returns evaluator v2 feedback for a valid draft", async () => {
    process.env.REVIEW_PERSISTENCE_ENABLED = "false";
    const response = await POST(request({ submissionId: "api-valid-001", draft: fixtureDraft() }), routeContext);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.feedback).toMatchObject({ apiVersion: 2, score: 100, status: "provisional" });
    expect(body.persistence).toBe("disabled");
  });

  it("returns legacy-compatible feedback and exposes v2 only as shadow data", async () => {
    process.env.REVIEW_PERSISTENCE_ENABLED = "false";
    process.env.REVIEW_EVALUATOR_MODE = "shadow";
    const response = await POST(request({ submissionId: "api-shadow-001", draft: fixtureDraft() }), routeContext);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.evaluatorMode).toBe("shadow");
    expect(body.feedback.evaluatorVersion).toBe("review-evaluator-v2-legacy-compat");
    expect(body.shadowFeedback).toMatchObject({
      apiVersion: 2,
      evaluatorVersion: "review-evaluator-v2",
      status: "provisional"
    });
  });

  it("rejects fabricated anchors without leaking the reveal", async () => {
    const response = await POST(request({
      submissionId: "api-invalid-001",
      draft: {
        mergeDecision: "no",
        conclusion: "这个提交不能合并，因为存在严重安全风险。",
        findings: [{
          id: "fake",
          fileName: "missing.ts",
          lineNumber: 999_999,
          severity: "critical",
          blocksMerge: true,
          problem: "host ssrf",
          evidence: "host header",
          impact: "internal fetch",
          fix: "trusted origin"
        }],
        tests: "test forged host"
      }
    }), routeContext);
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body.code).toBe("INVALID_REVIEW_DRAFT");
    expect(body).not.toHaveProperty("reveal");
  });

  it("fails closed when persistence is enabled without a database", async () => {
    process.env.REVIEW_PERSISTENCE_ENABLED = "true";
    const response = await POST(request({ submissionId: "api-db-fail-001", draft: fixtureDraft() }), routeContext);
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.code).toBe("DATABASE_UNAVAILABLE");
    expect(body).not.toHaveProperty("reveal");
    expect(body).not.toHaveProperty("feedback");
  });

  it("rejects requests larger than 64 KiB", async () => {
    const response = await POST(request({ padding: "x".repeat(70 * 1024) }), routeContext);

    expect(response.status).toBe(413);
  });
});
