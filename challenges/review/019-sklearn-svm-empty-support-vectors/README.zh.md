# Review 019：scikit-learn SVM 空 support_vectors_ 审查

AI PR 遇到 n_SV == 0 时直接设置 self.dual_coef_ = sp.csr_matrix([])。

你的任务不是写代码，而是判断这个 AI PR 是否可以合并。如果不能合并，需要指出具体风险、影响和建议修复方向。

## 题目来源

本题来自真实工程问题，并改编为 AgentCode Review Mode 题目：

- scikit-learn Issue/PR：<https://github.com/scikit-learn/scikit-learn/pull/14894>
- SWE-bench Lite：<https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite>

注意：你要审核的是 `ai-pr.diff` 中的改编 AI 补丁，不是上游最终合并的正确修复。

## 背景

- SVM sparse fit 在没有 support vectors 的边界情况下曾出现 ZeroDivisionError。
- 修复不能只避免除零，还必须让 dual_coef_ 的形状符合后续 predict/属性访问预期。
- scikit-learn estimator 的公开属性形状是 API 合约的一部分。

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
- 是否识别核心风险：The patch creates sp.csr_matrix([]), which does not preserve the expected (n_class, n_SV) shape.
- 是否说明原有行为边界和 AI patch 改变了什么。
- 是否指出新增测试覆盖不足。
- 是否给出可执行的修复建议，而不是只说“加测试”。
