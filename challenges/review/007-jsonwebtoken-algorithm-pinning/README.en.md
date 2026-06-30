# Review 007: JWT verification without algorithm pinning review

Review an auth patch that makes the key optional and removes algorithm pinning.

Your task is to review the adapted AI patch, decide whether it can be merged, and write actionable findings.

## Sources

- jsonwebtoken Advisory: <https://github.com/auth0/node-jsonwebtoken/security/advisories/GHSA-qwph-4952-7xr6>
- CVE-2022-23540: <https://nvd.nist.gov/vuln/detail/cve-2022-23540>
- Auth0 Bulletin: <https://auth0.com/docs/secure/security-guidance/security-bulletins/2022-12-21-jsonwebtoken>
- 修复 commit: <https://github.com/auth0/node-jsonwebtoken/commit/e1fa9dcc12054a8681db4e6373da1b30cf7016e3>

The patch in `ai-pr.diff` is an AgentCode adapted plausible-but-incorrect patch for review training, not the upstream maintainer fix.

## Context

- JWT verify 必须明确预期算法和密钥类型，否则不同库版本或配置下可能出现 alg:none、HS/RS 混淆等风险。
- 认证配置缺失时应该启动失败，而不是在请求路径里降级为 undefined。
- 安全库升级和调用侧 defense in depth 都重要。

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
- Core risk: The patch removes algorithm pinning and lets an undefined secret reach jwt.verify.
- The intended behavior boundary.
- Missing negative or boundary tests.
- Actionable repair direction.
