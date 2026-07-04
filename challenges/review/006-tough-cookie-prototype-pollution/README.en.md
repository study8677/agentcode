# Review 006: tough-cookie: fix prototype pollution via cookie domain

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Reject __proto__ cookie domain to fix prototype pollution (GHSA-72xf-g2v4-qvf3)**
>
> GHSA-72xf-g2v4-qvf3 reports that storing a cookie with Domain=__proto__ in the CookieJar pollutes Object.prototype through MemoryCookieStore's multi-level index assignment.
>
> This PR intercepts at the putCookie entry point: when cookie.domain equals __proto__ the cookie is dropped and never written to the index, so the PoC can no longer pollute the global prototype.
>
> Added a regression test that replays the published PoC (Domain=__proto__) and asserts {}.a is still undefined on a plain object. All existing tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-memstore.js` — pre-patch excerpt of MemoryCookieStore (minimal sufficient context)

Then submit your review:

```text
Can merge? Yes / No / Need more info

Finding 1:
- Severity:
- Problem:
- Why it matters:
- Suggested fix:

Testing:
- What do the existing tests prove? What is missing?
```

## Background

- MemoryCookieStore builds a three-level index (domain -> path -> key) on a plain object this.idx; putCookie writes each layer by those fields.
- findCookie / findCookies read cookies back out of those plain objects by the same fields.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue (the `ai-pr.diff` you review is an AgentCode training adaptation, not the upstream fix). Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
