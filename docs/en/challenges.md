# First Challenge Set

[Back to README](../../README_en.md)

V0 starts with 20 high-quality challenges:

- 10 Task Mode challenges.
- 10 Review Mode challenges.

The quality bar is more important than breadth. Each challenge should have a concrete engineering lesson, realistic failure mode, deterministic assets, and a clear explanation.

## Task Mode Topics

- Fix a real bug.
- Implement a small feature.
- Optimize a slow query.
- Fix cache inconsistency.
- Add missing tests.
- Refactor complex logic.
- Prevent duplicate async job execution.
- Implement rate limiting.
- Add parameter validation.
- Fix pagination boundary behavior.

## Review Mode Topics

- AI PR appears to fix a bug but misses an edge case.
- AI PR passes existing tests but breaks compatibility.
- AI PR adds a feature but misses permission checks.
- AI PR has many tests but misses the core risk.
- AI PR fixes performance but introduces data inconsistency.
- AI PR changes too much and becomes risky to merge.
- AI PR duplicates logic and hurts maintainability.
- AI PR fixes frontend display but leaves backend data wrong.
- AI PR introduces a concurrency bug.
- AI PR is actually good, and the correct answer is to merge it.

## Challenge Asset Structure

Challenges should live in the repository as versioned content, not only in the database.

Current structure:

```text
challenges/
  README.md
  review/
    001-sympy-point2d-ai-patch/
      metadata.json
      README.zh.md
      README.en.md
      ai-pr.diff
      expected-findings.json
      rubric.md
```

Task Mode challenges will later add `starter/`, `tests/visible/`, `tests/hidden/`, `validator.sh`, and `solution.patch`.

`metadata.json` defines metadata and source attribution:

```json
{
  "id": "review-001-sympy-point2d-ai-patch",
  "mode": "review",
  "difficulty": "mid",
  "source": {
    "project": "SymPy",
    "upstreamIssue": "https://github.com/sympy/sympy/issues/22684",
    "upstreamOraclePullRequest": "https://github.com/sympy/sympy/pull/22714",
    "analysisPaper": "https://arxiv.org/abs/2503.15223"
  }
}
```

This makes exercises reviewable, portable, and reproducible.

## Created Challenges

- [Review 001: Can this AI fix be merged? Reviewing a SymPy Point2D regression](../../challenges/review/001-sympy-point2d-ai-patch/README.en.md)
