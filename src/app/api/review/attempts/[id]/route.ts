import { NextResponse } from "next/server";

import { getOwnedReviewAttempt, requireReviewSession, reviewDataErrorResponse, serializeReviewAttempt } from "@/lib/review-data";

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteProps) {
  try {
    const session = await requireReviewSession(request);
    const { id } = await params;
    const attempt = await getOwnedReviewAttempt(session.id, id);

    return NextResponse.json({ attempt: serializeReviewAttempt(attempt) });
  } catch (error) {
    return reviewDataErrorResponse(error);
  }
}
