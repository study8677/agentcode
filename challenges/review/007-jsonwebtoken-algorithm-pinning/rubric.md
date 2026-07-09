# Rubric

Total: 100 points.

## Merge Decision: 30

- 30: Says this PR must not be merged / requires changes.
- 10: Expresses uncertainty but identifies a blocking risk.
- 0: Says it can be merged without qualification.

## Core Risk: 30

- 30: Clearly explains both deterministic blockers: The patch removes the RS256 algorithms allowlist, and `JWT_SECRET || undefined` defers required key-configuration failure from startup to the request path.
- 18: Identifies only one of the two blockers or describes both without tying them to the changed diff lines.
- 8: Vaguely says the condition is too broad or tests are incomplete.
- 0: Misses the core risk.

## Semantic Boundary: 15

- 15: Explains the intended contract and why the AI patch changes it.
- 8: Mentions edge cases but does not describe the contract.
- 0: Does not discuss the intended behavior.

## Test Quality: 10

- 10: Identifies the missing negative/boundary test: The tests add a dev happy path but not malicious tokens.
- 5: Says tests are insufficient without naming the missing case.
- 0: Treats the tests as sufficient.

## Repair Direction: 15

- 15: Gives an actionable fix: Validate required keys at startup/fail closed, keep algorithms pinned to RS256, and keep any local-dev algorithm/key choice explicit and separately pinned.
- 8: Suggests adding tests but gives only a partial implementation direction.
- 0: No actionable fix.
