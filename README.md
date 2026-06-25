# AgentCode

[English](./README_en.md)

AgentCode 是一个面向 AI Coding / Agent 时代的工程能力训练平台。

它不是传统 LeetCode，也不再主要训练“手写算法题”。AgentCode 想训练的是 AI 时代真正重要的能力：

1. 借助 AI / Agent 完成真实开发任务。
2. 审核 AI / Agent 生成的代码，判断它是否可以合并。

一句话定位：

> 练习 Agent 时代真正需要的工程能力。

更直接地说：

> LeetCode 训练你写代码。AgentCode 训练你交付代码，并审核 AI 写的代码。

## 项目初心

AI 时代已经来了，但很多企业仍然在用传统 LeetCode 的方式考察工程师。

我们花了大量时间去刷 Hot100，反复训练手写算法题。可是在真实工作里，尤其是在 AI Coding 和 Coding Agent 越来越强的今天，这种训练和工程交付之间的距离越来越远。

在过去，也许我们没有太多选择。写代码本身很贵，工程师的能力常常被简化成“你能不能自己把代码写出来”。所以刷题、背题、手写算法，成了很多人进入行业前必须消耗的时间。

但 AI 时代不应该继续这样。

AI 时代真正稀缺的能力，不只是手写代码，而是：

- 能不能把需求拆成清晰、可执行的工程任务。
- 能不能驱动 AI / Agent 把任务做到可交付。
- 能不能看懂 AI 写出来的代码到底对不对。
- 能不能发现隐藏 bug、边界条件、兼容性问题和安全风险。
- 能不能判断一个 PR 是否真的可以进入主分支。
- 能不能补上真正有价值的测试，而不是只让测试数量变多。
- 能不能像高级工程师一样，对 AI 生成的代码负责。

这就是我做 AgentCode 的原因。

我希望它成为一个新的练习场：不是继续训练大家机械地刷算法题，而是帮助大家练习 Agent 时代真正需要的技能。希望每个使用它的人，都能成为 Agent 时代的 AgentCoder。

## 产品方向

传统刷题平台主要问：

> 你能不能自己写出正确代码？

AgentCode 要问的是：

> 你能不能用 AI 把任务做到可交付？

以及：

> 你能不能识别 AI 写出来的代码到底能不能上线？

V0 版本先做两个入口：

- **Task Mode**：用 AI 完成真实工程任务。
- **Review Mode**：审核 AI / Agent 生成的 PR。

V0 不做传统算法 Hot100，不做复杂社区、竞赛、排行榜，也不先做完整在线 IDE。第一阶段先把 20 道高质量题做好，让产品方向足够清晰。

V0 的质量标准不是功能数量，而是前 20 道题是否足够真实、可复现、可评分，并且明显区别于传统刷题。

## V0 架构决策

AgentCode 应该先做成一个 **题目资产 + 提交评估 + AI PR 审核** 平台，而不是一个完整在线 IDE。

用户可以在平台外使用 Cursor、Claude Code、Codex、Copilot、ChatGPT 或其他 AI 工具。AgentCode 负责定义题目、管理题库资产、接收提交、执行评估、返回反馈，并训练用户的工程判断力。

V0 推荐从聚焦的单体架构开始。最重要的边界不是微服务拆分，而是：

> 平台可信代码 和 用户提交的不可信代码 必须隔离。

推荐的 V0 架构分三层：

1. **题目资产层**
   - 存储 Task Mode 和 Review Mode 题目。
   - 每道题都可版本化、可复现。
   - Task Mode 题目包含初始仓库、任务说明、公开测试、隐藏测试和参考解法。
   - Review Mode 题目包含 AI 生成的 PR / diff、答案要点、评分 rubric 和讲解。

2. **产品体验层**
   - 提供题目列表、题目详情、任务说明、提交入口和结果页。
   - Task Mode 支持 patch、GitHub PR URL 或 repo URL 提交。
   - Review Mode 提供 diff 阅读界面和结构化 review 提交表单。

