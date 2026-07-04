# Rubric

Total: 100 points.

## Merge Decision: 30

- 30: Approves the PR (can merge).
- 10: Says "need more info" but explicitly confirms the main risk points below.
- 0: Says it cannot be merged / requires changes.

## Core Verification: 30

- 30: Explicitly verifies both: (a) get_prep_value returns json.dumps(value, cls=self.encoder), so display becomes valid double-quoted JSON honoring custom encoders; (b) unserializable values raise TypeError inside json.dumps and the patch falls back to display_for_value instead of breaking the change page.
- 18: Verifies the serialization path but not the TypeError fallback (or vice versa).
- 8: Approves on general impressions ("uses the field API, looks right") without concrete verification.
- 0: No verification of what the change does.

## Semantic Boundary: 15

- 15: States the before/after contract: readonly JSONField used to fall through to str(value) (Python repr, single quotes); now truthy JSONField values render as serialized JSON, while None keeps hitting the earlier empty-value branch and all other field types are untouched.
- 8: Mentions the display change without delimiting which values and field types are affected.
- 0: Does not discuss the behavior boundary.

## Test Quality: 10

- 10: Evaluates the added tests and concludes they are trustworthy: nested dict, list, string, an unserializable value, and the None case are all asserted, and the JSON-output assertions fail on the old repr-based code.
- 5: Mentions the tests without assessing what they prove.
- 0: Ignores the tests or wrongly claims boundary coverage is missing.

## Decision Quality: 15

- 15: Approve rationale is concrete and avoids the disallowed rejections (calling get_prep_value a misused DB API, treating the repr assertion for invalid JSON as a test bug, demanding a direct json.dumps call).
- 8: Correct decision with a thin or partially incorrect rationale.
- 0: Rejects for one of the disallowed reasons.
