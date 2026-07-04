# Review 020：SymPy partitions：避免迭代结果共享可变字典

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Copy partition dictionaries before yielding iterator results**
>
> partitions() mutates a working dictionary while generating results. Users who collect the generator into a list can observe earlier yielded dictionaries changing as later partitions are produced.
>
> This PR returns ms.copy() from the dictionary-yield paths so callers receive stable snapshots instead of the internal working object.
>
> Added a regression test for partitions(..., size=True) to ensure the yielded sizes remain correct when results are collected. Existing combinatorics tests pass.

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-iterables.py` — 补丁前 partitions() yield 分支的源码节选（最小充分上下文）

然后提交 review 结论：

```text
Can merge? Yes / No / Need more info

Finding 1:
- Severity:
- Problem:
- Why it matters:
- Suggested fix:

Testing:
- 现有测试证明了什么？还缺什么？
```

## 背景

- partitions() 是 generator，内部会复用并修改同一个工作字典。
- 函数有 size=False 和 size=True 两种输出模式。
- 审查 generator 修复时，要检查所有暴露可变对象的 yield 分支。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 改编的训练补丁，不是上游最终修复）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
