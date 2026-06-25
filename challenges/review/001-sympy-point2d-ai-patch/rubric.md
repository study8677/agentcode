# Rubric

Total: 100 points.

## Merge Decision: 30

- 30: Says this PR must not be merged.
- 10: Expresses uncertainty but identifies a blocking risk.
- 0: Says it can be merged without qualification.

## Core Regression: 35

- 35: Clearly explains that gating the imaginary-coordinate check behind `evaluate` allows invalid imaginary coordinates when `evaluate(False)` is active.
- 20: Mentions a regression around imaginary coordinates but does not connect it to `evaluate(False)`.
- 10: Vaguely says the condition is too broad.
- 0: Misses the regression.

## Semantic Boundary: 15

- 15: Distinguishes unknown/non-imaginary inputs from clearly imaginary inputs, and explains that only clearly imaginary coordinates should be rejected.
- 8: Mentions edge cases but does not describe the semantic distinction.
- 0: Does not discuss the intended behavior.

## Test Quality: 10

- 10: Notes that the added test only checks the formerly failing happy path and misses a negative test for `Point(I, 2)` or equivalent under `evaluate(False)`.
- 5: Says tests are insufficient without specifying the missing case.
- 0: Treats the test as sufficient.

## Repair Direction: 10

- 10: Suggests keeping the imaginary-coordinate guard active and changing the predicate to a stricter zero check, such as rejecting only when `im(a).is_zero is False`, plus adding regression tests.
- 5: Suggests adding tests but not the implementation direction.
- 0: No actionable fix.
