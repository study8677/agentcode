# Review 003：Server Actions 相对重定向 SSRF 审查

AI PR 认为 redirectUrl 只要 startsWith("/") 就是安全相对路径，然后用请求 Host 拼接出服务端 fetch URL。

你的任务不是写代码，而是判断这个 AI PR 是否可以合并。如果不能合并，需要指出具体风险、影响和建议修复方向。

## 题目来源

本题来自真实工程问题，并改编为 AgentCode Review Mode 题目：

- Next.js Advisory：<https://github.com/vercel/next.js/security/advisories/GHSA-fr5h-rqp8-mj6g>
- 修复 PR：<https://github.com/vercel/next.js/pull/62561>
- 修复 commit：<https://github.com/vercel/next.js/commit/8f7a6ca7d21a97bc9f7a1bbe10427b5ad74b9085>
- Assetnote Analysis：<https://www.assetnote.io/resources/research/digging-for-ssrf-in-nextjs-apps/>

注意：你要审核的是 `ai-pr.diff` 中的改编 AI 补丁，不是上游最终合并的正确修复。

## 背景

- Server Actions 在服务端执行，某些重定向和转发逻辑会触发服务器主动请求目标 URL。
- redirectUrl 是相对路径并不代表最终 origin 可信，因为 req.headers.host 可能来自客户端或反向代理传递。
- SSRF 风险通常出现在“路径看起来安全，但 host/origin 由攻击者控制”的组合里。

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
- 是否识别核心风险：The patch checks the path but trusts the Host header when building the server-side fetch URL.
- 是否说明原有行为边界和 AI patch 改变了什么。
- 是否指出新增测试覆盖不足。
- 是否给出可执行的修复建议，而不是只说“加测试”。
