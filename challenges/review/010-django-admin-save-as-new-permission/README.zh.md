# Review 010：Django Admin：调整 Save as new 的展示条件

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Allow Save as new when a user can change the object**
>
> The admin change form currently hides Save as new unless the user has add permission, even though the button is rendered while editing an existing object. This is confusing for staff who can maintain existing records but do not have broad add access.
>
> This PR treats Save as new as part of the change form action set: if the user can change the current object and save_as is enabled, the button is shown. The popup and change-form guards stay in place.
>
> Added a submit_row regression test for a change-only user so the template context exposes show_save_as_new. Existing admin tests pass.

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-admin-modify.py` — 补丁前 submit_row 的源码节选（最小充分上下文）

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

- Django admin 区分 add permission 和 change permission。
- Save as new 出现在修改页上，但动作结果是创建一个新对象。
- 审查权限补丁时，要把 UI 展示条件和动作语义一起看。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 改编的训练补丁，不是上游最终修复）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
