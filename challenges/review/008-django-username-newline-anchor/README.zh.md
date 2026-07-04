# Review 008：Django：用户名校验拒绝末尾换行

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Make UsernameValidator reject usernames with a trailing newline**
>
> ASCIIUsernameValidator 和 UnicodeUsernameValidator 目前用 `'^[\w.@+-]+$'` 校验用户名，但 Python 正则的 $ 可以在字符串末尾的换行符之前匹配，所以像 `'joe\n'` 这样的用户名能通过校验，通过表单和 API 都能创建出来。
>
> 这个 PR 把两个 validator 的结尾锚点从 $ 改成 \Z：\Z 只在字符串真正的结尾匹配，带末尾换行的用户名会正常抛出 ValidationError。字符集和其余逻辑保持不变。
>
> 在 auth_tests 两组 invalid_usernames 里各加了一个带末尾换行的用例作为回归测试。现有测试全部通过。

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-validators.py` — 补丁前 validators 及 RegexValidator 基类的源码节选（最小充分上下文）

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

- ASCIIUsernameValidator 和 UnicodeUsernameValidator 是 Django auth 用户名字段默认的校验器，都继承 RegexValidator：用 regex.search 判断输入，不匹配就抛 ValidationError。
- Python re 中，$ 在默认（非 MULTILINE）模式下既能在字符串结尾匹配，也能在结尾换行符之前匹配；\Z 只在字符串绝对结尾匹配。^ 在非 MULTILINE 模式下只在字符串开头匹配。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 为审查训练改编的补丁）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
