# Review 008: Django username newline anchor review

Review a username validator patch that strips input instead of rejecting trailing newlines.

Your task is to review the adapted AI patch, decide whether it can be merged, and write actionable findings.

## Sources

- Django Ticket: <https://code.djangoproject.com/ticket/30257>
- 上游 PR: <https://github.com/django/django/pull/11099>
- 修复 commit: <https://github.com/django/django/commit/9b52ab541e48c32c02587b23cceb035e9a135b89>
- SWE-bench Lite: <https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite>

The patch in `ai-pr.diff` is an AgentCode adapted plausible-but-incorrect patch for review training, not the upstream maintainer fix.

## Context

- Django UsernameValidator 的意图是只允许指定字符集合。Python regex 的 $ 可以匹配末尾换行。
- 正确方向是调整锚点语义，让非法输入失败，而不是改变用户提交的值。
- 静默 strip 可能造成唯一性、审计日志和用户可见值之间的语义混淆。

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
- Core risk: The patch strips user input instead of rejecting usernames with forbidden characters.
- The intended behavior boundary.
- Missing negative or boundary tests.
- Actionable repair direction.
