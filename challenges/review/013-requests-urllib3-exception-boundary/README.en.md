# Review 013: Requests: wrap a urllib3 connection-pool exception

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Wrap ClosedPoolError as a Requests ConnectionError**
>
> When an adapter is reused after its connection pool has been closed, urllib3's ClosedPoolError leaks straight through to callers, breaking the expectation that Requests users only need to catch requests.exceptions types (issue #2674).
>
> This PR imports ClosedPoolError in adapters.py and maps it to requests.exceptions.ConnectionError next to the existing urllib3-to-Requests exception conversions.
>
> Added a focused regression test for ClosedPoolError so callers now see ConnectionError. Existing Requests tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-adapters.py` — pre-patch excerpt of HTTPAdapter.send's exception mapping (minimal sufficient context)

Then submit your review:

```text
Can merge? Yes / No / Need more info

Finding 1:
- Severity:
- Problem: (if you approve, list the points you verified)
- Why it matters:
- Suggested fix:

Testing:
- What does the new test prove? Is it trustworthy?
```

## Background

- Requests promises a `requests.exceptions` hierarchy; the adapter layer maps lower-level urllib3 exceptions into Requests' own types.
- HTTPAdapter.send already maps ProtocolError/OSError, MaxRetryError (and its reason branches), _ProxyError, _SSLError, ReadTimeoutError. Check first whether ClosedPoolError is caught by any existing branch.
- The source excerpt includes the relevant urllib3 hierarchy: ClosedPoolError inherits from PoolError, not from any exception type already caught by HTTPAdapter.send.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue. Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
