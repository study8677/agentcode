# Review 011: Django readonly JSONField display review

Review a readonly JSONField display patch that keeps using Python string formatting instead of field preparation.

Your task is to review the adapted AI patch, decide whether it can be merged, and write actionable findings.

## Sources

- Django Ticket: <https://code.djangoproject.com/ticket/31052>
- 上游 PR: <https://github.com/django/django/pull/12308>
- SWE-bench Lite: <https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite>

The patch in `ai-pr.diff` is an AgentCode adapted plausible-but-incorrect patch for review training, not the upstream maintainer fix.

## Context

- readonly admin 字段应该展示合法 JSON，而不是 Python dict 的 repr。
- JSONField 自身有 prepare/get_prep_value 语义，能处理编码和特殊输入。
- 直接 str(dict) 得到的是单引号形式，不是 JSON。

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
- Core risk: The patch renders JSONField values with Python str/repr instead of JSON preparation.
- The intended behavior boundary.
- Missing negative or boundary tests.
- Actionable repair direction.
