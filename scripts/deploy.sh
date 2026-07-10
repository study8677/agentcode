#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/node-v22/bin:${PATH}"

APP_DIR="/opt/agentcode"
HEALTH_URL="http://127.0.0.1:3000/"

cd "${APP_DIR}"

if [[ -f "${APP_DIR}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "${APP_DIR}/.env"
  set +a
fi

run_pnpm() {
  corepack pnpm "$@"
}

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required before deployment." >&2
  exit 1
fi

git fetch origin
git reset --hard origin/main

should_install=1
if git rev-parse --verify "HEAD@{1}" >/dev/null 2>&1; then
  if git diff --quiet "HEAD@{1}" HEAD -- package.json pnpm-lock.yaml; then
    should_install=0
  fi
fi

if [[ "${should_install}" -eq 1 ]]; then
  run_pnpm install --frozen-lockfile
fi

run_pnpm exec prisma generate
run_pnpm exec prisma migrate deploy
run_pnpm build

sudo /usr/bin/systemctl restart agentcode

for attempt in {1..10}; do
  if curl -sf "${HEALTH_URL}" >/dev/null; then
    exit 0
  fi

  sleep 3
done

echo "Health check failed: ${HEALTH_URL}" >&2
exit 1
