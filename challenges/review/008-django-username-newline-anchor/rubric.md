# Rubric

Total: 100 points.

## Merge Decision: 30

- 30: Approves the PR (can merge).
- 10: Says "need more info" but explicitly confirms the main risk points below.
- 0: Says it cannot be merged / requires changes.

## Core Verification: 30

- 30: Explicitly verifies both: (a) $ can match before a trailing newline while \Z only matches the absolute end of string, so 'joe\n' is now rejected; (b) the character class and ^ anchor are unchanged, so previously valid usernames still pass.
- 18: Verifies the anchor semantics but does not confirm valid input is unaffected (or vice versa).
- 8: Approves on general impressions ("looks like the standard fix") without concrete verification.
- 0: No verification of what the change does.

## Semantic Boundary: 15

- 15: States the before/after contract: '^[\w.@+-]+$' accepted exactly one trailing newline; the new pattern must match the true end of string; both ASCII and Unicode validators change identically.
- 8: Mentions the boundary case without describing the before/after contract.
- 0: Does not discuss the behavior change.

## Test Quality: 10

- 10: Evaluates the added tests and concludes they are trustworthy: the trailing-newline entries in invalid_usernames fail on the old regex and pass on the new one, covering both validators.
- 5: Mentions the tests without assessing what they prove.
- 0: Ignores the tests or wrongly claims regression coverage is missing.

## Decision Quality: 15

- 15: Approve rationale is concrete and avoids the disallowed rejections (misreading Python's \Z as Perl's, demanding strip/normalization instead of rejection, treating ^ vs \A as a blocker).
- 8: Correct decision with a thin or partially incorrect rationale.
- 0: Rejects for one of the disallowed reasons.
