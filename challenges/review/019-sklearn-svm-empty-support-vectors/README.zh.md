# Review 019：scikit-learn SVM：处理空 support vectors 的 sparse fit

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Avoid sparse SVM dual_coef_ construction error when there are no support vectors**
>
> 在稀疏输入上拟合 SVR 时可能出现一个边界情况：所有样本都落在 epsilon 管道之外，训练完没有任何 support vector（n_SV == 0）。此时 _sparse_fit 里 dual_coef_indptr = np.arange(0, size+1, size / n_class) 的步长是 0，np.arange 直接抛错，fit 无法返回。
>
> 这个 PR 在构造 dual_coef_ 前加一个 n_SV == 0 的判断：没有支持向量时直接赋一个空的 csr_matrix，否则走原来的 CSR indptr 构造路径。正常的稀疏 SVM 拟合逻辑完全不变。
>
> 新增回归测试：构造一个会产生 0 个支持向量的稀疏 SVR，验证 fit 能正常完成、support_vectors_ 和 dual_coef_ 都为空。现有 SVM 测试全部通过。

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-svm-base.py` — 补丁前 _sparse_fit 的源码节选（最小充分上下文）

然后提交 review 结论：

```text
Can merge? Yes / No / Need more info

Finding 1:
- Severity:
- Problem:（如果你认为可以合并，写出你逐一确认过哪些点）
- Why it matters:
- Suggested fix:

Testing:
- 新增测试证明了什么？可信吗？
```

## 背景

- _sparse_fit 是稀疏 SVM 的拟合入口，训练后要把 dual coefficients 组装成稀疏矩阵 dual_coef_。在空 support vectors 场景下，需要验证的契约是 dual_coef_ 不含系数，而不是某个特定二维 shape。
- dual_coef_indptr 用 np.arange(0, size+1, step) 生成，step = dual_coef_indices.size / n_class；没有支持向量时 size 为 0，step 为 0。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
