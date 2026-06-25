# V0 Architecture

[Back to README](../../README_en.md)

AgentCode should first be built as a **challenge asset + submission evaluation + AI PR review** platform, not as a full online IDE.

Users may work outside the platform with Cursor, Claude Code, Codex, Copilot, ChatGPT, or any other AI coding tool. AgentCode owns the challenge definition, challenge assets, submission flow, evaluation rules, and review scoring.

V0 should start as a focused monolith. The most important boundary is not service decomposition. It is this:

> Trusted platform code and untrusted user submissions must be isolated.

## Three-Layer Architecture

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

## Core Data Model

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

