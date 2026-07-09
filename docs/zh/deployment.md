# 部署说明

AgentCode 当前使用 GitHub Actions 触发生产部署：

1. 推送代码到 `main` 分支，或在 GitHub Actions 页面手动触发 `workflow_dispatch`。
2. `verify` job 在 GitHub 托管 runner 上执行 `npm ci`、`npm run typecheck`、`npm run lint` 和 `npm run build`。
3. `deploy` job 在 `verify` 通过后，通过 SSH 登录生产服务器。
4. 服务器执行 `/opt/agentcode/scripts/deploy.sh`，从 `origin/main` 更新 `/opt/agentcode`，按需安装依赖，执行 `npx next build`，再用 systemd 重启 `agentcode` 服务。
5. 脚本用 `curl -sf http://127.0.0.1:3000/` 做本机健康检查；多次重试后仍失败会让部署 job 失败。

## GitHub Secrets

需要在仓库的 GitHub Actions secrets 中配置 4 个值：

- `DEPLOY_SSH_KEY`：GitHub Actions 用来登录生产服务器的 SSH 私钥。
- `DEPLOY_HOST`：生产服务器的 SSH 主机名或地址。
- `DEPLOY_USER`：执行部署的服务器用户，例如专用的部署用户。
- `DEPLOY_KNOWN_HOSTS`：生产服务器 SSH host key 对应的 `known_hosts` 内容，用于启用严格主机校验。

不要把真实主机名、IP、私钥或 host key 写入仓库文件；只通过 GitHub Secrets 注入。

## 服务器侧前提

- 服务器上已经存在 `/opt/agentcode` 仓库，并且远端 `origin` 指向可拉取的 GitHub 仓库。
- 部署用户可以通过 SSH 登录服务器，并有权限读取 `/opt/agentcode`。
- `/opt/node-v22/bin` 中存在 Node.js 22、npm 和 npx；部署脚本会把它加入 `PATH`。
- 服务器上的 `/opt/agentcode` 仓库配置了可拉取 `origin/main` 的 deploy key 或其他只读凭据。
- systemd 中已经存在 `agentcode` 服务，并监听 `127.0.0.1:3000`。
- sudoers 允许部署用户无交互执行 `/usr/bin/systemctl restart agentcode`。
