# Review 016：Astropy：修复嵌套 CompoundModel 的 separability 矩阵

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Handle nested right-hand models when building separability matrices**
>
> separability_matrix can produce confusing results when a compound model contains another compound model on the right-hand side. The current block assembly assumes the right operand can always be copied directly, but nested models need every output row to be connected to their inputs in the combined coordinate matrix.
>
> This PR marks the nested right-hand block as dependent on its input columns by filling the target block with 1s. This keeps the combined matrix shape correct and avoids losing the nested model in the parent composition.
>
> Added a nested model regression test using Pix2Sky_TAN with two Linear1D components to verify the combined separability matrix has the expected dimensions. Existing modeling tests pass.

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-separable.py` — 补丁前 block assembly 的源码节选（最小充分上下文）

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

- separability_matrix 用布尔矩阵表示模型输出依赖哪些输入。
- CompoundModel 拼接时，子模型可能已经有一块有语义的 separability 矩阵。
- 审查矩阵修复时，要同时看 shape 和矩阵值代表的依赖关系。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 改编的训练补丁，不是上游最终修复）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
