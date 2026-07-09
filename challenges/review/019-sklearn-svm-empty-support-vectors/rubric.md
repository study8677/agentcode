# Rubric

Total: 100 points.

## Merge Decision: 30

- 30: Says this PR can be merged / approve (optionally with a non-blocking follow-up nit).
- 10: Says "need more info" but has already confirmed the root cause and that the normal path is unchanged.
- 0: Says request changes / must not be merged.

## Core Verification: 30

- 30: Confirms the empty case crashed because dual_coef_indptr = np.arange(0, size+1, size/n_class) has step 0 when n_SV == 0, and the new guard short-circuits exactly that.
- 18: Identifies that n_SV == 0 is the crashing edge case but not the precise arange-step mechanism.
- 8: Vaguely says the empty branch avoids an error.
- 0: Does not verify the fix mechanism.

## Semantic Boundary: 15

- 15: Explains that only the n_SV == 0 branch is new and the non-empty path (else) is byte-for-byte the old logic.
- 8: Mentions the branch but does not confirm the normal path is unchanged.
- 0: Does not discuss the before/after behavior contract.

## Test Quality: 10

- 10: Confirms the regression test genuinely reproduces zero support vectors (linear SVR on the given inputs) and is trustworthy.
- 5: Says the test looks fine without checking that it reproduces the empty case.
- 0: Treats the test as vacuous or misjudges it.

## Decision Quality: 15

- 15: Approves for actionable, correct reasons and, if an explicit empty-shape question is raised, correctly frames it as a non-blocking follow-up because the contract is empty dual coefficients.
- 8: Approves but with weak or partial justification.
- 0: Rejects for a disallowed reason (requires a particular empty shape / test-checks-size-not-shape / should-raise-instead).
