# Review 012：Requests 多跳重定向方法保持审查

AI PR 为了避免 mutation，把每个 redirect hop 都从原始 request copy，却没有更新当前 hop 的 method。

你的任务不是写代码，而是判断这个 AI PR 是否可以合并。如果不能合并，需要指出具体风险、影响和建议修复方向。

## 题目来源

本题来自真实工程问题，并改编为 AgentCode Review Mode 题目：

- Requests Issue：<https://github.com/psf/requests/issues/1963>
- 上游 PR：<https://github.com/psf/requests/pull/1963>
- SWE-bench Lite：<https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite>

注意：你要审核的是 `ai-pr.diff` 中的改编 AI 补丁，不是上游最终合并的正确修复。

## 背景

- 303 See Other 会把 POST 转成 GET。
- 307/308 应保持当前请求方法。
- 多跳重定向中，下一跳的当前方法可能已经不是最初方法。

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
- 是否识别核心风险：The patch keeps using the original request as the base for every redirect hop.
- 是否说明原有行为边界和 AI patch 改变了什么。
- 是否指出新增测试覆盖不足。
- 是否给出可执行的修复建议，而不是只说“加测试”。
