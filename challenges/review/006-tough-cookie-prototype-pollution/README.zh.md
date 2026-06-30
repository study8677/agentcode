# Review 006：CookieJar 原型污染黑名单修复审查

AI PR 看到 PoC 里的 Domain=__proto__，于是加了一个字符串黑名单并认为污染问题已解决。

你的任务不是写代码，而是判断这个 AI PR 是否可以合并。如果不能合并，需要指出具体风险、影响和建议修复方向。

## 题目来源

本题来自真实工程问题，并改编为 AgentCode Review Mode 题目：

- GitHub Advisory：<https://github.com/advisories/GHSA-72xf-g2v4-qvf3>
- Issue #282：<https://github.com/salesforce/tough-cookie/issues/282>
- 修复 commit：<https://github.com/salesforce/tough-cookie/commit/12d4747>
- Snyk PoC：<https://security.snyk.io/vuln/SNYK-JS-TOUGHCOOKIE-5672873>

注意：你要审核的是 `ai-pr.diff` 中的改编 AI 补丁，不是上游最终合并的正确修复。

## 背景

- CookieJar 会按 domain、path、key 建立多层索引，旧实现如果使用普通对象就可能碰到原型链属性。
- Prototype pollution 的修复重点通常是让字典没有原型，或者使用 Map，而不是只屏蔽一个字符串。
- 黑名单容易漏掉 constructor、prototype 或嵌套层级里的危险 key。

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
- 是否识别核心风险：The patch blocks only one dangerous domain string while keeping ordinary objects for untrusted indexes.
- 是否说明原有行为边界和 AI patch 改变了什么。
- 是否指出新增测试覆盖不足。
- 是否给出可执行的修复建议，而不是只说“加测试”。
