import { NextResponse } from "next/server";

import { getReviewChallenge } from "@/lib/challenges/review";
import { scoreReviewDraft, type ReviewDraft, type ReviewLineFinding } from "@/lib/challenges/review-submission";

type ReviewSubmitRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asLineFinding(value: unknown): ReviewLineFinding | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const finding = value as Record<string, unknown>;
  const lineNumber = typeof finding.lineNumber === "number" ? finding.lineNumber : Number(finding.lineNumber);

  if (!Number.isFinite(lineNumber) || lineNumber < 1) {
    return null;
  }

  return {
    id: asString(finding.id),
    fileName: asString(finding.fileName),
    lineNumber,
    severity: asString(finding.severity),
    problem: asString(finding.problem),
    fix: asString(finding.fix)
  };
}

function normalizeDraft(value: unknown): ReviewDraft {
  const draft = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const mergeDecision = asString(draft.mergeDecision);
  const findings = Array.isArray(draft.findings)
    ? draft.findings.map(asLineFinding).filter((finding): finding is ReviewLineFinding => Boolean(finding))
    : [];
  const legacyFinding = [asString(draft.problem), asString(draft.impact), asString(draft.fix)].filter(Boolean).join("\n");

  return {
    mergeDecision: mergeDecision === "yes" || mergeDecision === "no" || mergeDecision === "unknown" ? mergeDecision : "",
    conclusion: asString(draft.conclusion),
    findings: findings.length > 0 || !legacyFinding
      ? findings
      : [{
          id: "legacy-finding",
          fileName: "",
          lineNumber: 1,
          severity: asString(draft.severity) || "high",
          problem: legacyFinding,
          fix: asString(draft.fix)
        }],
    tests: asString(draft.tests)
  };
}

export async function POST(request: Request, { params }: ReviewSubmitRouteProps) {
  const { slug } = await params;
  const challenge = getReviewChallenge(slug);

  if (!challenge) {
    return NextResponse.json({ error: "Review challenge not found." }, { status: 404 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const draft = normalizeDraft(body && typeof body === "object" ? (body as Record<string, unknown>).draft : null);
  const feedback = scoreReviewDraft(draft, challenge.metadata.scoringHints, challenge.reveal);

  return NextResponse.json({
    feedback,
    reveal: challenge.reveal
  });
}
