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

Recommended structure:

```text
content/
  challenges/
    task/
      fix-pagination-boundary/
        challenge.yaml
        prompt.md
        repo/
        tests/
          public/
          hidden/
        solution.patch
        explanation.md
    review/
      ai-pr-missing-permission-check/
        challenge.yaml
        prompt.md
        base.diff
        ai-pr.diff
        rubric.yaml
        explanation.md
```

`challenge.yaml` defines metadata and execution settings:

```yaml
id: fix-pagination-boundary
mode: task
title: Fix pagination boundary behavior
difficulty: medium
tags:
  - backend
  - testing
  - edge-case
runtime:
  image: node:22
  install: npm install
  test: npm test
limits:
  timeoutSeconds: 120
```

This makes exercises reviewable, portable, and reproducible.

