# Review 003: Server Actions — support relative post-login redirects

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Support relative post-login redirects instead of only the configured origin**
>
> The login flow needs to return the user to the page they were originally on after authentication. Today followActionRedirect only resolves against process.env.APP_ORIGIN, so every redirect lands on that fixed origin and ignores the site the user is actually on — multi-domain and preview deployments end up on the wrong domain.
>
> This PR instead validates that redirectUrl is a relative path starting with / (rejecting external absolute URLs), then rebuilds the target URL on the user's current site using the request proto + host, and fetches that page on the server to return its contents. Multi-domain and preview environments now redirect back to the right page.
>
> Added a test verifying that a relative redirect works. All existing tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-action.ts` — pre-patch excerpt of followActionRedirect (minimal sufficient context)

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

- Server Actions run on the server; followActionRedirect fetches the target URL on the server and returns the response body to the caller.
- Returning the user to their original page is a common need: it requires a "target site origin + relative path" to locate that page.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue (the `ai-pr.diff` you review is an AgentCode training adaptation, not the upstream fix). Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
