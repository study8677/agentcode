# AgentCode

[中文](./README.md)

AgentCode is a training platform for real engineering work in the AI Coding and Agent era.

It is not a traditional LeetCode-style platform, and it does not mainly train people to handwrite algorithm solutions. AgentCode is built to train the skills that matter when AI coding tools and coding agents become part of everyday engineering work:

1. Completing real development tasks with AI / Agent assistance.
2. Reviewing AI / Agent generated code and deciding whether it is safe to merge.

One-line positioning:

> Practice real coding work in the AI agent era.

More directly:

> LeetCode trains you to write code. AgentCode trains you to ship code and review code written by AI.

## Why This Exists

The AI era is already here, but many companies still evaluate engineers with traditional LeetCode-style interviews.

People spend huge amounts of time grinding Hot100 problems and repeatedly practicing handwritten algorithm questions. In real engineering work, especially as AI Coding and Coding Agents become more capable, this kind of training is increasingly disconnected from actual software delivery.

In the past, maybe we had fewer options. Writing code itself was expensive, so engineering ability was often reduced to a simple question: can you write the code yourself? As a result, solving algorithm problems became a required cost for many people entering the industry.

But the AI era should not keep working this way.

The scarce skills in the AI era are not only about handwriting code. They are about whether you can:

- Turn a requirement into clear, executable engineering work.
- Drive AI / Agents to complete a task until it is shippable.
- Understand whether AI-generated code is actually correct.
- Find hidden bugs, edge cases, compatibility issues, and security risks.
- Decide whether a pull request is truly safe to merge.
- Add tests that cover real risk instead of only increasing test count.
- Take responsibility for AI-generated code like a senior engineer.

That is why I am building AgentCode.

I want it to become a new kind of practice ground: not another place where people mechanically grind algorithm problems, but a place where people practice the skills that matter in the Agent era. I hope everyone who uses it can become an AgentCoder for the Agent era.

## Product Direction

Traditional coding platforms mainly ask:

> Can you write the correct code yourself?

AgentCode asks:

> Can you use AI to deliver a correct, tested, mergeable change?

And:

> Can you tell whether AI-generated code is actually safe to ship?

The V0 product has two entry points:

- **Task Mode**: complete a realistic engineering task with help from AI tools.
- **Review Mode**: review an AI / Agent generated PR or diff and decide whether it can be merged.

V0 does not need algorithm Hot100, contests, complex community features, ranking systems, or a complete online IDE. The first goal is to produce 20 high-quality exercises that make the product direction obvious.

The quality bar for V0 is not feature count. It is whether the first 20 challenges feel real, reproducible, scoreable, and clearly different from traditional coding exercises.

## V0 Architecture Decision

AgentCode should first be built as a **challenge asset + submission evaluation + AI PR review** platform, not as a full online IDE.

Users may work outside the platform with Cursor, Claude Code, Codex, Copilot, ChatGPT, or any other AI coding tool. AgentCode owns the challenge definition, challenge assets, submission flow, evaluation rules, and review scoring.

V0 should start as a focused monolith. The most important boundary is not service decomposition. It is this:

> Trusted platform code and untrusted user submissions must be isolated.

The recommended V0 architecture has three layers:

1. **Challenge Asset Layer**
   - Stores Task Mode and Review Mode exercises.
   - Each challenge is versioned and reproducible.
   - Task Mode challenges contain a seed repo, task brief, public tests, hidden tests, and reference solution.
   - Review Mode challenges contain an AI-generated PR / diff, answer key, rubric, and explanation.

2. **Product Experience Layer**
   - Shows challenge catalog, challenge detail, task instructions, submission flow, and result pages.
   - Task Mode accepts a patch, GitHub PR URL, or repository URL.
   - Review Mode provides a diff-reading interface and structured review submission form.

3. **Evaluation Layer**
   - Runs Task Mode submissions inside isolated containers.
   - Applies the user change to the seed repo.
   - Runs install, lint, tests, hidden tests, and challenge-specific validation.
   - Scores Review Mode answers against a rubric with required findings, severity, merge decision, and false-positive penalties.

This keeps V0 buildable while preserving the core product insight: AgentCode evaluates delivery and judgment, not typing speed.

## Core Modes

