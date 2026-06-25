# V0 架构

[返回首页](../../README.md)

AgentCode 应该先做成一个 **题目资产 + 提交评估 + AI PR 审核** 平台，而不是一个完整在线 IDE。

用户可以在平台外使用 Cursor、Claude Code、Codex、Copilot、ChatGPT 或其他 AI 工具。AgentCode 负责定义题目、管理题库资产、接收提交、执行评估、返回反馈，并训练用户的工程判断力。

V0 推荐从聚焦的单体架构开始。最重要的边界不是微服务拆分，而是：

> 平台可信代码 和 用户提交的不可信代码 必须隔离。

## 三层架构

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

## 核心数据模型

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