3. **评估层**
   - 在隔离容器里运行 Task Mode 提交。
   - 将用户改动应用到初始仓库。
   - 运行安装、lint、测试、隐藏测试和题目专属校验。
   - 用 rubric 对 Review Mode 答案进行结构化评分。

这个架构能让 V0 足够可落地，同时保留产品最核心的判断：AgentCode 评估的是交付能力和审核判断力，而不是打字速度。

## 核心题型

### Task Mode：任务完成题

Task Mode 给用户一个真实工程任务。

典型流程：

1. 用户打开一道题。
2. 平台提供 repo、issue、约束条件和验收标准。
3. 用户在本地或自己熟悉的 AI Coding 工具里完成任务。
4. 用户提交 patch、PR URL 或 repo URL。
5. AgentCode 自动评估并返回结果。

Task Mode 训练的是：

- 理解需求。
- 驱动 AI / Agent 完成开发。
- 安全地修改代码。
- 补充或调整测试。
- 识别并修复 AI 生成代码里的问题。
- 最终交付一个可合并的结果。

示例题目方向：

- 修复一个真实 bug。
- 实现一个小 feature。
- 优化慢查询。
- 修复缓存不一致。
- 补充缺失测试。
- 重构一段复杂代码。
- 修复异步任务重复执行。
- 实现 rate limit。
- 增加参数校验。
- 修复分页边界问题。

### Review Mode：AI PR 审核题

Review Mode 给用户一个由 AI / Agent 生成的 PR 或 diff。

用户需要判断：

- 这个 PR 能不能 merge？
- 如果不能，问题在哪里？
- AI 有没有只做表面修复？
- 有没有隐藏 bug？
- 有没有边界条件遗漏？
- 有没有破坏兼容性？
- 有没有安全、性能、并发问题？
- 测试是不是看起来很多，但没有覆盖真正风险？
- 代码是不是过度工程、逻辑重复、不可维护？

Review Mode 训练的是判断 AI 生成代码的能力，而不是让用户从零重写一遍。

示例题目方向：

- AI PR 看似修复了 bug，但漏掉边界条件。
- AI PR 通过了现有测试，但破坏了兼容性。
- AI PR 增加了功能，但缺少权限校验。
- AI PR 测试很多，但没有测到核心风险。
- AI PR 修复性能问题，但引入数据不一致。
- AI PR 改动过大，风险不可控。
- AI PR 逻辑重复、不可维护。
- AI PR 修复了前端展示，但后端数据仍然错误。
- AI PR 引入并发问题。
- AI PR 是一个合格改动，用户需要判断可以合并。

## 核心数据模型

V0 的领域模型可以保持简单：

- **User**
  - 用户身份、资料、进度和提交记录。

- **Challenge**
  - Task Mode 和 Review Mode 共用的题目实体。
  - 字段包括 title、slug、mode、difficulty、tags、status、version、estimated time。

- **ChallengeAsset**
  - 指向初始仓库、diff、测试、rubric、fixtures、参考答案等题目资产。

- **TaskSubmission**
  - Task Mode 的用户提交。
  - 记录 patch、repo URL、commit SHA、运行状态、分数和结果摘要。

- **EvaluationRun**
  - Task Mode 的一次评估执行。
  - 记录 runner image、命令、日志、测试结果、超时和最终 verdict。

- **ReviewSubmission**
  - Review Mode 的用户答案。
  - 记录 merge decision、findings、severity、affected files、解释和得分。

- **ReviewRubric**
  - 记录必需发现项、可接受表达、严重程度权重、误报规则和参考解释。

- **Progress**
  - 记录完成题目、尝试次数、最佳分数和 review 准确率。

## 题库资产结构

题目应该作为版本化内容放在仓库里，而不是只存在数据库中。

推荐结构：

```text
content/
  challenges/
    task/
      fix-pagination-boundary/
        challenge.yaml
        prompt.md
        repo/
        tests/
          public/
          hidden/
        solution.patch
        explanation.md
    review/
      ai-pr-missing-permission-check/
        challenge.yaml
        prompt.md
        base.diff
        ai-pr.diff
        rubric.yaml
        explanation.md
```

