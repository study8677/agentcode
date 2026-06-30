# Review 010: Django admin save_as_new permission review

Review an admin patch that exposes Save as new to users without add permission.

Your task is to review the adapted AI patch, decide whether it can be merged, and write actionable findings.

## Sources

- Django Ticket: <https://code.djangoproject.com/ticket/33932>
- 上游 PR: <https://github.com/django/django/pull/16527>
- SWE-bench Lite: <https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite>

The patch in `ai-pr.diff` is an AgentCode adapted plausible-but-incorrect patch for review training, not the upstream maintainer fix.

## Context

- Django admin 的 Save as new 本质是创建一个新对象，而不是只修改当前对象。
- 拥有 change 权限的用户不一定拥有 add 权限。
- 权限 bug 常常出现在“按钮显示”和“后端动作语义”不一致的地方。

## Review Format

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

## Rubric Focus

- Correct merge decision.
- Core risk: The patch allows users with only change permission to access Save as new.
- The intended behavior boundary.
- Missing negative or boundary tests.
- Actionable repair direction.
