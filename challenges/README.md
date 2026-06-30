# AgentCode Challenges

This directory stores versioned challenge assets.

Current challenge types:

- `review/`: review an AI-generated or agent-generated patch and decide whether it can be merged. V0 currently ships 20 review challenges.
- `task/`: complete a real engineering task in a starter repository. This will be added after the runner and test harness are ready.

Challenge assets should be small, source-traceable, and reproducible. When a challenge is adapted from an upstream open source issue or benchmark, its source must be listed in the challenge README and metadata.

Each review challenge contains:

- `metadata.json`
- `README.zh.md`
- `README.en.md`
- `ai-pr.diff`
- `expected-findings.json`
- `rubric.md`
