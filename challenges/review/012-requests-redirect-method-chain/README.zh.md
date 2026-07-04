# Review 012：Requests：让 redirect 处理无副作用的重构

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Make resolve_redirects side-effect free by always copying the original request**
>
> resolve_redirects 目前在循环末尾把 req 重新绑定到当前 hop 的请求上，后续 hop 因此依赖前一跳留下的可变状态，调试时很难看出每一跳到底基于什么构造。
>
> 这个 PR 让每个 redirect hop 都直接从调用方传入的原始请求 copy，redirect 处理因此保持无副作用、每一跳都可独立重放。
>
> 新增了回归测试，验证经过 redirect 链之后调用方的原始请求对象没有被改动。现有测试全部通过。

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-sessions.py` — 补丁前 resolve_redirects 的源码节选（最小充分上下文）

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

- resolve_redirects 是 Requests 会话层处理 HTTP 重定向的核心循环。
- HTTP 规范对不同状态码有不同要求：303 See Other 要求后续请求改用 GET；307/308 要求保持当前请求的方法和 body。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 改编的训练补丁，不是上游最终修复）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
