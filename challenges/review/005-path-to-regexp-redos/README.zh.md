# Review 005：Express 路由模式 ReDoS 审查

AI PR 为 /:a-:b 生成了局部 lookahead，声称解决长路径导致的正则灾难回溯。

你的任务不是写代码，而是判断这个 AI PR 是否可以合并。如果不能合并，需要指出具体风险、影响和建议修复方向。

## 题目来源

本题来自真实工程问题，并改编为 AgentCode Review Mode 题目：

- Advisory 1：<https://github.com/pillarjs/path-to-regexp/security/advisories/GHSA-9wv6-86v2-598j>
- Advisory 2：<https://github.com/pillarjs/path-to-regexp/security/advisories/GHSA-rhx6-c78j-4q9w>
- OSV：<https://osv.dev/GHSA-9wv6-86v2-598j>
- 修复 commit：<https://github.com/pillarjs/path-to-regexp/commit/f01c26a013b1889f0c217c643964513acf17f6a4>

注意：你要审核的是 `ai-pr.diff` 中的改编 AI 补丁，不是上游最终合并的正确修复。

## 背景

- Express 等框架会把路由模式编译成正则表达式。重叠 capture 可能在恶意长路径上触发灾难回溯。
- Node 单线程事件循环被 ReDoS 输入阻塞，会影响整个服务的可用性。
- 只给一个具体模式打补丁，容易漏掉 /:a-:b-:c 或自定义 capture 等同类问题。

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
- 是否识别核心风险：The patch special-cases one adjacent-parameter pattern but does not remove the broader overlapping-capture risk.
- 是否说明原有行为边界和 AI patch 改变了什么。
- 是否指出新增测试覆盖不足。
- 是否给出可执行的修复建议，而不是只说“加测试”。
