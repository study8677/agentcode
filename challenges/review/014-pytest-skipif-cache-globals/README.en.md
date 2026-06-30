# Review 014: pytest skipif string-condition cache review

Review a skipif cache patch that keys only by expression string and ignores per-module globals.

Your task is to review the adapted AI patch, decide whether it can be merged, and write actionable findings.

## Sources

- pytest Issue: <https://github.com/pytest-dev/pytest/issues/7373>
- 上游 PR: <https://github.com/pytest-dev/pytest/pull/7373>
- SWE-bench Lite: <https://huggingface.co/datasets/princeton-nlp/SWE-bench_Lite>

The patch in `ai-pr.diff` is an AgentCode adapted plausible-but-incorrect patch for review training, not the upstream maintainer fix.

## Context

- pytest 支持 skipif/xfail 使用字符串条件，条件在测试模块 globals 中求值。
- 相同字符串在不同模块中可能引用不同变量。
- 缓存只按字符串命中，会把第一个模块的结果错误复用到第二个模块。

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
- Core risk: The cache key is only the expression string and ignores the globals used to evaluate it.
- The intended behavior boundary.
- Missing negative or boundary tests.
- Actionable repair direction.
