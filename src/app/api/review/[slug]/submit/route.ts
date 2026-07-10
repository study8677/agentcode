import { NextResponse } from "next/server";

import { getReviewChallenge } from "@/lib/challenges/review";
import {
  ReviewDraftValidationError,
  scoreReviewDraft,
  scoreReviewDraftLegacyCompat,
  type ReviewDraft,
  type ReviewLineFinding
} from "@/lib/challenges/review-submission";
import { createReviewAttempt } from "@/lib/review-data/attempts";
import { reviewDataErrorResponse } from "@/lib/review-data/http";
import { getOrCreateReviewSession } from "@/lib/review-data/session";

type ReviewSubmitRouteProps = {
  params: Promise<{
    slug: string;
  }>;
};

const MAX_REQUEST_BYTES = 64 * 1024;
const MAX_CONCLUSION_LENGTH = 4_000;
const MAX_TESTS_LENGTH = 4_000;
const MAX_FINDING_FIELD_LENGTH = 2_000;

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asLineFinding(value: unknown): ReviewLineFinding | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const finding = value as Record<string, unknown>;
  const lineNumber = typeof finding.lineNumber === "number" ? finding.lineNumber : Number(finding.lineNumber);

  return {
    id: asString(finding.id),
    fileName: asString(finding.fileName),
    lineNumber,
    severity: asString(finding.severity),
    blocksMerge: typeof finding.blocksMerge === "boolean" ? finding.blocksMerge : undefined,
    problem: asString(finding.problem),
    evidence: asString(finding.evidence),
    impact: asString(finding.impact),
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
          blocksMerge: mergeDecision === "no",
          problem: legacyFinding,
          evidence: "",
          impact: asString(draft.impact),
          fix: asString(draft.fix)
        }],
    tests: asString(draft.tests)
  };
}

function validateTextLengths(draft: ReviewDraft) {
  const issues: Array<{ path: string; message: string }> = [];

  if (draft.conclusion.length > MAX_CONCLUSION_LENGTH) {
    issues.push({ path: "conclusion", message: `Conclusion must be at most ${MAX_CONCLUSION_LENGTH} characters.` });
  }
  if (draft.tests.length > MAX_TESTS_LENGTH) {
    issues.push({ path: "tests", message: `Tests must be at most ${MAX_TESTS_LENGTH} characters.` });
  }

  draft.findings.forEach((finding, index) => {
    for (const field of ["problem", "evidence", "impact", "fix"] as const) {
      if ((finding[field] ?? "").length > MAX_FINDING_FIELD_LENGTH) {
        issues.push({
          path: `findings.${index}.${field}`,
          message: `${field} must be at most ${MAX_FINDING_FIELD_LENGTH} characters.`
        });
      }
    }
  });

  return issues;
}

async function parseBody(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));

  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return { error: NextResponse.json({ error: "Review submission is too large.", code: "PAYLOAD_TOO_LARGE" }, { status: 413 }) };
  }

  const text = await request.text();

  if (Buffer.byteLength(text, "utf8") > MAX_REQUEST_BYTES) {
    return { error: NextResponse.json({ error: "Review submission is too large.", code: "PAYLOAD_TOO_LARGE" }, { status: 413 }) };
  }

  try {
    return { body: JSON.parse(text) as unknown };
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON body.", code: "INVALID_JSON" }, { status: 400 }) };
  }
}

export async function POST(request: Request, { params }: ReviewSubmitRouteProps) {
  const { slug } = await params;
  const challenge = getReviewChallenge(slug);

  if (!challenge) {
    return NextResponse.json({ error: "Review challenge not found.", code: "CHALLENGE_NOT_FOUND" }, { status: 404 });
  }

  const parsed = await parseBody(request);

  if (parsed.error) {
    return parsed.error;
  }

  const record = parsed.body && typeof parsed.body === "object" ? parsed.body as Record<string, unknown> : {};
  const draft = normalizeDraft(record.draft);
  const textIssues = validateTextLengths(draft);

  if (textIssues.length > 0) {
    return NextResponse.json(
      { error: "Review draft failed validation.", code: "INVALID_REVIEW_DRAFT", issues: textIssues },
      { status: 422 }
    );
  }

  let feedback;
  let shadowFeedback: ReturnType<typeof scoreReviewDraft> | null = null;
  const configuredEvaluatorMode = process.env.REVIEW_EVALUATOR_MODE;
  const evaluatorMode = configuredEvaluatorMode === "legacy" || configuredEvaluatorMode === "shadow"
    ? configuredEvaluatorMode
    : "v2";

  try {
    const v2Feedback = scoreReviewDraft(draft, challenge.metadata.scoringHints, challenge.reveal);

    if (evaluatorMode === "legacy" || evaluatorMode === "shadow") {
      feedback = scoreReviewDraftLegacyCompat(draft, challenge.metadata.scoringHints, challenge.reveal);
      shadowFeedback = evaluatorMode === "shadow" ? v2Feedback : null;
    } else {
      feedback = v2Feedback;
    }
  } catch (error) {
    if (error instanceof ReviewDraftValidationError) {
      return NextResponse.json(
        { error: error.message, code: "INVALID_REVIEW_DRAFT", issues: error.issues },
        { status: 422 }
      );
    }
    throw error;
  }

  if (process.env.REVIEW_PERSISTENCE_ENABLED !== "true") {
    return NextResponse.json({
      attempt: null,
      feedback,
      shadowFeedback,
      reveal: challenge.reveal,
      persistence: "disabled",
      evaluatorMode
    });
  }

  try {
    const submissionId = asString(record.submissionId);
    const timing = record.timing && typeof record.timing === "object"
      ? record.timing as { startedAt?: string; durationMs?: number }
      : undefined;
    const { session, setCookie } = await getOrCreateReviewSession(request);
    const { attempt, idempotent } = await createReviewAttempt({
      sessionId: session.id,
      submissionId,
      challengeSlug: slug,
      challengeVersion: feedback.challengeVersion,
      evaluatorVersion: feedback.evaluatorVersion,
      draft,
      provisionalFeedback: shadowFeedback ? { ...feedback, shadowEvaluation: shadowFeedback } : feedback,
      answerSnapshot: challenge.reveal,
      timing
    });
    const response = NextResponse.json({
      attempt: {
        id: attempt.id,
        status: attempt.status === "ADJUDICATED" ? "adjudicated" : "pending",
        attemptNumber: attempt.attemptNumber,
        isFirstAttempt: attempt.isFirstAttempt,
        adjudicationDeadline: attempt.adjudicationDeadline
      },
      feedback: idempotent ? attempt.provisionalFeedback : feedback,
      shadowFeedback: idempotent ? null : shadowFeedback,
      reveal: idempotent ? attempt.answerSnapshot : challenge.reveal,
      persistence: "stored",
      idempotent,
      evaluatorMode
    });

    if (setCookie) {
      response.headers.set("Set-Cookie", setCookie);
    }

    return response;
  } catch (error) {
    return reviewDataErrorResponse(error);
  }
}
