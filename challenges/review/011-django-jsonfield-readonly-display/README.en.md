# Review 011: Django admin: render readonly JSONField as valid JSON

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Serialize readonly JSONField values as JSON in the admin**
>
> On the admin change page, readonly JSONField values currently fall through to the catch-all branch of display_for_field and are rendered with str(value), i.e. Python repr such as `{'foo': 'bar'}` — not valid JSON, and inconsistent with what the editable widget shows.
>
> This PR adds a JSONField branch to display_for_field that calls field.get_prep_value(value), so the display uses the field's own JSON serialization (honoring custom encoders). Values that cannot be serialized are caught via TypeError and fall back to the existing generic display path, so the change page never errors out.
>
> Added test_json_display_for_field covering nested dicts, lists, plain strings, and an unserializable value, and extended the null-display test with a JSONField None assertion. All existing tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-admin-utils.py` — pre-patch excerpt of display_for_field / display_for_value and JSONField.get_prep_value (minimal sufficient context)

Then submit your review:

```text
Can merge? Yes / No / Need more info

Finding 1:
- Severity:
- Problem:
- Why it matters:
- Suggested fix:

Testing:
- What do the new tests actually prove? What is missing?
```

## Background

- display_for_field is the entry point the Django admin uses to render readonly field values: it special-cases field types one by one (Boolean, DateTime, Decimal, FileField, ...) and falls back to display_for_value, which ends in str(value).
- JSONField.get_prep_value is defined as json.dumps(value, cls=self.encoder): it emits JSON text, honors the field's custom encoder, and raises TypeError for values that cannot be JSON-serialized.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue (the `ai-pr.diff` you review is an AgentCode adaptation for review training). Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
