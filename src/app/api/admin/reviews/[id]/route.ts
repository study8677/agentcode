import { NextResponse } from "next/server";

import {
  adjudicateReviewAttempt,
  authenticateReviewer,
  getReviewAttemptForAdmin,
  reviewDataErrorResponse,
  type AdjudicationInput,
  type AdjudicationResult
} from "@/lib/review-data";

type RouteProps = { params: Promise<{ id: string }> };

function result(value: unknown): AdjudicationResult {
  return value === "hit" || value === "partial" || value === "miss" ? value : "miss";
}

function normalizeInput(value: unknown): AdjudicationInput {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const rawItems = Array.isArray(body.items) ? body.items : [];
  const rawFalsePositives = Array.isArray(body.falsePositives) ? body.falsePositives : [];

  return {
    mergeDecision: result(body.mergeDecision),
    items: rawItems.map((value) => {
      const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
      return {
        rubricItemId: typeof item.rubricItemId === "string" ? item.rubricItemId : "",
        core: result(item.core),
        impact: result(item.impact),
        testQuality: result(item.testQuality),
        fixOrRationale: result(item.fixOrRationale)
      };
    }),
    falsePositives: rawFalsePositives.map((value) => {
      const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
      return {
        ruleId: typeof item.ruleId === "string" ? item.ruleId : "",
        confirmed: item.confirmed === true
      };
    }),
    contradictionConfirmed: body.contradictionConfirmed === true,
    feedback: typeof body.feedback === "string" ? body.feedback : "",
    overrideReason: typeof body.overrideReason === "string" ? body.overrideReason : ""
  };
}

export async function GET(_request: Request, { params }: RouteProps) {
  try {
    await authenticateReviewer();
    const { id } = await params;
    const attempt = await getReviewAttemptForAdmin(id);
    return NextResponse.json({ attempt });
  } catch (error) {
    return reviewDataErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: RouteProps) {
  try {
    const reviewer = await authenticateReviewer();
    const { id } = await params;
    const input = normalizeInput(await request.json());
    const adjudication = await adjudicateReviewAttempt(id, reviewer.githubId, input);
    return NextResponse.json({ adjudication });
  } catch (error) {
    return reviewDataErrorResponse(error);
  }
}
