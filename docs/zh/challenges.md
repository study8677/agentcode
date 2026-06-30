# 首批题库

[返回首页](../../README.md)

当前 V0 已落地 **20 道 Review Mode 题**。这些题都按第一题的质量标准组织：真实来源、可追溯链接、改编 AI diff、expected findings 和结构化 rubric。

Task Mode 仍是下一阶段，需要 runner、starter repo、公开测试和隐藏测试接入后再上线；当前网站先把 AI PR 审核训练闭环做完整。

## 题库资产结构

题目作为版本化内容放在仓库里，而不是只存在数据库中。

```text
challenges/
  review/
    001-sympy-point2d-ai-patch/
      metadata.json
      README.zh.md
      README.en.md
      ai-pr.diff
      expected-findings.json
      rubric.md
```

每道题必须能回答：

- 来源是否真实、可追溯。
- AI 补丁或任务资产是否可复现。
- 标准 finding 和评分规则是否可审查。
- 用户到底在练安全判断、边界条件、测试质量、数据语义，还是兼容性判断。

## 当前 20 题

- [001 这个 AI 修复能合并吗？SymPy Point2D 回归审查](../../challenges/review/001-sympy-point2d-ai-patch/README.zh.md)
- [002 别信任内部请求头：Next.js Middleware 绕过审查](../../challenges/review/002-next-middleware-header-bypass/README.zh.md)
- [003 Server Actions 相对重定向 SSRF 审查](../../challenges/review/003-next-server-actions-ssrf/README.zh.md)
- [004 Axios baseURL 被绝对 URL 绕过审查](../../challenges/review/004-axios-baseurl-absolute-url/README.zh.md)
- [005 Express 路由模式 ReDoS 审查](../../challenges/review/005-path-to-regexp-redos/README.zh.md)
- [006 CookieJar 原型污染黑名单修复审查](../../challenges/review/006-tough-cookie-prototype-pollution/README.zh.md)
- [007 JWT verify 未固定算法审查](../../challenges/review/007-jsonwebtoken-algorithm-pinning/README.zh.md)
- [008 Django 用户名换行锚点审查](../../challenges/review/008-django-username-newline-anchor/README.zh.md)
- [009 Django 密码重置 token 未绑定邮箱审查](../../challenges/review/009-django-password-reset-email-token/README.zh.md)
- [010 Django Admin save_as_new 权限审查](../../challenges/review/010-django-admin-save-as-new-permission/README.zh.md)
- [011 Django readonly JSONField 展示格式审查](../../challenges/review/011-django-jsonfield-readonly-display/README.zh.md)
- [012 Requests 多跳重定向方法保持审查](../../challenges/review/012-requests-redirect-method-chain/README.zh.md)
- [013 Requests urllib3 异常边界审查](../../challenges/review/013-requests-urllib3-exception-boundary/README.zh.md)
- [014 pytest skipif 字符串条件缓存审查](../../challenges/review/014-pytest-skipif-cache-globals/README.zh.md)
- [015 Sphinx autodoc 空 __all__ 审查](../../challenges/review/015-sphinx-empty-all/README.zh.md)
- [016 Astropy 嵌套 CompoundModel separability 审查](../../challenges/review/016-astropy-separability-nested-model/README.zh.md)
- [017 Astropy NDData mask 传播 None 分支审查](../../challenges/review/017-astropy-nddata-mask-propagation/README.zh.md)
- [018 xarray update 保留 dask chunk 审查](../../challenges/review/018-xarray-update-preserve-dask-chunks/README.zh.md)
- [019 scikit-learn SVM 空 support_vectors_ 审查](../../challenges/review/019-sklearn-svm-empty-support-vectors/README.zh.md)
- [020 SymPy partitions 复用字典审查](../../challenges/review/020-sympy-partitions-dict-reuse/README.zh.md)

## 后续 Task Mode

Task Mode 后续会增加：

- `starter/`
- `tests/visible/`
- `tests/hidden/`
- `validator.sh`
- `solution.patch`

在 runner 没接入前，不把 Task 题伪装成可练习题。当前网站和 GitHub 以 20 道 Review Mode 题作为可用题库。
