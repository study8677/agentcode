# 评估设计

[返回首页](../../README.md)

AgentCode 的评估目标不是判断用户是否“手写出了某段代码”，而是判断用户是否完成了可交付的工程结果，以及是否能正确审核 AI 生成的代码。

## Task Mode 评估

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

## Review Mode 评估

Review Mode 使用结构化 rubric 评分：

- merge decision 是否正确。
- 是否找到必需问题。
- 严重程度判断是否合理。
- 影响范围是否准确。
- 解释质量是否足够。
- 是否有误报。
- 是否漏掉核心风险。

V0 中，rubric 是评分的事实来源。LLM 可以辅助归一化自由文本答案，但不能成为唯一裁判。

## Review Rubric 示例

```yaml
expectedFindings:
  - id: missing-permission-check
    severity: critical
    category: security
    required: true
    evidence:
      - "The new endpoint updates shared resources without checking ownership."
    acceptableAnswers:
      - "missing authorization"
      - "no permission check"
      - "user can modify another user's resource"
mergeDecision: request_changes
falsePositivePenalty: medium
```

## 评估原则

- 确定性检查优先。
- 用户反馈必须可读、可执行。
- Review Mode 不要求和参考答案逐字一致，但必须命中核心风险。
- 自动化评估不能鼓励用户只为测试写代码。
- 评估结果要能帮助用户理解自己缺的是实现能力、测试能力，还是代码判断力。

