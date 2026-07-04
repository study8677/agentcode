# Rubric

Total: 100 points.

## Merge Decision: 30

- 30: Approves the PR: it can be merged as-is.
- 10: Says "need more info" but explicitly confirms the main risk points (the None vs [] paths).
- 0: Says it cannot be merged / requires changes.

## Core Verification: 30

- 30: Explicitly verifies both: (a) self.__all__ is None exactly when the module defines no __all__ (init default, getall returning None, ignore_module_all), so implicit discovery is preserved; (b) __all__ = [] falls into the explicit-filter branch where every member is skipped, while non-empty __all__ behaves identically under the old and new condition.
- 18: Verifies one of the two points.
- 8: Generic "the change looks correct" without tracing either path.
- 0: No verification of the changed condition.

## Semantic Boundary: 15

- 15: States the contract precisely: behavior changes for exactly one input (__all__ = []); absent __all__ and non-empty __all__ behave as before; an empty export list means no public members.
- 8: Mentions the None vs empty distinction without delimiting what does and does not change.
- 0: Does not discuss the behavior contract.

## Test Quality: 10

- 10: Correctly judges the added test decisive (it fails on the pre-patch code because foo/bar/baz would appear), and/or proposes a meaningful strengthening such as a companion absent-__all__ test.
- 5: Mentions the test without assessing what it proves.
- 0: Ignores testing or wrongly claims the test proves nothing.

## Decision Quality: 15

- 15: Approve rationale is concrete and evidence-based, and avoids wrong rejection reasons (e.g. "breaking change that needs an option", "is None is unsafe because __all__ may be undefined").
- 8: Correct decision with a thin rationale.
- 0: Relies on a disallowed conclusion or gives no rationale.
