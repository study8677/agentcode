# Review 009: Django password reset token email binding review

Review a password reset patch that checks email presence but does not bind tokens to email changes.

Your task is to review the adapted AI patch, decide whether it can be merged, and write actionable findings.

## Sources

- Django Ticket: <https://code.djangoproject.com/ticket/32130>
- 上游 PR: <https://github.com/django/django/pull/13551>
- SWE-bench Lite: <https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite>

The patch in `ai-pr.diff` is an AgentCode adapted plausible-but-incorrect patch for review training, not the upstream maintainer fix.

## Context

- 密码重置 token 应在用户密码、last_login、时间戳等关键状态变化后失效。
- 真实问题是用户申请重置后更改邮箱，旧邮件里的 token 仍可使用。
- 只检查邮箱是否存在，并不会让邮箱值参与 token 哈希。

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
- Core risk: The patch never includes the email value in the token hash.
- The intended behavior boundary.
- Missing negative or boundary tests.
- Actionable repair direction.
