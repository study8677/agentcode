# Review 008: Django: reject trailing newlines in username validation

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Make UsernameValidator reject usernames with a trailing newline**
>
> ASCIIUsernameValidator and UnicodeUsernameValidator currently validate usernames with `'^[\w.@+-]+$'`, but Python's $ anchor can match before a trailing newline, so a username like `'joe\n'` passes validation and can be created through forms and the API.
>
> This PR changes the end anchor from $ to \Z in both validators: \Z only matches at the true end of the string, so trailing-newline usernames raise ValidationError as expected. The character class and the rest of the logic are unchanged.
>
> Added a trailing-newline entry to both invalid_usernames lists in auth_tests as regression tests. All existing tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-validators.py` — pre-patch excerpt of the validators and the RegexValidator base class (minimal sufficient context)

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

- ASCIIUsernameValidator and UnicodeUsernameValidator are the default validators for the Django auth username field; both inherit RegexValidator, which applies regex.search to the input and raises ValidationError on no match.
- In Python's re module, $ (without MULTILINE) matches at the end of the string and also just before a trailing newline; \Z only matches at the absolute end of the string. ^ (without MULTILINE) matches only at the start of the string.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue (the `ai-pr.diff` you review is an AgentCode adaptation for review training). Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
