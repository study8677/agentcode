# Review 018: xarray: handle DataArray tuple inputs during Dataset update

You are a reviewer on this repository. An AI agent submitted the PR below. CI is green and the decision is yours.

## PR description (from the author)

> **Normalize DataArray tuple payloads before constructing Variables**
>
> Dataset.update can receive variables in tuple form, but passing a DataArray as the tuple payload is ambiguous because Variable expects raw data rather than another labeled array object.
>
> This PR normalizes tuple payloads by converting DataArray values with np.asarray before calling Variable(*obj). That gives Variable a plain ndarray and keeps the update path consistent with NumPy-backed inputs.
>
> Added a regression test that updates a Dataset with a chunked DataArray tuple and checks the resulting values are equal. Existing xarray tests pass.

## What to review

Read:

- `ai-pr.diff` — the patch under review
- `src-variable.py` — pre-patch tuple-to-Variable conversion excerpt (minimal sufficient context)

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

- xarray DataArray can wrap NumPy arrays or lazy dask arrays.
- dask chunk metadata and lazy execution are user-visible behavior.
- When reviewing data-structure conversions, check whether the patch preserves execution semantics, not just value equality.

## Answers and analysis

Reference answers live in `expected-findings.json` and `rubric.md` (spoilers). On the website they are revealed after you submit a review.

## Source

Adapted from a real engineering issue (the `ai-pr.diff` you review is an AgentCode training adaptation, not the upstream fix). Upstream links are in the `source` field of `metadata.json`; read them after attempting the challenge.
