# Review 002: Next.js middleware — stop re-running on framework subrequests

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Skip auth middleware for internal framework subrequests to prevent redundant re-execution**
>
> When middleware triggers an internal subrequest (e.g. a rewrite or forward to another route in the same app), middleware runs again, so the auth logic re-executes on the same request chain and some routes even redirect twice.
>
> Next.js tags these internal framework subrequests with the x-middleware-subrequest header. This PR checks that header at the middleware entry: if it is present, the request is an internal framework subrequest, so we NextResponse.next() straight through instead of re-running the auth branch.
>
> Added a test verifying that a subrequest carrying x-middleware-subrequest no longer re-executes. All existing tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-middleware.ts` — pre-patch excerpt of the middleware (minimal sufficient context)

Then submit your review:

```text
Can merge? Yes / No / Need more info

Finding 1:
- Severity:
- Problem:
- Why it matters:
- Suggested fix:

Testing:
- What does the new test actually prove? What is missing?
```

## Background

- middleware.ts runs before a request reaches a route; here it gates /admin, /billing and /settings on a session and redirects anonymous users to /login.
- Next.js attaches an x-middleware-subrequest header to internal framework subrequests to mark the internal call chain and avoid infinite middleware recursion.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue (the `ai-pr.diff` you review is an AgentCode training adaptation, not the upstream fix). Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
