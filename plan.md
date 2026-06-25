# AgentCode V0 Plan

[README](./README.md) | [English](./README_en.md)

这个文件记录 AgentCode V0 的执行计划。产品方向、架构和评估细节放在 `docs/` 中维护。

## V0 目标

先做出一个可以证明方向的最小版本：

- 10 道 Task Mode 题。
- 10 道 Review Mode 题。
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

- [ ] 题目列表页。
- [ ] Task Mode 题目详情页。
- [ ] Review Mode 题目详情页。
- [ ] diff 阅读界面。
- [ ] patch / PR URL 提交入口。
- [ ] 结果页：展示得分、日志、失败原因和建议。

## 阶段 2：题库资产格式

- [ ] 定义 `content/challenges/` 目录规范。
- [ ] 定义 `challenge.yaml` schema。
- [ ] 定义 Task Mode 题目模板。
- [ ] 定义 Review Mode 题目模板。
- [ ] 准备 1 道 Task Mode 样题。
- [ ] 准备 1 道 Review Mode 样题。

## 阶段 3：Task Mode 评估 runner

- [ ] 接收 patch 或 PR URL。
- [ ] 拉取初始仓库。
- [ ] 应用用户改动。
- [ ] 在 Docker 隔离环境中执行安装和测试。
- [ ] 支持公开测试和隐藏测试。
- [ ] 保存日志和评估结果。
- [ ] 返回 `accepted` / `failed` / `needs_review`。

## 阶段 4：Review Mode rubric 评分

- [ ] 定义 Review Rubric schema。
- [ ] 支持 merge decision、finding、severity、affected files。
- [ ] 实现必需问题匹配。
- [ ] 实现误报和漏报扣分。
- [ ] 支持参考答案对比和讲解。
- [ ] 后续再加入 LLM 辅助归一化，不作为唯一裁判。

## 阶段 5：首批 20 题

- [ ] 10 道 Task Mode。
- [ ] 10 道 Review Mode。
- [ ] 每道题都有题面、资产、评估方式、参考答案和讲解。
- [ ] 每道题都要体现一个真实工程判断点。

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

1. 固定文档结构和产品叙事。
2. 定义题库资产格式。
3. 做出第一道 Task Mode 样题。
4. 做出第一道 Review Mode 样题。
5. 再开始搭建产品页面和 runner。

