# Review 011：Django readonly JSONField 展示格式审查

AI PR 为了让 readonly JSONField 不报错，把字典值直接 str(value) 后展示。

你的任务不是写代码，而是判断这个 AI PR 是否可以合并。如果不能合并，需要指出具体风险、影响和建议修复方向。

## 题目来源

本题来自真实工程问题，并改编为 AgentCode Review Mode 题目：

- Django Ticket：<https://code.djangoproject.com/ticket/31052>
- 上游 PR：<https://github.com/django/django/pull/12308>
- SWE-bench Lite：<https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite>

注意：你要审核的是 `ai-pr.diff` 中的改编 AI 补丁，不是上游最终合并的正确修复。

## 背景

- readonly admin 字段应该展示合法 JSON，而不是 Python dict 的 repr。
- JSONField 自身有 prepare/get_prep_value 语义，能处理编码和特殊输入。
- 直接 str(dict) 得到的是单引号形式，不是 JSON。

## 你需要审核

请阅读：

- `ai-pr.diff`

然后提交 review 结论：

```text
Can merge? Yes / No

Finding 1:
- Severity:
- Problem:
- Why it matters:
- Suggested fix:

Testing:
- Missing regression or boundary tests:
```

## 评分重点

- 是否能正确判断这个 AI PR 是否可以合并。
- 是否识别核心风险：The patch renders JSONField values with Python str/repr instead of JSON preparation.
- 是否说明原有行为边界和 AI patch 改变了什么。
- 是否指出新增测试覆盖不足。
- 是否给出可执行的修复建议，而不是只说“加测试”。
