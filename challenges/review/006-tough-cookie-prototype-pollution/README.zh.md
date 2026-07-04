# Review 006：tough-cookie：修复 cookie domain 的原型污染

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Reject __proto__ cookie domain to fix prototype pollution (GHSA-72xf-g2v4-qvf3)**
>
> GHSA-72xf-g2v4-qvf3 报告：往 CookieJar 里存一个 Domain=__proto__ 的 cookie，会通过 MemoryCookieStore 的多层索引赋值污染 Object.prototype。
>
> 这个 PR 在 putCookie 入口做拦截：当 cookie.domain 等于 __proto__ 时直接忽略该 cookie、不写入索引，PoC 就无法再污染全局原型。
>
> 新增了一个回归测试，重放公告里的 PoC（Domain=__proto__），断言普通对象上 {}.a 仍为 undefined。现有测试全部通过。

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-memstore.js` — 补丁前 MemoryCookieStore 的源码节选（最小充分上下文）

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

- MemoryCookieStore 用一个普通对象 this.idx 建立 domain -> path -> key 三层索引，putCookie 按这三个字段逐层写入。
- findCookie / findCookies 用同样的字段从这些普通对象里读回 cookie。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 改编的训练补丁，不是上游最终修复）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
