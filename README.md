# AgentCode

<p align="center">
  <strong>AI Agent 时代的工程能力训练场。</strong>
</p>

<p align="center">
  <a href="./README_en.md">English</a>
  ·
  <a href="https://agentcode.codes">试做 20 道 Review 题</a>
  ·
  <a href="./docs/zh/product-direction.md">产品方向</a>
  ·
  <a href="./plan.md">V0 Roadmap</a>
</p>

<p align="center">
  <img alt="Status" src="https://img.shields.io/badge/status-V0%20Prototype-111827?style=flat-square">
  <img alt="Modes" src="https://img.shields.io/badge/modes-Task%20%2B%20Review-2563eb?style=flat-square">
  <img alt="Stack" src="https://img.shields.io/badge/stack-Next.js%20%2B%20TypeScript-000000?style=flat-square">
  <img alt="Challenge first" src="https://img.shields.io/badge/focus-real%20engineering%20judgment-16a34a?style=flat-square">
</p>

AgentCode 不是另一个 LeetCode。

它面向的是 AI Coding / Agent 时代更稀缺的工程能力：把真实需求拆成可交付的代码变更，驱动 AI 工具完成实现，补上关键测试，并判断一个 AI 生成的 PR 到底能不能合并。

> LeetCode 训练你写代码。AgentCode 训练你交付代码，并审核 AI 写的代码。

## 为什么值得做

AI 已经改变了工程师写代码的方式，但很多训练和面试仍然停留在手写算法题。真实工作里更常见的问题是：

- AI 给出的修复看起来能跑，但有没有漏掉边界条件？
- PR 加了很多测试，但测试是否真的覆盖了核心风险？
- 需求能不能被拆成小而安全的变更？
- 什么时候应该继续让 Agent 改，什么时候应该自己接管？
- 一个改动通过了 lint 和单测，是否仍然存在安全、兼容性、并发或可维护性问题？

AgentCode 想提供一个新的练习场：不刷打字速度，不堆算法套路，而是练习 Agent 时代真正需要的工程判断力。

## 核心模式

| 模式 | 你要做什么 | 训练重点 |
| --- | --- | --- |
| **Task Mode** | 使用 Cursor、Claude Code、Codex、Copilot 或其他 AI 工具完成一个真实工程任务 | 需求拆解、AI 协作、测试补强、可合并交付 |
| **Review Mode** | 审核 AI / Agent 生成的 PR 或 diff，判断是否可以合并 | 风险识别、边界条件、测试质量、合并决策 |

AgentCode 不要求你在平台内写代码。你可以继续使用自己熟悉的本地 IDE 和 AI Coding 工具；平台负责定义题目、管理资产、接收提交、执行评估并给出反馈。

## 和传统平台不同

| 传统刷题 / 代码评测 | AgentCode |
| --- | --- |
| 主要训练手写算法和标准答案 | 训练真实工程交付和 AI 协作判断 |
| 输入通常是单文件函数 | 输入是 repo、issue、diff、测试和约束 |
| 结果多是通过 / 不通过 | 结果关注能否合并、风险在哪里、测试是否可信 |
| 重点是写出代码 | 重点是交付可维护改动，并审核 AI 写出的代码 |
| 评测常围绕公开用例 | Task Mode 结合确定性检查，Review Mode 使用结构化 rubric |

## 当前可以体验

V0 正在构建中，目前仓库已经包含：

- 一个 Next.js + TypeScript 产品原型。
- Review Mode 首页、题目详情页和结构化 review 提交表单。
- 20 道真实来源改编的 Review Mode 题，覆盖安全、框架、HTTP、数据语义和测试质量。
- 可版本化的题库资产结构：题面、metadata、AI diff、expected findings、rubric。
- 评估设计、V0 架构、产品方向和首批题库规划文档。

题库入口：

