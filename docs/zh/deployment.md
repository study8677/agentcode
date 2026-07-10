# 部署说明

AgentCode 使用 GitHub Actions 校验后通过 SSH 调用 `/opt/agentcode/scripts/deploy.sh`。生产部署不会自动开启 Review 持久化、人工后台或 Task Runner；这些能力均由环境变量显式控制。

## CI 与部署顺序

GitHub Actions 依次执行：

1. `pnpm install --frozen-lockfile`
2. Prisma schema validate / client generate
3. `challenge:validate`
4. 100 个 evaluator fixtures
5. Vitest、typecheck、lint、Next.js build
6. 全部通过后才允许 SSH 到生产机

服务器部署顺序是：由 root 从 `/etc/agentcode.env` 读取生产配置、只把 `DATABASE_URL` 传给 `agentcode` 部署用户、拉取 `origin/main`、按需安装依赖、`prisma generate`、`prisma migrate deploy`、build、重启 Web 服务、健康检查。迁移失败时不会重启；数据库 migration 不执行自动 down。部署脚本通过 Corepack 使用 `packageManager` 锁定的 pnpm 版本。

## 生产环境变量

```dotenv
DATABASE_URL=postgresql://...
AUTH_SECRET=至少32位随机值
AUTH_GITHUB_ID=...
AUTH_GITHUB_SECRET=...
AUTH_TRUST_HOST=true
REVIEW_ADMIN_ENABLED=true
REVIEWER_GITHUB_IDS=12345678,87654321
REVIEW_PERSISTENCE_ENABLED=true
REVIEW_EVALUATOR_MODE=v2
TASK_RUNNER_ENABLED=false
```

GitHub OAuth callback 为 `/api/admin/auth/callback/github`。普通训练用户保持匿名，GitHub OAuth 只用于 reviewer 后台。

`/etc/agentcode.env` 应保持 `root:root`、`0600`，由 systemd 注入 Web 服务；不要为了部署把完整 OAuth 或数据库凭据改成普通用户可读。首次开启持久化前必须完成数据库备份与恢复演练。现有部署如果曾使用 `prisma db push`，baseline migration 使用 guarded SQL 接管已有 Challenge schema；仍应先在数据库副本执行 migration。

## 数据保留

- 匿名 session cookie：365 天，HttpOnly、SameSite=Lax、生产环境 Secure；数据库只保存 token SHA-256。
- 原始 Review draft：90 天后清除。
- 365 天无活动的匿名 session：连同结构化提交级联删除。
- 安装 `task-worker/agentcode-review-purge.service` 与 `.timer`，每日执行 `pnpm review:purge`。
- 应用不保存 IP、UA、referrer 或匿名用户邮箱。

## Reviewer 后台

- 队列入口：`/admin/reviews`
- 只允许 `REVIEWER_GITHUB_IDS` 白名单账号。
- 每次提交立即返回自动预评估；人工终审必须在 24 小时内发布。
- 终审按 rubric item 记录 hit/partial/miss，任何覆盖必须填写审计理由。

## Task Runner Alpha

Runner 默认关闭。即使代码已经部署，也必须满足 README/plan 中的产品门禁，并完成以下主机预检后才能设置 `TASK_RUNNER_ENABLED=true`：

- 独立 `agentcode-runner` 系统用户和 rootless Docker socket。
- Web 用户不能访问 Docker socket。
- cgroup v2、预加载固定 digest 镜像、默认断网。
- 1 CPU、512 MiB、128 PIDs、120 秒、1 MiB 日志上限。
- 安装 `task-worker/agentcode-runner.service`，配置 `DATABASE_URL`、`DOCKER_HOST` 和 feature flag。
- 运行 `tests/runner` 的路径穿越、symlink、submodule、超时、日志脱敏和安全参数测试。

本地或生产主机未报告 rootless Docker 时，Runner 必须保持关闭，不能退化为 privileged 容器或由 Web 进程执行用户代码。

## GitHub Secrets

- `DEPLOY_SSH_KEY`
- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_KNOWN_HOSTS`

不要将真实主机名、IP、私钥、OAuth secret、数据库口令或 Docker socket 路径提交到仓库。
