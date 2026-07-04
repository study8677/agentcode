# Review 018：xarray：更新 Dataset 时处理 DataArray tuple 输入

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Normalize DataArray tuple payloads before constructing Variables**
>
> Dataset.update can receive variables in tuple form, but passing a DataArray as the tuple payload is ambiguous because Variable expects raw data rather than another labeled array object.
>
> This PR normalizes tuple payloads by converting DataArray values with np.asarray before calling Variable(*obj). That gives Variable a plain ndarray and keeps the update path consistent with NumPy-backed inputs.
>
> Added a regression test that updates a Dataset with a chunked DataArray tuple and checks the resulting values are equal. Existing xarray tests pass.

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-variable.py` — 补丁前 tuple-to-Variable 转换的源码节选（最小充分上下文）

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

- xarray DataArray 可以包装 NumPy 数组，也可以包装 dask 惰性数组。
- dask 的 chunk 信息和延迟计算语义是用户依赖的行为。
- 审查数据结构转换时，要看是否只保持了数值相等，却丢失了底层执行语义。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 改编的训练补丁，不是上游最终修复）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
