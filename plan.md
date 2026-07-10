# AgentCode V0 Plan

[README](./README.md) | [English](./README_en.md)

这个文件记录 AgentCode V0 的执行计划。产品方向、架构和评估细节放在 `docs/` 中维护。

## V0 目标

先做出一个可以证明方向的最小版本。当前 V0 先把 Review Mode 做成可用闭环：

- 20 道 Review Mode 题。
- Task Mode 在 runner 和测试体系接入后上线。
- 用户可以查看题目、提交结果、获得可信评估。
- 平台能证明：AI 时代的工程训练不应该只靠传统算法刷题。

## 阶段 0：文档和边界

- [x] 明确项目初心。
- [x] 明确 Task Mode / Review Mode 两个核心入口。
- [x] 拆分中文和英文 README。
- [x] 将产品方向、架构、评估、题库规划拆到 `docs/`。
- [ ] 确定 V0 的正式命名：AgentCode / AgentCoder / agentcoder.codes。
- [ ] 确定首批题目技术栈：优先 TypeScript、React、Node.js。

## 阶段 1：产品原型

- [x] 题目列表页。
- [ ] Task Mode 题目详情页。
- [x] Review Mode 题目详情页。
- [x] diff 阅读界面。
- [ ] patch / PR URL 提交入口。
- [x] Review 结果区：展示 V2 预评分、逐项反馈、参考解析与人工终审状态。

## 阶段 2：题库资产格式

- [x] 定义 `challenges/review/` 目录规范。
- [x] 定义 `metadata.json` / `expected-findings.json` / `rubric.md` 资产格式。
- [x] 定义 Task Mode Alpha 题目模板。
- [x] 定义 Review Mode 题目模板。
- [x] 准备 1 道 TypeScript/Node Task Mode Alpha 样题。
- [x] 准备 20 道 Review Mode 题。

## 阶段 3：Task Mode 评估 runner

- [x] 接收受限 unified diff patch；PR URL 延后。
- [x] 创建干净的 starter workspace。
- [x] 校验并应用用户 patch。
- [x] 使用默认关闭的 rootless Docker worker 执行测试。
- [x] 支持公开测试和只读挂载的隐藏测试。
- [x] 保存截断脱敏日志和结构化评估结果。
- [x] 返回 `accepted` / `rejected` / `error` verdict。

## 阶段 4：Review Mode rubric 评分

- [x] 定义 Review Rubric V2 schema。
- [x] 支持 merge decision、finding、severity、blocksMerge 和物理文件/行号证据。
- [x] 实现必需问题的一对一匹配。
- [x] 实现结构化误报、矛盾结论扣分和漏报封顶。
- [x] 支持参考答案对比、版本快照和讲解。
- [ ] 后续再加入 LLM 辅助归一化，不作为唯一裁判。

## 阶段 5：首批 20 题

- [ ] Task Mode 首批题（runner 接入后再定正式数量）。
- [x] 20 道 Review Mode。
- [x] Review Mode 每道题都有题面、资产、评估方式、参考答案和讲解。
- [x] Review Mode 每道题都体现一个真实工程判断点。

## V0 不做

- 不做传统算法 Hot100。
- 不做完整在线 IDE。
- 不做浏览器终端。
- 不做复杂社区。
- 不做竞赛和排行榜。
- 不做公司面试题 marketplace。
- 不做宽泛多语言支持。
- 不做以 LLM 为唯一裁判的评估。

## 当前优先级

1. 用真实提交校准 Evaluator V2 与 24 小时人工终审流程。
2. 达到至少 100 次提交、50 次人工终审和 14 天稳定性门禁。
3. 验证能力画像、下一题推荐和第二题继续率。
4. 完成生产 PostgreSQL、OAuth、retention timer 配置。
5. 只有门禁通过后才对私测名单开启 Task Runner Alpha。
