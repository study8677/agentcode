import { NextResponse } from "next/server";

import { deleteReviewSession, reviewDataErrorResponse, reviewSessionClearCookie } from "@/lib/review-data";

export async function DELETE(request: Request) {
  try {
    const result = await deleteReviewSession(request);
    const response = NextResponse.json(result);
    response.headers.set("Set-Cookie", reviewSessionClearCookie());
    return response;
  } catch (error) {
    return reviewDataErrorResponse(error);
  }
}
