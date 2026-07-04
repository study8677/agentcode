# Review 009: Django: fix how password reset tokens relate to email state

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Avoid password reset token crashes for users without a usable email**
>
> PasswordResetTokenGenerator currently builds the token hash from stable user fields but assumes every user object has a meaningful email value during reset flows. Custom user models and imported accounts can have an empty email, and that edge case makes the reset path fragile.
>
> This PR guards the hash construction with get_email_field_name(): when the configured email field is empty, the generator falls back to the existing password/login/timestamp material instead of depending on an empty email value.
>
> Added a regression test for a user with an empty email to confirm token creation and validation still work. Existing auth tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-tokens.py` — pre-patch token generator excerpt (minimal sufficient context)

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

- Django password reset tokens put selected user state into hash material so old tokens stop working after important state changes.
- Projects may customize the user model and email field name.
- When reviewing token logic, distinguish between avoiding a narrow crash and preserving the token invalidation contract.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue (the `ai-pr.diff` you review is an AgentCode training adaptation, not the upstream fix). Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
