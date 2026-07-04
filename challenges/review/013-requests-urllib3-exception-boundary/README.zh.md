# Review 013：Requests：包装 urllib3 连接池异常

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Wrap ClosedPoolError as a Requests ConnectionError**
>
> Some adapter error paths can leak urllib3 ClosedPoolError directly to callers, which breaks the expectation that Requests users catch requests.exceptions types at the public API boundary.
>
> This PR imports ClosedPoolError in adapters.py and maps it to requests.exceptions.ConnectionError next to the existing urllib3-to-Requests exception conversions.
>
> Added a focused regression test for ClosedPoolError so callers now see ConnectionError. Existing Requests tests pass.

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-adapters.py` — 补丁前 HTTPAdapter.send 异常映射的源码节选（最小充分上下文）

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

- Requests 对外承诺的是 `requests.exceptions` 体系。
- adapter 层负责把 urllib3 等下层异常映射成 Requests 自己的异常类型。
- 审查这类补丁时，要判断它是否维护完整 API 边界，而不是只覆盖一个观测到的异常。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 改编的训练补丁，不是上游最终修复）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
