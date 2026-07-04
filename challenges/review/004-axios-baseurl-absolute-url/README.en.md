# Review 004: Axios — harden the internal API client against protocol-relative URL bypass

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Reject protocol-relative URLs on internalApi to prevent baseURL bypass**
>
> internalApi is an Axios instance whose baseURL points at an internal service, with an Authorization header attached by default. We found that passing a protocol-relative URL starting with // (e.g. //evil.test/a) makes Axios treat it as absolute, ignore baseURL, and send the authenticated request to an external host.
>
> This PR adds a check in fetchInternal: if the path starts with //, it throws, closing this protocol-relative URL baseURL-bypass hole.
>
> Added a test verifying //evil.test/a is rejected while normal relative paths still work. All existing tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-internal-api.ts` — pre-patch excerpt of internalApi / fetchInternal (minimal sufficient context)

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

- internalApi points baseURL at an internal service and attaches an Authorization header in the instance defaults; fetchInternal(path) issues a GET with it.
- Axios URL rule: when path is an absolute URL, baseURL is ignored and the request goes straight to the origin named in path.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue (the `ai-pr.diff` you review is an AgentCode training adaptation, not the upstream fix). Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
