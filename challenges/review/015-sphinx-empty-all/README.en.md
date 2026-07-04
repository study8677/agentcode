# Review 015: Sphinx autodoc: honor an explicitly empty __all__

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Fix autodoc ignoring an empty __all__ attribute**
>
> A user reported that a module declaring `__all__ = []` still gets foo/bar/baz documented by automodule. `__all__` is the module's explicit export declaration; an empty list means "no public members", and autodoc should honor it instead of treating it as absent.
>
> The cause is get_object_members using `not self.__all__` to decide when to perform implicit member discovery, conflating an empty list with an undefined value. This PR changes the condition to `self.__all__ is None`: only modules that truly do not define __all__ use implicit discovery; an empty list uses explicit export filtering and skips all members.
>
> Added a target/empty_all.py fixture module (declaring empty __all__ and defining three functions) plus a regression test asserting automodule output contains no members. All existing tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-autodoc.py` — pre-patch autodoc member-discovery excerpt (minimal sufficient context)

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

- Python module `__all__` is an explicit export list.
- Undefined `__all__` and an explicitly empty list are different states.
- When reviewing this change, confirm whether the patch changes only the target boundary and preserves implicit discovery for modules without `__all__`.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue (the `ai-pr.diff` you review is an AgentCode training adaptation). Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
