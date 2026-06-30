# Review 006: CookieJar prototype pollution blacklist review

Review a blacklist patch that blocks only __proto__ while leaving ordinary-object indexes vulnerable.

Your task is to review the adapted AI patch, decide whether it can be merged, and write actionable findings.

## Sources

- GitHub Advisory: <https://github.com/advisories/GHSA-72xf-g2v4-qvf3>
- Issue #282: <https://github.com/salesforce/tough-cookie/issues/282>
- 修复 commit: <https://github.com/salesforce/tough-cookie/commit/12d4747>
- Snyk PoC: <https://security.snyk.io/vuln/SNYK-JS-TOUGHCOOKIE-5672873>

The patch in `ai-pr.diff` is an AgentCode adapted plausible-but-incorrect patch for review training, not the upstream maintainer fix.

## Context

- CookieJar 会按 domain、path、key 建立多层索引，旧实现如果使用普通对象就可能碰到原型链属性。
- Prototype pollution 的修复重点通常是让字典没有原型，或者使用 Map，而不是只屏蔽一个字符串。
- 黑名单容易漏掉 constructor、prototype 或嵌套层级里的危险 key。

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
- Core risk: The patch blocks only one dangerous domain string while keeping ordinary objects for untrusted indexes.
- The intended behavior boundary.
- Missing negative or boundary tests.
- Actionable repair direction.
