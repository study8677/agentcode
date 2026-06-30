# Review 003: Server Actions relative redirect SSRF review

Review a patch that checks only relative redirect paths while still trusting attacker-controlled Host headers.

Your task is to review the adapted AI patch, decide whether it can be merged, and write actionable findings.

## Sources

- Next.js Advisory: <https://github.com/vercel/next.js/security/advisories/GHSA-fr5h-rqp8-mj6g>
- 修复 PR: <https://github.com/vercel/next.js/pull/62561>
- 修复 commit: <https://github.com/vercel/next.js/commit/8f7a6ca7d21a97bc9f7a1bbe10427b5ad74b9085>
- Assetnote Analysis: <https://www.assetnote.io/resources/research/digging-for-ssrf-in-nextjs-apps/>

The patch in `ai-pr.diff` is an AgentCode adapted plausible-but-incorrect patch for review training, not the upstream maintainer fix.

## Context

- Server Actions 在服务端执行，某些重定向和转发逻辑会触发服务器主动请求目标 URL。
- redirectUrl 是相对路径并不代表最终 origin 可信，因为 req.headers.host 可能来自客户端或反向代理传递。
- SSRF 风险通常出现在“路径看起来安全，但 host/origin 由攻击者控制”的组合里。

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
- Core risk: The patch checks the path but trusts the Host header when building the server-side fetch URL.
- The intended behavior boundary.
- Missing negative or boundary tests.
- Actionable repair direction.
