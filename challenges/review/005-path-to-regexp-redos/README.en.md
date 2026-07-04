# Review 005: path-to-regexp: fix catastrophic backtracking for adjacent route params

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Fix ReDoS in route compilation for adjacent parameters (GHSA-9wv6-86v2-598j)**
>
> GHSA-9wv6-86v2-598j reports that path-to-regexp compiles adjacent route parameters (like /:a-:b) into overlapping capture groups; a single very long path triggers catastrophic regex backtracking and stalls the Node event loop.
>
> This PR detects adjacent parameters at compile time: when one parameter is immediately followed by another, the earlier capture stops at the separator ([^/-]+? instead of [^/]+?), so the two groups can no longer overlap and long paths no longer backtrack exponentially.
>
> Added a regression test: the regex compiled from /:a-:b returns false immediately on a 20,000-character non-matching input instead of hanging. All existing tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-compiler.ts` — pre-patch excerpt of the route compiler (minimal sufficient context)

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

- path-to-regexp compiles Express-style route templates into regexes: each parameter token becomes a capture group, with a literal separator between adjacent captures.
- The default capture for a parameter is [^/]+? (lazy, "anything but a slash"). When two such captures are separated by a character that is itself in that class, the engine backtracks heavily on long non-matching inputs.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue (the `ai-pr.diff` you review is an AgentCode training adaptation, not the upstream fix). Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
