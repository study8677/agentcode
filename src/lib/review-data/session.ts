import { createHash, randomBytes } from "node:crypto";

import type { AnonymousReviewSession } from "@prisma/client";

import { getDb } from "@/lib/db";

import { ReviewDataError } from "./errors";

export const REVIEW_SESSION_COOKIE = "agentcode_review_session";
export const REVIEW_SESSION_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;

function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie");

  if (!raw) {
    return null;
  }

  for (const part of raw.split(";")) {
    const [cookieName, ...cookieValue] = part.trim().split("=");

    if (cookieName === name) {
      try {
        return decodeURIComponent(cookieValue.join("="));
      } catch {
        return null;
      }
    }
  }

  return null;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function issueToken() {
  return randomBytes(32).toString("base64url");
}

export function reviewSessionSetCookie(token: string) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${REVIEW_SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${REVIEW_SESSION_MAX_AGE_SECONDS}${secure}`;
}

export function reviewSessionClearCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${REVIEW_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}

export type ResolvedReviewSession = {
  session: AnonymousReviewSession;
  setCookie: string | null;
};

export async function getReviewSession(request: Request, options: { touch?: boolean } = {}) {
  const token = readCookie(request, REVIEW_SESSION_COOKIE);

  if (!token || token.length < 32 || token.length > 128) {
    return null;
  }

  const db = getDb();
  const session = await db.anonymousReviewSession.findUnique({
    where: { tokenHash: hashToken(token) }
  });

  if (!session) {
    return null;
  }

  if (options.touch !== false) {
    return db.anonymousReviewSession.update({
      where: { id: session.id },
      data: { lastSeenAt: new Date() }
    });
  }

  return session;
}

export async function getOrCreateReviewSession(request: Request): Promise<ResolvedReviewSession> {
  const existing = await getReviewSession(request);

  if (existing) {
    return { session: existing, setCookie: null };
  }

  const db = getDb();
  const token = issueToken();
  const session = await db.anonymousReviewSession.create({
    data: { tokenHash: hashToken(token) }
  });

  return { session, setCookie: reviewSessionSetCookie(token) };
}

export async function requireReviewSession(request: Request) {
  const session = await getReviewSession(request);

  if (!session) {
    throw new ReviewDataError("REVIEW_SESSION_NOT_FOUND", "No active anonymous review session was found.", 401);
  }

  return session;
}

export async function deleteReviewSession(request: Request) {
  const session = await getReviewSession(request, { touch: false });

  if (!session) {
    return { deleted: false };
  }

  await getDb().anonymousReviewSession.delete({ where: { id: session.id } });
  return { deleted: true };
}
