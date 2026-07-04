# Review 017：Astropy NDData：处理缺失 mask 的传播逻辑

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Treat operands without masks like missing-mask arithmetic inputs**
>
> NDData arithmetic currently handles the case where no second operand participates in mask propagation, but it does not consistently handle a real operand whose mask attribute is None.
>
> This PR changes the branch to check operand.mask is None, so an operand without a mask falls back to copying the current object's mask instead of attempting to combine two masks.
>
> Added a regression test for arithmetic between data_with_mask and data_without_mask to confirm the result mask is copied rather than shared. Existing NDData tests pass.

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-ndarithmetic.py` — 补丁前 mask 传播流程的源码节选（最小充分上下文）

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

- NDDataRef arithmetic 需要在一个或两个 operand 有 mask 时传播 mask。
- `operand is None` 和 `operand.mask is None` 是不同状态。
- 修复 None 相关 bug 时，属性访问顺序和分支语义都需要被审查。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 改编的训练补丁，不是上游最终修复）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
