# Review 002：别信任内部请求头：Next.js Middleware 绕过审查

一个 AI PR 为了避免 middleware 子请求递归，看到 x-middleware-subrequest 就直接跳过鉴权 middleware。

你的任务不是写代码，而是判断这个 AI PR 是否可以合并。如果不能合并，需要指出具体风险、影响和建议修复方向。

## 题目来源

本题来自真实工程问题，并改编为 AgentCode Review Mode 题目：

- Next.js Advisory：<https://github.com/vercel/next.js/security/advisories/GHSA-f82v-jwr5-mffw>
- CVE-2025-29927：<https://nvd.nist.gov/vuln/detail/CVE-2025-29927>
- Vercel Postmortem：<https://vercel.com/blog/postmortem-on-next-js-middleware-bypass>
- 修复 commit：<https://github.com/vercel/next.js/commit/52a078da3884efe6501613c7834a3d02a91676d2>

注意：你要审核的是 `ai-pr.diff` 中的改编 AI 补丁，不是上游最终合并的正确修复。

## 背景

- Middleware 常用于保护登录态、租户权限和重定向逻辑，任何跳过 middleware 的条件都属于安全边界。
- x-middleware-subrequest 这类头在框架内部有意义，但普通外部请求也可以手写同名 header。
- 安全修复不能只让递归 case 通过，还必须保证公网请求无法用内部字段改变控制流。

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
- 是否识别核心风险：The patch trusts x-middleware-subrequest from the client.
- 是否说明原有行为边界和 AI patch 改变了什么。
- 是否指出新增测试覆盖不足。
- 是否给出可执行的修复建议，而不是只说“加测试”。
