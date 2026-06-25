# AgentCoder

AgentCoder is a training platform for real engineering work in the AI agent era.

It is not another LeetCode clone focused on handwritten algorithm problems. AgentCoder trains the two skills that matter when AI coding tools become part of everyday software work:

1. Using AI to complete real development tasks until they are shippable.
2. Reviewing AI-generated code and deciding whether it can be merged.

Chinese positioning:

> 练习 AI 时代真正需要的工程能力。

Direct comparison:

> LeetCode 训练你写代码。AgentCoder 训练你交付代码，并审核 AI 写的代码。

## Product Direction

AgentCoder asks a different question from traditional coding platforms.

Traditional platforms ask:

> Can you write the correct code yourself?

AgentCoder asks:

> Can you use AI to deliver a correct, tested, mergeable change?

And:

> Can you tell whether AI-generated code is actually safe to merge?

The V0 product has two entry points:

- **Task Mode**: complete a realistic engineering task with help from AI tools.
- **Review Mode**: review an AI-generated PR or diff and judge whether it can be merged.

V0 does not need algorithm Hot100, contests, complex community features, ranking systems, or a built-in cloud IDE. The first goal is to produce 20 high-quality exercises that make the product direction obvious.

The quality bar for V0 is not feature count. It is whether the first 20 challenges feel real, reproducible, scoreable, and obviously different from traditional coding exercises.

## V0 Architecture Decision

AgentCoder should be built as a **challenge asset + evaluation platform**, not as a full online IDE.

Users may use Cursor, Claude Code, Codex, Copilot, ChatGPT, or any other AI coding tool outside the platform. AgentCoder owns the challenge definition, repository assets, submission flow, evaluation rules, and review scoring.

The product should start as a focused monolith. The hard boundary is not between services, but between trusted platform code and untrusted user submissions.

The recommended V0 architecture has three core layers:

1. **Challenge Asset Layer**
   - Stores Task Mode and Review Mode exercises.
   - Each challenge is versioned and reproducible.
   - Task Mode challenges contain a seed repo, issue brief, tests, hidden checks, and reference solution.
   - Review Mode challenges contain an AI-generated PR/diff, answer key, rubric, and explanation.

2. **Product Experience Layer**
   - Shows challenge catalog, challenge detail, workspace instructions, submission flow, and result pages.
   - Task Mode accepts a patch, GitHub PR URL, or repository URL.
   - Review Mode provides a diff-reading interface and structured answer form.

3. **Evaluation Layer**
   - Runs Task Mode submissions in isolated containers.
   - Applies the user change to the seed repo.
   - Runs install, lint, tests, hidden tests, and challenge-specific validation.
   - Scores Review Mode answers against a rubric with required findings, severity, merge decision, and false-positive penalties.

This keeps the first version buildable while preserving the core product insight: AgentCoder evaluates delivery and judgment, not typing speed.

## Core Modes

### Task Mode

Task Mode gives the user a realistic development task.

Typical flow:

1. User opens a challenge.
2. Platform provides a repo, issue, constraints, and validation instructions.
3. User works locally or in their preferred AI coding tool.
4. User submits a patch, PR URL, or repo URL.
5. AgentCoder runs automated evaluation and returns a result.

Task Mode evaluates whether the user can:

- Understand the requirement.
- Drive AI tools effectively.
- Modify the codebase safely.
- Add or adjust tests.
- Catch and fix AI-generated mistakes.
- Deliver a mergeable result.

Example Task Mode topics:

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

### Review Mode

Review Mode gives the user an AI-generated PR or diff.

The user must answer:

- Can this PR be merged?
- If not, what exactly is wrong?
- Did the AI only make a superficial fix?
- Are there hidden edge cases?
- Did it break compatibility?
- Are there security, performance, or concurrency risks?
- Do the tests cover the real risk?
- Is the implementation maintainable?

Review Mode evaluates whether the user can judge AI-generated code, not whether they can rewrite it from scratch.

Example Review Mode topics:

- AI PR appears to fix a bug but misses an edge case.
- AI PR passes existing tests but breaks compatibility.
- AI PR adds a feature but misses permission checks.
- AI PR has many tests but misses the core risk.
- AI PR fixes performance but introduces data inconsistency.
- AI PR changes too much and becomes hard to merge safely.
- AI PR duplicates logic and hurts maintainability.
- AI PR fixes frontend display but leaves backend data wrong.
- AI PR introduces a concurrency bug.
- AI PR is actually good, and the correct answer is to merge it.

## Core Data Model

The initial domain model can stay small:

