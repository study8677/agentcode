# Task Runner Alpha worker

This process is intentionally separate from the Next.js web process. The web user must not have access to a Docker socket. Run `pnpm task:worker` (the supplied systemd unit invokes the same checked-in TypeScript entrypoint through `tsx`) as the dedicated `agentcode-runner` user against that user's rootless Docker socket.

Required environment:

- `TASK_RUNNER_ENABLED=true`
- `DATABASE_URL=postgresql://...`
- `DOCKER_HOST=unix:///run/user/<agentcode-runner-uid>/docker.sock`

Before enabling the unit:

1. Confirm cgroup v2 exposes `/sys/fs/cgroup/cgroup.controllers`.
2. Confirm `docker info` reports `rootless` for the service user.
3. Preload the exact manifest image digest. The worker uses `--pull never`.
4. Run the malicious patch and container-limit tests from `tests/runner`.
5. Keep `TASK_RUNNER_ENABLED` false on both web and worker until the 14-day product and reliability gate is met.

The worker claims one PostgreSQL queue row at a time with `FOR UPDATE SKIP LOCKED`. It never accepts a command from the submission: commands come only from the repository-owned challenge manifest.
