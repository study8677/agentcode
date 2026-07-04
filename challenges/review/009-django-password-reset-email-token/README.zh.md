# Review 009：Django：修复密码重置 token 与邮箱状态的关系

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Avoid password reset token crashes for users without a usable email**
>
> PasswordResetTokenGenerator currently builds the token hash from stable user fields but assumes every user object has a meaningful email value during reset flows. Custom user models and imported accounts can have an empty email, and that edge case makes the reset path fragile.
>
> This PR guards the hash construction with get_email_field_name(): when the configured email field is empty, the generator falls back to the existing password/login/timestamp material instead of depending on an empty email value.
>
> Added a regression test for a user with an empty email to confirm token creation and validation still work. Existing auth tests pass.

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-tokens.py` — 补丁前 token generator 的源码节选（最小充分上下文）

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

- Django password reset token 会把一组用户状态写进 hash material，用来让旧 token 在关键状态变化后失效。
- 项目可能自定义用户模型和 email 字段名。
- 审查 token 逻辑时，要区分“避免某个异常路径崩溃”和“维护 token 失效契约”。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 改编的训练补丁，不是上游最终修复）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