- **User**
  - Identity, profile, progress, submissions.

- **Challenge**
  - Shared entity for both modes.
  - Fields: title, slug, mode, difficulty, tags, status, version, estimated time.

- **ChallengeAsset**
  - Points to the seed repo, diff, tests, rubric, fixtures, and solution materials.

- **TaskSubmission**
  - User submission for Task Mode.
  - Stores submitted patch, repo URL, commit SHA, run status, score, and result summary.

- **EvaluationRun**
  - One execution attempt for a Task Mode submission.
  - Stores runner image, commands, logs, test results, timeout, and final verdict.

- **ReviewSubmission**
  - User answer for Review Mode.
  - Stores merge decision, findings, severity labels, affected files, explanation, and score.

- **ReviewRubric**
  - Required findings, acceptable alternatives, severity weights, false-positive rules, and final explanation.

- **Progress**
  - Tracks solved challenges, attempts, best score, and review accuracy.

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

`challenge.yaml` should define metadata and execution settings:

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

## Evaluation Design

### Task Mode Evaluation

Task Mode should combine deterministic checks:

- Patch applies cleanly.
- Project installs successfully.
- Lint/typecheck passes when configured.
- Existing tests pass.
- Public tests pass.
- Hidden tests pass.
- Challenge-specific assertions pass.
- Forbidden shortcuts or hardcoded outputs are rejected when needed.

The result should be transparent:

- `accepted`: change passes the required checks.
- `failed`: tests or validation failed.
- `needs_review`: automated checks pass but challenge requires manual or rubric-based inspection.

LLM-based inspection can be added as an auxiliary feedback layer for suspicious patches, hardcoded fixes, or maintainability concerns. It should support deterministic checks, not replace them.

### Review Mode Evaluation

Review Mode should use structured scoring:

- Correct merge decision.
- Required issues found.
- Correct severity.
- Correct affected area.
- Quality of explanation.
- Penalty for false positives.
- Penalty for missing the central risk.

For V0, the rubric should be the source of truth. LLM scoring can help normalize free-form answers later, but it should not be the only authority.

## Recommended Technical Architecture

V0 can use a pragmatic monorepo:

```text
apps/
  web/          # Next.js product UI
  worker/       # Evaluation runner worker
packages/
  db/           # Prisma schema and database access
  evaluator/    # Shared evaluation logic
  ui/           # Shared UI components
  challenge/    # Challenge loading and validation helpers
content/
  challenges/   # Versioned challenge assets
```

Recommended stack:

- **Web**: Next.js + TypeScript.
- **Database**: Postgres.
- **ORM**: Prisma.
- **Auth**: GitHub OAuth first, with Clerk, Auth.js, or another simple hosted auth provider.
- **Queue**: BullMQ, Inngest, Trigger.dev, or a managed job queue.
- **Runner**: Docker-based isolated workers for V0.
- **Storage**: S3-compatible object storage for patches, logs, and artifacts.
- **Diff UI**: Monaco Editor, CodeMirror, or a dedicated diff viewer.

The most important technical boundary is the runner. User submissions are untrusted code, so execution must be isolated with timeouts, network restrictions, resource limits, and clean workspaces.

V0 should also keep the challenge stack narrow. TypeScript, React, and Node.js are enough to prove the loop before expanding into many languages and frameworks.

## MVP Scope

V0 should include:

- Challenge catalog.
- Task Mode challenge page.
- Review Mode challenge page.
- Patch or PR URL submission.
- Automated Task Mode evaluation.
- Structured Review Mode scoring.
- Result page with actionable feedback.
- Admin/content workflow for adding challenges.
- 20 high-quality seed challenges.

V0 should not include:

- Traditional algorithm problem sets.
- Full online IDE.
- Browser-based terminal.
- Social feed.
- Complex discussion system.
- Contests.
- Public leaderboard.
- Company interview marketplace.
- Heavy AI tutor workflow.
- Full plagiarism detection.
- Broad multi-language support.

These can come later, after the core loop proves useful.

## First 20 Challenges

Initial content target:

- 10 Task Mode challenges.
- 10 Review Mode challenges.

The quality bar is more important than breadth. Each challenge should have a concrete engineering lesson, realistic failure mode, deterministic assets, and a clear explanation.

## Brand

Domain:

- `agentcoder.codes`

One-line English positioning:

> Practice real coding work in the AI agent era.

Chinese positioning:

> 练习 AI 时代真正需要的工程能力。

Core belief:

> As AI makes writing code cheaper, judging whether code can safely ship becomes more valuable.
