# Review 012: Requests redirect method chain review

Review a redirect patch that keeps copying the original request and restores POST after a 303 then 307 chain.

Your task is to review the adapted AI patch, decide whether it can be merged, and write actionable findings.

## Sources

- Requests Issue: <https://github.com/psf/requests/issues/1963>
- 上游 PR: <https://github.com/psf/requests/pull/1963>
- SWE-bench Lite: <https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite>

The patch in `ai-pr.diff` is an AgentCode adapted plausible-but-incorrect patch for review training, not the upstream maintainer fix.

## Context

- 303 See Other 会把 POST 转成 GET。
- 307/308 应保持当前请求方法。
- 多跳重定向中，下一跳的当前方法可能已经不是最初方法。

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
- Core risk: The patch keeps using the original request as the base for every redirect hop.
- The intended behavior boundary.
- Missing negative or boundary tests.
- Actionable repair direction.
