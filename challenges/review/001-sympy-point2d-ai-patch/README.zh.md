# Review 001：SymPy Point：修复 evaluate(False) 下的坐标校验误报

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Fix Point raising 'Imaginary coordinates are not permitted' with evaluate(False)**
>
> 在 with evaluate(False) 下解析 Point2D(Integer(1), Integer(2)) 会抛出 Imaginary coordinates are not permitted（issue #22684）：关闭自动求值后 im(1) 不会化简成 0，而是保持未求值的 im(1) 表达式，在坐标校验的真值判断里被当成了非零虚部，普通实数坐标因此根本无法构造。
>
> 这个 PR 让虚数坐标校验只在 evaluate 开启时执行——这条校验依赖 im() 的求值结果，在求值被关闭时它给不出可靠结论。
>
> 新增 test_issue_22684 复现原始报错场景，验证 evaluate(False) 下 Point(1, 2) 能正常创建。现有测试全部通过。

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-point.py` — 补丁前 Point.__new__ 的源码节选（最小充分上下文）

然后提交 review 结论：

```text
Can merge? Yes / No / Need more info

Finding 1:
- Severity:
- Problem:
- Why it matters:
- Suggested fix:

Testing:
- 新增测试证明了什么？还缺什么？
```

## 背景

- Point / Point2D 是 SymPy 几何模块的点对象。构造函数会对坐标做一系列入参校验，其中一条契约是：明确为虚数的坐标（如 Point(I, 2)）会被 ValueError 拒绝。
- evaluate(False) 会全局关闭自动求值：像 im(1) 这样的函数调用会保持未求值形式，而不是立即化简为 0。SymPy 的性质查询（如 is_zero）采用三值逻辑：True / False / None（未知）。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 改编的训练补丁，不是上游最终修复）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
