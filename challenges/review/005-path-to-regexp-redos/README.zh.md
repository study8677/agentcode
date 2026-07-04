# Review 005：path-to-regexp：修复相邻路由参数的正则灾难回溯

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Fix ReDoS in route compilation for adjacent parameters (GHSA-9wv6-86v2-598j)**
>
> GHSA-9wv6-86v2-598j 报告 path-to-regexp 在相邻路由参数（如 /:a-:b）上会生成互相重叠的捕获组，攻击者只要请求一条超长路径就能触发正则灾难回溯，把 Node 事件循环卡死。
>
> 这个 PR 在编译 token 时识别相邻参数：当一个参数后面紧跟另一个参数时，让前一个参数的捕获在分隔符处停止（用 [^/-]+? 代替 [^/]+?），两个捕获不再重叠，长路径不会再指数级回溯。
>
> 新增了一个回归测试：/:a-:b 编译出的正则在两万字符的非匹配输入上立即返回 false，不再挂起。现有测试全部通过。

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-compiler.ts` — 补丁前路由编译器的源码节选（最小充分上下文）

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

- path-to-regexp 把 Express 风格的路由模板编译成正则：每个参数 token 变成一个捕获组，相邻捕获组之间是字面分隔符。
- 参数默认捕获类是 [^/]+?（惰性、匹配除斜杠外任意字符）。当两个这样的捕获被一个同样属于该字符类的分隔符隔开时，正则引擎在不匹配的长输入上会大量回溯。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 改编的训练补丁，不是上游最终修复）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
