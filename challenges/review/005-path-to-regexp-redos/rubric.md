# Rubric

Total: 100 points.

## Merge Decision: 30

- 30: Says this PR must not be merged / requires changes.
- 10: Expresses uncertainty but identifies a blocking risk.
- 0: Says it can be merged without qualification.

## Core Risk: 30

- 30: Clearly explains: The patch special-cases one adjacent-parameter shape (dash separator) but does not remove the general overlapping-capture ReDoS.
- 18: Mentions the general risk but misses the exact surviving boundary (other separators / custom patterns).
- 8: Vaguely says the fix is too narrow or tests are incomplete.
- 0: Misses the core risk.

## Semantic Boundary: 15

- 15: Explains why overlapping captures backtrack and why only `suffix === '-'` is covered.
- 8: Mentions edge cases but does not describe the mechanism.
- 0: Does not discuss the intended behavior.

## Test Quality: 10

- 10: Identifies the missing case: the test only exercises the one fixed route shape (/:a-:b), not other separators or custom captures.
- 5: Says tests are insufficient without naming the missing case.
- 0: Treats the tests as sufficient.

## Repair Direction: 15

- 15: Gives an actionable fix: make every adjacent capture have an unambiguous boundary for any separator (or upgrade to a patched version).
- 8: Suggests adding tests but gives only a partial implementation direction.
- 0: No actionable fix.
