# Review 016: Astropy: fix separability matrices for nested CompoundModels

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Handle nested right-hand models when building separability matrices**
>
> separability_matrix can produce confusing results when a compound model contains another compound model on the right-hand side. The current block assembly assumes the right operand can always be copied directly, but nested models need every output row to be connected to their inputs in the combined coordinate matrix.
>
> This PR marks the nested right-hand block as dependent on its input columns by filling the target block with 1s. This keeps the combined matrix shape correct and avoids losing the nested model in the parent composition.
>
> Added a nested model regression test using Pix2Sky_TAN with two Linear1D components to verify the combined separability matrix has the expected dimensions. Existing modeling tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-separable.py` — pre-patch block assembly excerpt (minimal sufficient context)

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

- separability_matrix uses a boolean matrix to represent which outputs depend on which inputs.
- During CompoundModel assembly, a child model may already have a meaningful separability matrix.
- When reviewing matrix fixes, check both shape and the dependency semantics represented by the matrix values.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue (the `ai-pr.diff` you review is an AgentCode training adaptation, not the upstream fix). Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
