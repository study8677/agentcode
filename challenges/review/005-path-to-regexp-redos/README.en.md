# Review 005: Express route pattern ReDoS review

Review a partial path-to-regexp ReDoS fix that misses broader overlapping route patterns.

Your task is to review the adapted AI patch, decide whether it can be merged, and write actionable findings.

## Sources

- Advisory 1: <https://github.com/pillarjs/path-to-regexp/security/advisories/GHSA-9wv6-86v2-598j>
- Advisory 2: <https://github.com/pillarjs/path-to-regexp/security/advisories/GHSA-rhx6-c78j-4q9w>
- OSV: <https://osv.dev/GHSA-9wv6-86v2-598j>
- 修复 commit: <https://github.com/pillarjs/path-to-regexp/commit/f01c26a013b1889f0c217c643964513acf17f6a4>

The patch in `ai-pr.diff` is an AgentCode adapted plausible-but-incorrect patch for review training, not the upstream maintainer fix.

## Context

- Express 等框架会把路由模式编译成正则表达式。重叠 capture 可能在恶意长路径上触发灾难回溯。
- Node 单线程事件循环被 ReDoS 输入阻塞，会影响整个服务的可用性。
- 只给一个具体模式打补丁，容易漏掉 /:a-:b-:c 或自定义 capture 等同类问题。

## Review Format

```text
Can merge? Yes / No

Finding 1:
- Severity:
- Problem:
- Why it matters:
- Suggested fix:

Testing:
- Missing regression or boundary tests:
```

## Rubric Focus

- Correct merge decision.
- Core risk: The patch special-cases one adjacent-parameter pattern but does not remove the broader overlapping-capture risk.
- The intended behavior boundary.
- Missing negative or boundary tests.
- Actionable repair direction.
