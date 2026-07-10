import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

import { ReviewDataError } from "./errors";

function adminEnabled() {
  return process.env.REVIEW_ADMIN_ENABLED === "true";
}

function allowedReviewerIds() {
  return new Set(
    (process.env.REVIEWER_GITHUB_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter((value) => /^\d+$/.test(value))
  );
}

export function isAllowedReviewer(githubId: string) {
  return /^\d+$/.test(githubId) && allowedReviewerIds().has(githubId);
}

export const { handlers: reviewerAuthHandlers, auth: reviewerAuth } = NextAuth({
  basePath: "/api/admin/auth",
  providers: [GitHub],
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 },
  callbacks: {
    async signIn({ account }) {
      return adminEnabled()
        && account?.provider === "github"
        && typeof account.providerAccountId === "string"
        && isAllowedReviewer(account.providerAccountId);
    },
    async jwt({ token, account }) {
      if (account?.provider === "github" && typeof account.providerAccountId === "string") {
        token.reviewerGithubId = account.providerAccountId;
      }

      return token;
    },
    async session({ session, token }) {
      return Object.assign(session, {
        reviewerGithubId: typeof token.reviewerGithubId === "string" ? token.reviewerGithubId : null
      });
    }
  }
});

export async function authenticateReviewer() {
  if (!adminEnabled()) {
    throw new ReviewDataError("ADMIN_DISABLED", "Review administration is disabled.", 404);
  }

  const session = await reviewerAuth();
  const githubId = (session as (typeof session & { reviewerGithubId?: unknown }) | null)?.reviewerGithubId;

  if (typeof githubId !== "string" || !isAllowedReviewer(githubId)) {
    throw new ReviewDataError("REVIEWER_UNAUTHORIZED", "A valid allowlisted GitHub reviewer session is required.", 401);
  }

  return { githubId, session };
}
