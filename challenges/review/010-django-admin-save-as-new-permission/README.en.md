# Review 010: Django Admin: adjust when Save as new is shown

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Allow Save as new when a user can change the object**
>
> The admin change form currently hides Save as new unless the user has add permission, even though the button is rendered while editing an existing object. This is confusing for staff who can maintain existing records but do not have broad add access.
>
> This PR treats Save as new as part of the change form action set: if the user can change the current object and save_as is enabled, the button is shown. The popup and change-form guards stay in place.
>
> Added a submit_row regression test for a change-only user so the template context exposes show_save_as_new. Existing admin tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-admin-modify.py` — pre-patch submit_row excerpt (minimal sufficient context)

Then submit your review:

```text
Can merge? Yes / No / Need more info

Finding 1:
- Severity:
- Problem:
- Why it matters:
- Suggested fix:

Testing:
- What does the new test actually prove? What is missing?
```

## Background

- Django admin separates add permission from change permission.
- Save as new appears on the change form, but the action creates a new object.
- When reviewing permission patches, inspect both UI visibility and action semantics.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue (the `ai-pr.diff` you review is an AgentCode training adaptation, not the upstream fix). Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
