# Review 002：Next.js Middleware：修复子请求递归导致的重复执行

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Skip auth middleware for internal framework subrequests to prevent redundant re-execution**
>
> 当 middleware 内部触发子请求（例如 rewrite 或转发到同一应用的其它路由）时，middleware 会被再次触发，导致同一条请求链上的鉴权逻辑被重复执行，个别路由甚至出现明显的重复重定向。
>
> Next.js 在这类框架内部子请求上会带上 x-middleware-subrequest 头。这个 PR 在 middleware 入口检查该头：只要存在，就说明当前是框架内部子请求，直接 NextResponse.next() 放行，不再重复跑一遍鉴权分支。
>
> 新增测试验证带 x-middleware-subrequest 的子请求不会再触发重复执行。现有测试全部通过。

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-middleware.ts` — 补丁前 middleware 的源码节选（最小充分上下文）

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

- middleware.ts 在请求进入路由前执行；这里用它对 /admin、/billing、/settings 等前缀做登录态检查，未登录就重定向到 /login。
- Next.js 在框架内部发起子请求时会附带 x-middleware-subrequest 头，用来标记内部调用链、避免中间件对内部调用无限递归。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 改编的训练补丁，不是上游最终修复）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
