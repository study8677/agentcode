# AgentCode Challenges

This directory stores versioned challenge assets.

Current challenge types:

- `review/`: review an AI-generated or agent-generated patch and decide whether it can be merged. V0 currently ships 20 review challenges.
- `task/`: complete a real engineering task in a starter repository. This will be added after the runner and test harness are ready.

Challenge assets should be small, source-traceable, and reproducible. When a challenge is adapted from an upstream open source issue or benchmark, its source must be listed in the challenge metadata.

## Review challenge assets

Each review challenge contains:

- `metadata.json` — challenge definition. Pre-submit content lives in `title` / `summary` / `tags` / `pr` / `background`; post-submit content lives in `analysis` / `behaviorChecks` / `learningGoal` / `source.references`.
- `ai-pr.diff` — the patch under review, presented as a confident AI-authored PR.
- `src-*.py` / `src-*.ts` / ... — pre-patch source excerpt(s): the minimal sufficient context.
- `expected-findings.json` — answer key: `canMerge`, required/optional findings with `matchTerms` for local scoring. Spoiler file, hidden from the challenge file browser.
- `rubric.md` — structured scoring rubric. Spoiler file.
- `README.zh.md` / `README.en.md` — GitHub-facing brief. Mirrors the pre-submit surface; answers are only pointed to, never inlined.

## The answer distribution is part of the design

Not every challenge is a trap. Some patches are adapted from the correct upstream fix and the right call is to approve them. The pre-submit surface of a mergeable challenge must be indistinguishable from a trap challenge — reviewers earn points by calibrated judgment, not by always answering "request changes".

## Authoring self-check (every challenge must pass all of these)

1. **No spoilers before submit.** Read the full pre-submit surface (title, summary, tags, PR description, background, README, comments inside the diff). If a competent reader can infer the flaw — or infer that there is no flaw — from that surface alone, the challenge fails. The PR speaks only in the author's confident voice.
2. **Minimal sufficient context.** Every required finding must be derivable from the challenge files alone (diff + source excerpt + neutral background). No reliance on knowledge outside the platform. If discovering the flaw requires seeing code we did not include, include it.
3. **A senior engineer must have to think.** Looking only at the PR (not at any hints), reaching the right conclusion should take genuine analysis, not pattern-matching a famous CVE from the library name.
4. **The answer cannot be copied from the prompt.** No pre-submit text may double as an acceptable answer.
5. **Tests inside the diff are part of the trap or part of the evidence.** Trap patches carry tests that look relevant but do not cover the risk; correct patches carry tests a reviewer can legitimately trust. Say which in `analysis`.
6. **Upstream traceability.** `source` must link the real issue/PR/advisory, and `reviewTarget.kind` must state whether the diff is an adapted plausible-but-incorrect patch or an adapted correct fix.

## Using AI while solving is allowed

The platform assumes reviewers may use any AI tool — the trained skill is owning the judgment: giving evidence (line numbers, counterexample inputs, impact chains) and being accountable for the merge decision. Challenges must therefore reward specific evidence rather than generic vulnerability vocabulary, and reference answers are revealed only after a submission.
