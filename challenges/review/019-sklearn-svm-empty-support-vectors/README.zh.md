# Review 019：scikit-learn SVM：处理空 support vectors 的 sparse fit

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Avoid sparse SVM dual_coef_ construction errors when there are no support vectors**
>
> Sparse SVM fitting can hit an edge case where there are no support vectors. The current code still tries to construct dual_coef_ from CSR indptr/index arrays, which can fail or divide through empty support-vector state.
>
> This PR adds a fast path for n_SV == 0 and assigns an empty csr_matrix directly. Normal sparse SVM fits continue to use the existing CSR construction path.
>
> Added a regression test that fits the sparse model in the empty-support-vector case and confirms dual_coef_ is empty. Existing SVM tests pass.

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-svm-base.py` — 补丁前 sparse dual_coef_ 构造的源码节选（最小充分上下文）

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

- scikit-learn estimator 的公开属性形状是 API 合约的一部分。
- 空矩阵也需要携带正确 shape，不能只看元素数量是否为 0。
- 审查数值库边界修复时，要检查异常规避是否保留后续属性访问和预测路径的不变量。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 改编的训练补丁，不是上游最终修复）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
