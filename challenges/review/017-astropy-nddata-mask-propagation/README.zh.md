# Review 017：Astropy NDData：整理 mask 传播里的 None 判断

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Clarify the missing-mask branch in _arithmetic_mask**
>
> _arithmetic_mask 里有一个分支写成 elif operand.mask is None，读起来含糊：这个分支的本意是处理『没有第二个 operand 参与』的情况，用 operand.mask 判断既不直观，还多访问了一层属性。
>
> 这个 PR 把该分支改成更直白的 elif operand is None，语义上直接对应『没有第二个 operand，保留 self 自己的 mask』。逻辑分支数量不变，只是让判断意图更清晰。
>
> 新增一个回归测试，覆盖没有第二个 operand 时 self.mask 被正确保留。现有 NDData 测试全部通过。

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-ndarithmetic.py` — 补丁前 _arithmetic_mask 的源码节选（最小充分上下文）

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

- NDDataRef 的算术运算会传播 mask：两个 operand 都有 mask 时用 handle_mask 合并；只有一边有 mask 时复制那一个；都没有则结果无 mask。
- `_arithmetic_mask` 通过多处 `None` 判断区分 mask 传播状态。先读清补丁前每个分支代表哪种状态，再判断改掉被检查的对象是否仍保持同一语义。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
