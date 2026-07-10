import { NextResponse } from "next/server";

import { authenticateReviewer, purgeExpiredReviewData, reviewDataErrorResponse } from "@/lib/review-data";

export async function POST() {
  try {
    await authenticateReviewer();
    return NextResponse.json(await purgeExpiredReviewData());
  } catch (error) {
    return reviewDataErrorResponse(error);
  }
}
