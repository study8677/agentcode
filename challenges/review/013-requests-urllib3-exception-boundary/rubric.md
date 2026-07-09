# Rubric

Total: 100 points.

## Merge Decision: 30

- 30: Says this PR can be merged / approve (optionally with a non-blocking follow-up note).
- 10: Says "need more info" but has already confirmed ClosedPoolError genuinely leaked and the mapping is correct.
- 0: Says request changes / must not be merged.

## Core Verification: 30

- 30: Confirms ClosedPoolError is not a subclass of any exception the adapter already catches, so it really leaked and the new except correctly targets it.
- 18: Says the mapping looks right but does not verify it was actually leaking / uncaught before.
- 8: Vaguely says "wrapping the exception is fine".
- 0: Does not verify the fix.

## Semantic Boundary: 15

- 15: Explains that except-clause ordering matters and confirms the new handler is not shadowed (no inheritance relation to earlier handlers), so it is not dead code.
- 8: Mentions the mapping but not placement/ordering safety.
- 0: Does not discuss how the change fits the existing exception chain.

## Test Quality: 10

- 10: Confirms the regression test genuinely reproduces a ClosedPoolError and asserts callers now get ConnectionError.
- 5: Says the test looks fine without checking it reproduces the leak.
- 0: Misjudges the test.

## Decision Quality: 15

- 15: Approves for correct reasons; if "other exceptions could also be wrapped" is raised, frames it as a non-blocking follow-up rather than a blocker.
- 8: Approves with weak justification.
- 0: Rejects for a disallowed reason (incomplete boundary / must also wrap DecodeError/TimeoutError / test too narrow).
