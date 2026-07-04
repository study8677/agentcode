# Review 012: Requests: make redirect resolution side-effect free

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Make resolve_redirects side-effect free by always copying the original request**
>
> resolve_redirects currently rebinds req to the per-hop request at the end of the loop, so later hops depend on mutable state left behind by earlier hops, which makes it hard to see what each hop is built from.
>
> This PR derives every redirect hop directly from the caller's original request, keeping redirect handling side-effect free and each hop independently replayable.
>
> Added a regression test verifying the caller's original request object is untouched after a redirect chain. All existing tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-sessions.py` — pre-patch excerpt of resolve_redirects (minimal sufficient context)

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

- resolve_redirects is the core loop in the Requests session layer that handles HTTP redirects.
- HTTP status codes impose different requirements: 303 See Other switches the follow-up request to GET; 307/308 preserve the current method and body.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue (the `ai-pr.diff` you review is an AgentCode training adaptation, not the upstream fix). Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
