import { NextResponse } from "next/server";

import { authenticateReviewer, getReviewMetrics, reviewDataErrorResponse } from "@/lib/review-data";

export async function GET() {
  try {
    await authenticateReviewer();
    return NextResponse.json(await getReviewMetrics());
  } catch (error) {
    return reviewDataErrorResponse(error);
  }
}
