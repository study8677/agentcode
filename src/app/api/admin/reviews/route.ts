import { NextResponse } from "next/server";

import { authenticateReviewer, listReviewQueue, reviewDataErrorResponse, type ReviewQueueFilter } from "@/lib/review-data";

const FILTERS = new Set<ReviewQueueFilter>(["pending", "overdue", "adjudicated", "all"]);

export async function GET(request: Request) {
  try {
    await authenticateReviewer();
    const url = new URL(request.url);
    const requestedFilter = url.searchParams.get("status") as ReviewQueueFilter | null;
    const filter = requestedFilter && FILTERS.has(requestedFilter) ? requestedFilter : "pending";
    const limit = Number(url.searchParams.get("limit") ?? "100");
    const attempts = await listReviewQueue(filter, Number.isInteger(limit) ? limit : 100);

    return NextResponse.json({ attempts });
  } catch (error) {
    return reviewDataErrorResponse(error);
  }
}
