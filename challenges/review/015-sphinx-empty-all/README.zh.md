# Review 015：Sphinx autodoc：让显式声明的空 __all__ 生效

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Fix autodoc ignoring an empty __all__ attribute**
>
> 用户报告：模块写了 `__all__ = []`，automodule 生成文档时仍然把 foo/bar/baz 全部列出来。__all__ 是模块的显式导出声明，空列表的含义是“没有公开成员”，autodoc 应该尊重它，而不是当作没写。
>
> 原因是 get_object_members 用 `not self.__all__` 判断是否走隐式成员发现，把空列表和未定义混为一谈。这个 PR 把判断改成 `self.__all__ is None`：只有模块真的没有定义 __all__ 时才做隐式发现；空列表则走显式导出过滤，所有成员都会被跳过。
>
> 新增了 fixture 模块 target/empty_all.py（声明空 __all__ 并定义三个函数）和对应测试，断言 automodule 的输出里不包含任何成员。现有测试全部通过。

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-autodoc.py` — 补丁前 autodoc 成员发现流程的源码节选（最小充分上下文）

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

- Python 模块的 `__all__` 是显式导出列表。
- 未定义 `__all__` 和定义为空列表是两种不同状态。
- 审查这类改动时，要确认补丁是否只改变目标边界，并保留未定义 `__all__` 的隐式发现行为。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 改编的训练补丁）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
