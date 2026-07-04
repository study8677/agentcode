# Review 017: Astropy NDData: handle missing masks during propagation

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Treat operands without masks like missing-mask arithmetic inputs**
>
> NDData arithmetic currently handles the case where no second operand participates in mask propagation, but it does not consistently handle a real operand whose mask attribute is None.
>
> This PR changes the branch to check operand.mask is None, so an operand without a mask falls back to copying the current object's mask instead of attempting to combine two masks.
>
> Added a regression test for arithmetic between data_with_mask and data_without_mask to confirm the result mask is copied rather than shared. Existing NDData tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-ndarithmetic.py` — pre-patch mask propagation excerpt (minimal sufficient context)

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

- NDDataRef arithmetic propagates masks when one or both operands have masks.
- `operand is None` and `operand.mask is None` are different states.
- When reviewing None-related fixes, inspect both attribute access order and branch semantics.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue (the `ai-pr.diff` you review is an AgentCode training adaptation, not the upstream fix). Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
