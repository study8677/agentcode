# Review 019: scikit-learn SVM: handle sparse fit with empty support vectors

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Avoid sparse SVM dual_coef_ construction errors when there are no support vectors**
>
> Sparse SVM fitting can hit an edge case where there are no support vectors. The current code still tries to construct dual_coef_ from CSR indptr/index arrays, which can fail or divide through empty support-vector state.
>
> This PR adds a fast path for n_SV == 0 and assigns an empty csr_matrix directly. Normal sparse SVM fits continue to use the existing CSR construction path.
>
> Added a regression test that fits the sparse model in the empty-support-vector case and confirms dual_coef_ is empty. Existing SVM tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-svm-base.py` — pre-patch sparse dual_coef_ construction excerpt (minimal sufficient context)

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

- scikit-learn estimator attribute shapes are part of the public API contract.
- Empty matrices still need the correct shape; zero stored elements is not enough.
- When reviewing numerical-library edge-case fixes, check whether the patch preserves downstream attribute and prediction invariants.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue (the `ai-pr.diff` you review is an AgentCode training adaptation, not the upstream fix). Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
