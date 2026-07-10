#!/usr/bin/env bash
set -euo pipefail

export PATH="/opt/node-v22/bin:${PATH}"
export CI=true

APP_DIR="/opt/agentcode"
HEALTH_URL="http://127.0.0.1:3000/"

cd "${APP_DIR}"

for env_file in "${APP_DIR}/.env" "/etc/agentcode-deploy.env"; do
  if [[ -r "${env_file}" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "${env_file}"
    set +a
    break
  fi
done

run_pnpm() {
  corepack pnpm "$@"
}

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required before deployment." >&2
  exit 1
fi

git fetch origin
git reset --hard origin/main

deployed_commit="$(git rev-parse HEAD)"
if [[ "${AGENTCODE_DEPLOY_COMMIT:-}" != "${deployed_commit}" ]]; then
  export AGENTCODE_DEPLOY_COMMIT="${deployed_commit}"
  exec /usr/bin/bash "${APP_DIR}/scripts/deploy.sh"
fi

run_pnpm install --frozen-lockfile

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
