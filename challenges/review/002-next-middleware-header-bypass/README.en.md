# Review 002: Do not trust internal middleware headers

Review a middleware patch that may let external requests spoof an internal header and bypass authorization.

Your task is to review the adapted AI patch, decide whether it can be merged, and write actionable findings.

## Sources

- Next.js Advisory: <https://github.com/vercel/next.js/security/advisories/GHSA-f82v-jwr5-mffw>
- CVE-2025-29927: <https://nvd.nist.gov/vuln/detail/CVE-2025-29927>
- Vercel Postmortem: <https://vercel.com/blog/postmortem-on-next-js-middleware-bypass>
- 修复 commit: <https://github.com/vercel/next.js/commit/52a078da3884efe6501613c7834a3d02a91676d2>

The patch in `ai-pr.diff` is an AgentCode adapted plausible-but-incorrect patch for review training, not the upstream maintainer fix.

## Context

- Middleware 常用于保护登录态、租户权限和重定向逻辑，任何跳过 middleware 的条件都属于安全边界。
- x-middleware-subrequest 这类头在框架内部有意义，但普通外部请求也可以手写同名 header。
- 安全修复不能只让递归 case 通过，还必须保证公网请求无法用内部字段改变控制流。

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
- Core risk: The patch trusts x-middleware-subrequest from the client.
- The intended behavior boundary.
- Missing negative or boundary tests.
- Actionable repair direction.
