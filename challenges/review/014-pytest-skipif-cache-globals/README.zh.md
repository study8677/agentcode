# Review 014：pytest skipif 字符串条件缓存审查

AI PR 为了提升 skipif("condition") 性能，把表达式字符串的求值结果缓存到全局 config。

你的任务不是写代码，而是判断这个 AI PR 是否可以合并。如果不能合并，需要指出具体风险、影响和建议修复方向。

## 题目来源

本题来自真实工程问题，并改编为 AgentCode Review Mode 题目：

- pytest Issue：<https://github.com/pytest-dev/pytest/issues/7373>
- 上游 PR：<https://github.com/pytest-dev/pytest/pull/7373>
- SWE-bench Lite：<https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite>

注意：你要审核的是 `ai-pr.diff` 中的改编 AI 补丁，不是上游最终合并的正确修复。

## 背景

- pytest 支持 skipif/xfail 使用字符串条件，条件在测试模块 globals 中求值。
- 相同字符串在不同模块中可能引用不同变量。
- 缓存只按字符串命中，会把第一个模块的结果错误复用到第二个模块。

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
- 是否识别核心风险：The cache key is only the expression string and ignores the globals used to evaluate it.
- 是否说明原有行为边界和 AI patch 改变了什么。
- 是否指出新增测试覆盖不足。
- 是否给出可执行的修复建议，而不是只说“加测试”。
