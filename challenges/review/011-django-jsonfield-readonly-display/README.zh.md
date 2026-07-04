# Review 011：Django Admin：readonly JSONField 展示为合法 JSON

你是这个仓库的 reviewer。一个 AI agent 提交了下面这个 PR，CI 全绿，等待你的结论。

## PR 描述（作者提供）

> **Serialize readonly JSONField values as JSON in the admin**
>
> 在 admin 详情页上，readonly 的 JSONField 目前走 display_for_field 的兜底分支，直接 str(value) 输出 Python repr（例如 `{'foo': 'bar'}`）——不是合法 JSON，和可编辑状态下 widget 展示的内容也不一致。
>
> 这个 PR 在 display_for_field 里为 JSONField 增加一个分支，调用 field.get_prep_value(value) 输出字段自身序列化后的 JSON 文本（同时尊重自定义 encoder）；对无法序列化的值捕获 TypeError，回退到原有的通用展示路径，保证详情页不会因此报错。
>
> 新增 test_json_display_for_field 覆盖嵌套 dict、list、字符串和不可序列化输入四种情况，并在 null 展示测试里补充了 JSONField 为 None 的断言。现有测试全部通过。

## 你需要审核

请阅读：

- `ai-pr.diff` — 待审核的补丁
- `src-admin-utils.py` — 补丁前 display_for_field / display_for_value 及 JSONField.get_prep_value 的源码节选（最小充分上下文）

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

- display_for_field 是 Django admin 渲染 readonly 字段值的入口：按字段类型逐个特判（Boolean、DateTime、Decimal、FileField……），没有命中的类型走 display_for_value 兜底，最终 str(value)。
- JSONField 的 get_prep_value 定义为 json.dumps(value, cls=self.encoder)：输出 JSON 文本并尊重字段的自定义 encoder；不可 JSON 序列化的值会抛 TypeError。

## 答案与解析

参考答案在 `expected-findings.json` 和 `rubric.md` 中（剧透注意）。在线做题时提交 review 后自动展示。

## 题目来源

本题改编自真实工程问题（你审核的 `ai-pr.diff` 是 AgentCode 为审查训练改编的补丁）。上游链接在 `metadata.json` 的 `source` 字段中，建议做完题再看。
