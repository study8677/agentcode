# Review 004：Axios baseURL 被绝对 URL 绕过审查

团队封装了带 Authorization 的 internalApi client。AI PR 为防 SSRF 只拒绝 //evil.test，却仍允许 https://evil.test 覆盖 baseURL。

你的任务不是写代码，而是判断这个 AI PR 是否可以合并。如果不能合并，需要指出具体风险、影响和建议修复方向。

## 题目来源

本题来自真实工程问题，并改编为 AgentCode Review Mode 题目：

- GitHub Advisory：<https://github.com/advisories/GHSA-jr5f-v2jv-69x6>
- Axios Issue：<https://github.com/axios/axios/issues/6463>
- 修复 PR：<https://github.com/axios/axios/pull/6829>
- 修复 commit：<https://github.com/axios/axios/commit/fb8eec214ce7744b5ca787f2c3b8339b2f54b00f>

注意：你要审核的是 `ai-pr.diff` 中的改编 AI 补丁，不是上游最终合并的正确修复。

## 背景

- 很多服务把 baseURL 配成内部 API，再把认证 header 放在 Axios 实例默认配置里。
- Axios 支持传入绝对 URL；如果调用方参数可控，绝对 URL 可能绕过 baseURL。
- 只处理 //host 这种 protocol-relative URL，不能覆盖 http:// 和 https:// 绝对 URL。

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
- 是否识别核心风险：The patch blocks only protocol-relative URLs and still permits http:// or https:// absolute URLs.
- 是否说明原有行为边界和 AI patch 改变了什么。
- 是否指出新增测试覆盖不足。
- 是否给出可执行的修复建议，而不是只说“加测试”。
