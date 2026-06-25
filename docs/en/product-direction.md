# Product Direction

[Back to README](../../README_en.md)

AgentCode is a training platform for real engineering work in the AI Coding and Agent era.

It is not a traditional LeetCode-style platform, and it does not mainly train people to handwrite algorithm solutions. AgentCode trains two skills that matter more in the AI era:

1. Completing real development tasks with AI / Agent assistance.
2. Reviewing AI / Agent generated code and deciding whether it is safe to merge.

One-line positioning:

> Practice real coding work in the AI agent era.

More directly:

> LeetCode trains you to write code. AgentCode trains you to ship code and review code written by AI.

## V0 Entry Points

The V0 product has two entry points:

- **Task Mode**: complete a realistic engineering task with help from AI tools.
- **Review Mode**: review an AI / Agent generated PR or diff and decide whether it can be merged.

V0 does not need algorithm Hot100, contests, complex community features, ranking systems, or a complete online IDE. The first goal is to produce 20 high-quality exercises that make the product direction obvious.

The quality bar for V0 is not feature count. It is whether the first 20 challenges feel real, reproducible, scoreable, and clearly different from traditional coding exercises.

## Task Mode

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

## Review Mode

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

