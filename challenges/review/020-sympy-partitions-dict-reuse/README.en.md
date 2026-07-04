# Review 020: SymPy partitions: avoid shared mutable dictionaries in iterator results

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Copy partition dictionaries before yielding iterator results**
>
> partitions() mutates a working dictionary while generating results. Users who collect the generator into a list can observe earlier yielded dictionaries changing as later partitions are produced.
>
> This PR returns ms.copy() from the dictionary-yield paths so callers receive stable snapshots instead of the internal working object.
>
> Added a regression test for partitions(..., size=True) to ensure the yielded sizes remain correct when results are collected. Existing combinatorics tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-iterables.py` — pre-patch partitions() yield-branch excerpt (minimal sufficient context)

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

- partitions() is a generator that reuses and mutates an internal working dictionary.
- The function has two output modes: size=False and size=True.
- When reviewing generator fixes, check every yield branch that exposes mutable objects.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue (the `ai-pr.diff` you review is an AgentCode training adaptation, not the upstream fix). Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
