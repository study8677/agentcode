# Review 019: scikit-learn SVM: handle sparse fit with empty support vectors

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Avoid sparse SVM dual_coef_ construction error when there are no support vectors**
>
> Fitting an SVR on sparse input can hit an edge case where every sample lands outside the epsilon tube and there are no support vectors (n_SV == 0). In that case _sparse_fit builds dual_coef_indptr = np.arange(0, size+1, size / n_class) with a step of 0, np.arange raises, and fit cannot return.
>
> This PR adds an n_SV == 0 guard before constructing dual_coef_: with no support vectors it assigns an empty csr_matrix directly, otherwise it takes the original CSR indptr path. The normal sparse SVM fit logic is unchanged.
>
> Added a regression test that builds a sparse SVR producing zero support vectors and verifies fit completes with empty support_vectors_ and dual_coef_. Existing SVM tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-svm-base.py` — pre-patch excerpt of _sparse_fit (minimal sufficient context)

Then submit your review:

```text
Can merge? Yes / No / Need more info

Finding 1:
- Severity:
- Problem: (if you approve, list the points you verified)
- Why it matters:
- Suggested fix:

Testing:
- What does the new test prove? Is it trustworthy?
```

## Background

- _sparse_fit is the sparse SVM fit entry point; after training it assembles dual coefficients into the sparse matrix dual_coef_. In the empty-support-vector case, the contract to verify is that dual_coef_ contains no coefficients, not a particular two-dimensional shape.
- dual_coef_indptr is built with np.arange(0, size+1, step) where step = dual_coef_indices.size / n_class; with no support vectors size is 0, so step is 0.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue. Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
