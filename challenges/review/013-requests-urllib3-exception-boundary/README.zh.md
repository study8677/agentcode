# Review 013：Requests：包装 urllib3 连接池异常

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Wrap ClosedPoolError as a Requests ConnectionError**
>
> 在连接池被关闭后复用一个 adapter 发请求时，urllib3 的 ClosedPoolError 会直接穿透到调用方，破坏了 Requests 用户只需 catch requests.exceptions 类型的约定（issue #2674）。
>
> 这个 PR 在 adapters.py 里 import ClosedPoolError，并在已有的 urllib3→Requests 异常映射旁边，把它映射成 requests.exceptions.ConnectionError。
>
> 新增一个针对 ClosedPoolError 的回归测试，验证调用方现在收到的是 ConnectionError。现有 Requests 测试全部通过。

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-adapters.py` — 补丁前 HTTPAdapter.send 异常映射的源码节选（最小充分上下文）

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

- Requests 对外承诺 `requests.exceptions` 体系；adapter 层把 urllib3 等下层异常映射成 Requests 自己的类型。
- HTTPAdapter.send 已经映射了 ProtocolError/OSError、MaxRetryError（及其 reason 分支）、_ProxyError、_SSLError、ReadTimeoutError。审查时先看清 ClosedPoolError 会不会被现有分支接住。
- 源码节选已给出相关 urllib3 异常层级：ClosedPoolError 继承自 PoolError，不继承 HTTPAdapter.send 已捕获的任何异常类型。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
