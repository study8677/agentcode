# Review 003：Server Actions：支持登录后跳回原页面的相对路径重定向

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Support relative post-login redirects instead of only the configured origin**
>
> 登录流程需要在认证完成后把用户带回他原本访问的页面。目前 followActionRedirect 只用 process.env.APP_ORIGIN 拼接，所有跳转都落到那个固定 origin，忽略了用户实际所在的站点——多域名和预览部署下会跳到错误的域名。
>
> 这个 PR 改为：先校验 redirectUrl 必须是以 / 开头的相对路径（拒绝外部绝对 URL），再用当前请求的 proto + host 构造出用户所在站点上的目标 URL，然后在服务端取回该页面内容返回。这样多域名和预览环境都能正确跳回原页面。
>
> 新增测试验证相对路径 redirect 能正常工作。现有测试全部通过。

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-action.ts` — 补丁前 followActionRedirect 的源码节选（最小充分上下文）

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

- Server Actions 在服务端执行；followActionRedirect 会在服务端对目标 URL 发起 fetch，并把响应内容返回给调用方。
- 登录后跳回原页面是常见需求：需要一个『目标站点 origin + 相对路径』来定位用户原来所在的页面。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 改编的训练补丁，不是上游最终修复）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
