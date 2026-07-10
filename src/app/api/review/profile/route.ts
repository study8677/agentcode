import { NextResponse } from "next/server";

import { getReviewProfile, requireReviewSession, reviewDataErrorResponse } from "@/lib/review-data";

export async function GET(request: Request) {
  try {
    const session = await requireReviewSession(request);
    const profile = await getReviewProfile(session.id);

    return NextResponse.json(profile);
  } catch (error) {
    return reviewDataErrorResponse(error);
  }
}
