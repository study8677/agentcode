# Review 004：Axios：给内部 API client 增加请求 URL 校验

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Reject protocol-relative URLs on internalApi to prevent baseURL bypass**
>
> internalApi 这个 Axios 实例把内部服务地址配成 baseURL，并在默认 headers 里带上 Authorization。我们发现传入以 // 开头的 protocol-relative URL（如 //evil.test/a）时，Axios 会把它当成绝对地址、忽略 baseURL，把带认证头的请求发到外部主机。
>
> 这个 PR 在 fetchInternal 里增加校验：路径以 // 开头就直接抛错，堵住这个 protocol-relative URL 绕过 baseURL 的口子。
>
> 新增测试验证 //evil.test/a 会被拒绝，同时正常相对路径继续工作。现有测试全部通过。

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-internal-api.ts` — 补丁前 internalApi / fetchInternal 的源码节选（最小充分上下文）

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

- internalApi 用 baseURL 指向内部服务，并在实例默认配置里附带 Authorization header；fetchInternal(path) 用它对 path 发起 GET。
- Axios 的 URL 拼接规则：当 path 是绝对地址时，baseURL 会被忽略，请求直接发往 path 指定的 origin。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 改编的训练补丁，不是上游最终修复）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
