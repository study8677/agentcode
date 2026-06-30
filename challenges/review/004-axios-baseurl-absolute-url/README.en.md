# Review 004: Axios baseURL absolute URL bypass review

Review a patch that rejects protocol-relative URLs but still allows absolute URLs to override baseURL.

Your task is to review the adapted AI patch, decide whether it can be merged, and write actionable findings.

## Sources

- GitHub Advisory: <https://github.com/advisories/GHSA-jr5f-v2jv-69x6>
- Axios Issue: <https://github.com/axios/axios/issues/6463>
- 修复 PR: <https://github.com/axios/axios/pull/6829>
- 修复 commit: <https://github.com/axios/axios/commit/fb8eec214ce7744b5ca787f2c3b8339b2f54b00f>

The patch in `ai-pr.diff` is an AgentCode adapted plausible-but-incorrect patch for review training, not the upstream maintainer fix.

## Context

- 很多服务把 baseURL 配成内部 API，再把认证 header 放在 Axios 实例默认配置里。
- Axios 支持传入绝对 URL；如果调用方参数可控，绝对 URL 可能绕过 baseURL。
- 只处理 //host 这种 protocol-relative URL，不能覆盖 http:// 和 https:// 绝对 URL。

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
- Core risk: The patch blocks only protocol-relative URLs and still permits http:// or https:// absolute URLs.
- The intended behavior boundary.
- Missing negative or boundary tests.
- Actionable repair direction.