### Task Mode

Task Mode gives the user a realistic engineering task.

Typical flow:

1. The user opens a challenge.
2. The platform provides a repo, issue, constraints, and acceptance criteria.
3. The user works locally or in their preferred AI coding tool.
4. The user submits a patch, PR URL, or repo URL.
5. AgentCode runs automated evaluation and returns a result.

Task Mode trains whether the user can:

- Understand the requirement.
- Drive AI / Agents to complete development work.
- Modify the codebase safely.
- Add or adjust tests.
- Catch and fix mistakes in AI-generated code.
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

Review Mode gives the user an AI / Agent generated PR or diff.

The user must judge:

- Can this PR be merged?
- If not, what exactly is wrong?
- Did the AI only make a superficial fix?
- Are there hidden bugs?
- Were edge cases missed?
- Did it break compatibility?
- Are there security, performance, or concurrency risks?
- Do the tests look extensive while missing the real risk?
- Is the code over-engineered, duplicated, or hard to maintain?

Review Mode trains the ability to judge AI-generated code, not the ability to rewrite it from scratch.

Example Review Mode topics:

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

## Core Data Model

The initial domain model can stay small:

- **User**
  - Identity, profile, progress, and submissions.

- **Challenge**
  - Shared entity for both Task Mode and Review Mode.
  - Fields include title, slug, mode, difficulty, tags, status, version, and estimated time.

- **ChallengeAsset**
  - Points to the seed repo, diff, tests, rubric, fixtures, and reference materials.

- **TaskSubmission**
  - User submission for Task Mode.
  - Stores patch, repo URL, commit SHA, run status, score, and result summary.

- **EvaluationRun**
  - One execution attempt for a Task Mode submission.
  - Stores runner image, commands, logs, test results, timeout, and final verdict.

- **ReviewSubmission**
  - User answer for Review Mode.
  - Stores merge decision, findings, severity labels, affected files, explanation, and score.

- **ReviewRubric**
  - Stores required findings, acceptable alternatives, severity weights, false-positive rules, and reference explanation.

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

## Evaluation Design

### Task Mode Evaluation

Task Mode is mainly based on deterministic checks:

- Patch applies cleanly.
- Project installs successfully.
- Lint / typecheck passes when configured.
- Existing tests pass.
- Public tests pass.
- Hidden tests pass.
- Challenge-specific behavior checks pass.
- Hardcoded outputs or test-bypassing shortcuts are rejected when needed.

The result should be transparent:

- `accepted`: required checks pass.
- `failed`: tests or validation failed.
- `needs_review`: automated checks pass, but the challenge needs manual or rubric-based inspection.

LLM-based inspection can be added as an auxiliary feedback layer for suspicious patches, hardcoded fixes, or maintainability concerns. It should support deterministic checks, not replace them.

### Review Mode Evaluation

Review Mode uses structured rubric scoring:

- Correct merge decision.
- Required issues found.
- Correct severity.
- Correct affected area.
- Quality of explanation.
- Penalty for false positives.
- Penalty for missing the central risk.

For V0, the rubric is the source of truth. LLM scoring can help normalize free-form answers later, but it should not be the only authority.

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
- **Storage**: S3 / R2 compatible object storage for patches, logs, and artifacts.
- **Diff UI**: Monaco Editor, CodeMirror, or a dedicated diff viewer.

The most important engineering boundary is the runner. User submissions are untrusted code, so execution must be isolated with timeouts, network restrictions, resource limits, and clean workspaces.

V0 should keep the challenge stack narrow. TypeScript, React, and Node.js are enough to prove the core loop before expanding into more languages and frameworks.

## MVP Scope

V0 should include:

- Challenge catalog.
- Task Mode challenge page.
- Review Mode challenge page.
- Patch or PR URL submission.
- Automated Task Mode evaluation.
- Structured Review Mode scoring.
- Result page with actionable feedback.
- Admin / content workflow for adding challenges.
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

Repository:

- `agentcode`

Domain:

- `agentcoder.codes`

English positioning:

> Practice real coding work in the AI agent era.

Chinese positioning:

> 练习 Agent 时代真正需要的工程能力。

Core belief:

> As AI makes writing code cheaper, judging whether code can safely ship becomes more valuable.

