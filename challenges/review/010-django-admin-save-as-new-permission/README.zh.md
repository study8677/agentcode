# Review 010：Django Admin save_as_new 权限审查

AI PR 修改 admin 模板上下文，认为有 change 权限即可显示 Save as new。

你的任务不是写代码，而是判断这个 AI PR 是否可以合并。如果不能合并，需要指出具体风险、影响和建议修复方向。

## 题目来源

本题来自真实工程问题，并改编为 AgentCode Review Mode 题目：

- Django Ticket：<https://code.djangoproject.com/ticket/33932>
- 上游 PR：<https://github.com/django/django/pull/16527>
- SWE-bench Lite：<https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite>

注意：你要审核的是 `ai-pr.diff` 中的改编 AI 补丁，不是上游最终合并的正确修复。

## 背景

- Django admin 的 Save as new 本质是创建一个新对象，而不是只修改当前对象。
- 拥有 change 权限的用户不一定拥有 add 权限。
- 权限 bug 常常出现在“按钮显示”和“后端动作语义”不一致的地方。

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
- 是否识别核心风险：The patch allows users with only change permission to access Save as new.
- 是否说明原有行为边界和 AI patch 改变了什么。
- 是否指出新增测试覆盖不足。
- 是否给出可执行的修复建议，而不是只说“加测试”。