`challenge.yaml` 定义题目元信息和执行配置：

```yaml
id: fix-pagination-boundary
mode: task
title: Fix pagination boundary behavior
difficulty: medium
tags:
  - backend
  - testing
  - edge-case
runtime:
  image: node:22
  install: npm install
  test: npm test
limits:
  timeoutSeconds: 120
```

这种结构让题目可 review、可迁移、可复现。

## 评估设计

### Task Mode 评估

Task Mode 以确定性检查为主：

- patch 能否干净应用。
- 项目能否成功安装。
- lint / typecheck 是否通过。
- 原有测试是否通过。
- 公开测试是否通过。
- 隐藏测试是否通过。
- 题目专属行为校验是否通过。
- 是否存在硬编码、绕测试等明显作弊方式。

结果应尽量透明：

- `accepted`：通过必需检查。
- `failed`：测试或校验失败。
- `needs_review`：自动检查通过，但题目需要人工或 rubric 进一步判断。

LLM 可以作为辅助反馈层，用来检查可疑 patch、硬编码修复或可维护性问题。但 LLM 不应该替代确定性测试和 rubric。

### Review Mode 评估

Review Mode 使用结构化 rubric 评分：

- merge decision 是否正确。
- 是否找到必需问题。
- 严重程度判断是否合理。
- 影响范围是否准确。
- 解释质量是否足够。
- 是否有误报。
- 是否漏掉核心风险。

V0 中，rubric 是评分的事实来源。LLM 可以辅助归一化自由文本答案，但不能成为唯一裁判。

## 推荐技术架构

V0 可以采用实用的 monorepo：

```text
apps/
  web/          # Next.js 产品 UI
  worker/       # 评估 runner worker
packages/
  db/           # Prisma schema 和数据库访问
  evaluator/    # 共享评估逻辑
  ui/           # 共享 UI 组件
  challenge/    # 题目加载与校验工具
content/
  challenges/   # 版本化题库资产
```

推荐技术栈：

- **Web**：Next.js + TypeScript。
- **Database**：Postgres。
- **ORM**：Prisma。
- **Auth**：优先 GitHub OAuth，可使用 Clerk、Auth.js 或其他简单托管方案。
- **Queue**：BullMQ、Inngest、Trigger.dev 或托管队列。
- **Runner**：V0 使用 Docker 隔离 worker。
- **Storage**：S3 / R2 等对象存储，用于 patch、日志和评估产物。
- **Diff UI**：Monaco Editor、CodeMirror 或专门的 diff viewer。

最重要的工程边界是 runner。用户提交的是不可信代码，执行时必须有隔离、超时、网络限制、资源限制和干净 workspace。

V0 的题目技术栈也应保持收敛。先用 TypeScript、React、Node.js 证明核心循环，再扩展更多语言和框架。

## MVP 范围

V0 应包含：

- 题目列表。
- Task Mode 题目页。
- Review Mode 题目页。
- patch 或 PR URL 提交。
- Task Mode 自动评估。
- Review Mode 结构化评分。
- 带可执行反馈的结果页。
- 添加题目的 admin / content 工作流。
- 20 道高质量种子题。

V0 不做：

- 传统算法题库。
- 完整在线 IDE。
- 浏览器终端。
- 社交信息流。
- 复杂讨论系统。
- 竞赛。
- 公开排行榜。
- 公司面试题 marketplace。
- 重型 AI tutor 流程。
- 完整查重系统。
- 宽泛多语言支持。

这些可以在核心循环被证明有效之后再做。

## 首批 20 道题

初始内容目标：

- 10 道 Task Mode。
- 10 道 Review Mode。

题目质量比数量更重要。每道题都应该有明确工程教训、真实失败模式、确定性资产和清晰讲解。

## 品牌

仓库：

- `agentcode`

域名：

- `agentcoder.codes`

英文定位：

> Practice real coding work in the AI agent era.

中文定位：

> 练习 Agent 时代真正需要的工程能力。

核心判断：

> 当 AI 让写代码越来越便宜，判断代码能不能安全上线会越来越重要。
