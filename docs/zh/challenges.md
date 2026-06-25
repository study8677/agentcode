# 首批题库规划

[返回首页](../../README.md)

V0 先做 20 道高质量题：

- 10 道 Task Mode。
- 10 道 Review Mode。

题目质量比数量更重要。每道题都应该有明确工程教训、真实失败模式、确定性资产和清晰讲解。

## Task Mode 方向

- 修复一个真实 bug。
- 实现一个小 feature。
- 优化慢查询。
- 修复缓存不一致。
- 补充缺失测试。
- 重构一段复杂代码。
- 修复异步任务重复执行。
- 实现 rate limit。
- 增加参数校验。
- 修复分页边界问题。

## Review Mode 方向

- AI PR 看似修复了 bug，但漏掉边界条件。
- AI PR 通过了现有测试，但破坏了兼容性。
- AI PR 增加了功能，但缺少权限校验。
- AI PR 测试很多，但没有测到核心风险。
- AI PR 修复性能问题，但引入数据不一致。
- AI PR 改动过大，风险不可控。
- AI PR 逻辑重复、不可维护。
- AI PR 修复了前端展示，但后端数据仍然错误。
- AI PR 引入并发问题。
- AI PR 是一个合格改动，用户需要判断可以合并。

## 题库资产结构

题目应该作为版本化内容放在仓库里，而不是只存在数据库中。

推荐结构：

```text
content/
  challenges/
    task/
      fix-pagination-boundary/
        challenge.yaml
        prompt.md
        repo/
        tests/
          public/
          hidden/
        solution.patch
        explanation.md
    review/
      ai-pr-missing-permission-check/
        challenge.yaml
        prompt.md
        base.diff
        ai-pr.diff
        rubric.yaml
        explanation.md
```

`challenge.yaml` 定义题目元信息和执行配置：

```yaml
id: fix-pagination-boundary
mode: task
title: Fix pagination boundary behavior
difficulty: medium
tags:
  - backend
  - testing
  - edge-case
runtime:
  image: node:22
  install: npm install
  test: npm test
limits:
  timeoutSeconds: 120
```

这种结构让题目可 review、可迁移、可复现。

