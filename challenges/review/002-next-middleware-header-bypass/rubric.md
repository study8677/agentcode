# Rubric

Total: 100 points.

## Merge Decision: 30

- 30: Says this PR must not be merged / requires changes.
- 10: Expresses uncertainty but identifies a blocking risk.
- 0: Says it can be merged without qualification.

## Core Risk: 30

- 30: Clearly explains: The patch trusts x-middleware-subrequest from the client.
- 18: Mentions the general risk but misses the exact failing boundary.
- 8: Vaguely says the condition is too broad or tests are incomplete.
- 0: Misses the core risk.

## Semantic Boundary: 15

- 15: Explains the intended contract and why the AI patch changes it.
- 8: Mentions edge cases but does not describe the contract.
- 0: Does not discuss the intended behavior.

## Test Quality: 10

- 10: Identifies the missing negative/boundary test: the new test only proves the early-return branch exists, not that a spoofed request is blocked.
- 5: Says tests are insufficient without naming the missing case.
- 0: Treats the tests as sufficient.

## Repair Direction: 15

- 15: Gives an actionable fix: Do not trust this header in app middleware; upgrade Next.js and strip/reject internal headers at the edge or reverse proxy.
- 8: Suggests adding tests but gives only a partial implementation direction.
- 0: No actionable fix.
