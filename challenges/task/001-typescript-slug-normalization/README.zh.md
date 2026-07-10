# 修复 Slug 规范化

`normalizeSlug` 会把用户输入转换为 URL slug，但当前实现会保留标点、路径分隔符和部分 Unicode 组合符号，也可能返回空字符串。

请只修改 `src/slug.ts`，并提交 unified diff patch。目标行为：

- 输出只包含小写 ASCII 字母、数字和单个 `-`。
- 去掉首尾分隔符，合并连续分隔符。
- 常见带音标拉丁字母应折叠为对应 ASCII 字母。
- 无法产生有效 slug 时抛出 `TypeError`。

Runner 会执行公开测试和隐藏边界测试。不接受仓库 URL、自定义命令或二进制补丁。