- [在线体验：AgentCode 题库](https://agentcode.codes)
- [Review 001：这个 AI 修复能合并吗？SymPy Point2D 回归审查](./challenges/review/001-sympy-point2d-ai-patch/README.zh.md)
- [首批 20 题清单](./docs/zh/challenges.md)

## 快速开始

```bash
pnpm install
pnpm dev
```

然后打开本地 Next.js 开发地址，进入题库首页和第一道 Review Mode 题。

常用开发命令：

```bash
pnpm lint
pnpm typecheck
pnpm build
```

如果需要连接本地数据库，可以先复制环境变量模板：

```bash
cp .env.example .env
pnpm db:generate
pnpm db:push
```

当前 V0 前端仍以题库原型和本地 review 反馈为主；Task Mode runner 尚未执行用户代码，后续会引入隔离容器、隐藏测试和结构化评估结果。

## 题库资产

AgentCode 的题目不是只存在数据库里，而是作为可 review、可迁移、可复现的版本化资产放在仓库中。

```text
challenges/
  review/
    001-sympy-point2d-ai-patch/
      metadata.json
      README.zh.md
      README.en.md
      ai-pr.diff
      expected-findings.json
      rubric.md
    002-next-middleware-header-bypass/
    ...
    020-sympy-partitions-dict-reuse/
```

这种结构让每道题都能明确回答几个问题：

- 来源是否真实、可追溯？
- AI 补丁或任务资产是否可复现？
- 标准答案和评分规则是否可审查？
- 用户到底是在练实现能力、测试能力，还是 review 判断力？

## V0 路线

AgentCode V0 先聚焦 20 道高质量题，而不是堆功能数量。当前已上线的是 20 道 Review Mode 题；Task Mode 在 runner 接入后再作为可练习题上线。

- 20 道 Review Mode：审核 AI PR 是否漏掉权限、边界条件、兼容性、测试质量、性能或可维护性风险。
- Task Mode 下一阶段：修 bug、做小 feature、补测试、修并发、修缓存、做兼容性改动。
- 评估优先使用确定性检查和结构化 rubric，LLM 只作为辅助反馈层。
- 平台边界保持克制：先做好题目质量、评估可信度和训练闭环。

更多细节见 [V0 执行计划](./plan.md)。

## 技术栈

- **Web**：Next.js、React、TypeScript
- **UI 原型**：题库列表、训练模式筛选、Review 题详情、结构化提交表单
- **Data model**：Prisma schema
- **Challenge assets**：Markdown、JSON、diff、rubric
- **Runner 方向**：Docker 隔离执行、公开测试、隐藏测试、日志和 verdict

V0 最重要的工程边界是隔离：平台可信代码和用户提交的不可信代码必须分开执行。

## 文档导航

| 文档 | 内容 |
| --- | --- |
| [项目初心](./docs/zh/vision.md) | 为什么 AgentCode 应该存在 |
| [产品方向](./docs/zh/product-direction.md) | Task Mode / Review Mode 的产品边界 |
| [V0 架构](./docs/zh/architecture.md) | 题目资产层、产品体验层、评估层 |
| [评估设计](./docs/zh/evaluation.md) | Task Mode 与 Review Mode 如何评分 |
| [首批题库规划](./docs/zh/challenges.md) | 前 20 道题的方向和资产结构 |
| [V0 执行计划](./plan.md) | 当前阶段和后续任务 |

## 适合贡献什么

AgentCode 现在最需要的不是大而全的功能，而是高质量训练资产和可信评估闭环。

- 真实工程任务题：小范围、可复现、可测试。
- AI PR 审核题：有明确错误模式、边界条件和评分 rubric。
- Runner 能力：隔离执行、日志采集、隐藏测试、结果结构化。
- 产品体验：让用户更快理解题目、提交 review、获得可执行反馈。
- 文档和题解：帮助用户理解自己缺的是实现、测试，还是 review 判断力。

## 品牌

- 仓库：`agentcode`
- 域名：`agentcode.codes`
- 目标用户：想在 AI Agent 时代继续变强的工程师
