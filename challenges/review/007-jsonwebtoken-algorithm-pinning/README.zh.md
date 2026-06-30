# Review 007：JWT verify 未固定算法审查

AI PR 为了同时支持本地开发和生产，把 jwt.verify 的 key 改成 process.env.JWT_SECRET || undefined，并删除 algorithms 限制。

你的任务不是写代码，而是判断这个 AI PR 是否可以合并。如果不能合并，需要指出具体风险、影响和建议修复方向。

## 题目来源

本题来自真实工程问题，并改编为 AgentCode Review Mode 题目：

- jsonwebtoken Advisory：<https://github.com/auth0/node-jsonwebtoken/security/advisories/GHSA-qwph-4952-7xr6>
- CVE-2022-23540：<https://nvd.nist.gov/vuln/detail/cve-2022-23540>
- Auth0 Bulletin：<https://auth0.com/docs/secure/security-guidance/security-bulletins/2022-12-21-jsonwebtoken>
- 修复 commit：<https://github.com/auth0/node-jsonwebtoken/commit/e1fa9dcc12054a8681db4e6373da1b30cf7016e3>

注意：你要审核的是 `ai-pr.diff` 中的改编 AI 补丁，不是上游最终合并的正确修复。

## 背景

- JWT verify 必须明确预期算法和密钥类型，否则不同库版本或配置下可能出现 alg:none、HS/RS 混淆等风险。
- 认证配置缺失时应该启动失败，而不是在请求路径里降级为 undefined。
- 安全库升级和调用侧 defense in depth 都重要。

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
- 是否识别核心风险：The patch removes algorithm pinning and lets an undefined secret reach jwt.verify.
- 是否说明原有行为边界和 AI patch 改变了什么。
- 是否指出新增测试覆盖不足。
- 是否给出可执行的修复建议，而不是只说“加测试”。
