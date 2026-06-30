import type { Challenge, PracticeStats } from "@/lib/types/problem";

export const practiceStats: PracticeStats = {
  seedChallenges: 20,
  taskMode: 0,
  reviewMode: 20,
  taskProgress: 0,
  reviewProgress: 1
};

export const challenges: Challenge[] = [
  {
    id: "001",
    href: "/challenges/review/001-sympy-point2d-ai-patch",
    title: {
      zh: "这个 AI 修复能合并吗？SymPy Point2D 回归审查",
      en: "Can this AI fix be merged? Reviewing a SymPy Point2D regression"
    },
    summary: {
      zh: "审查一个针对真实 SymPy 问题的 AI 补丁：它修好了 evaluate(False) 下的报错，但可能放过非法虚数坐标。",
      en: "Review an AI patch for a real SymPy issue: it fixes an evaluate(False) error but may let invalid imaginary coordinates through."
    },
    mode: "review",
    difficulty: "mid",
    status: "ready",
    acceptanceRate: 31.4,
    tags: ["sympy", "swe-bench", "regression", "edge-case", "tests"],
    runStatus: "idle"
  },
  {
    id: "002",
    href: "/challenges/review/002-next-middleware-header-bypass",
    title: {
      zh: "别信任内部请求头：Next.js Middleware 绕过审查",
      en: "Do not trust internal middleware headers"
    },
    summary: {
      zh: "审查一个声称修复 middleware 递归的补丁，它可能允许外部请求伪造内部头绕过鉴权。",
      en: "Review a middleware patch that may let external requests spoof an internal header and bypass authorization."
    },
    mode: "review",
    difficulty: "senior",
    status: "ready",
    acceptanceRate: 18.6,
    tags: ["nextjs", "security", "middleware", "auth-bypass", "headers"],
    runStatus: "idle"
  },
  {
    id: "003",
    href: "/challenges/review/003-next-server-actions-ssrf",
    title: {
      zh: "Server Actions 相对重定向 SSRF 审查",
      en: "Server Actions relative redirect SSRF review"
    },
    summary: {
      zh: "审查一个只检查 redirectUrl 以 / 开头的补丁，它仍然可能信任攻击者控制的 Host 触发 SSRF。",
      en: "Review a patch that checks only relative redirect paths while still trusting attacker-controlled Host headers."
    },
    mode: "review",
    difficulty: "senior",
    status: "ready",
    acceptanceRate: 21.2,
    tags: ["nextjs", "security", "ssrf", "server-actions", "host-header"],
    runStatus: "idle"
  },
  {
    id: "004",
    href: "/challenges/review/004-axios-baseurl-absolute-url",
    title: {
      zh: "Axios baseURL 被绝对 URL 绕过审查",
      en: "Axios baseURL absolute URL bypass review"
    },
    summary: {
      zh: "审查一个只拒绝 protocol-relative URL 的补丁，它仍然允许绝对 URL 覆盖 baseURL 并带走敏感 headers。",
      en: "Review a patch that rejects protocol-relative URLs but still allows absolute URLs to override baseURL."
    },
    mode: "review",
    difficulty: "senior",
    status: "ready",
    acceptanceRate: 24.8,
    tags: ["axios", "security", "ssrf", "credential-leak", "url-parsing"],
    runStatus: "idle"
  },
  {
    id: "005",
    href: "/challenges/review/005-path-to-regexp-redos",
    title: {
      zh: "Express 路由模式 ReDoS 审查",
      en: "Express route pattern ReDoS review"
    },
    summary: {
      zh: "审查一个局部修复 path-to-regexp 回溯的补丁，它可能只覆盖两段参数而漏掉更多重叠模式。",
      en: "Review a partial path-to-regexp ReDoS fix that misses broader overlapping route patterns."
    },
    mode: "review",
    difficulty: "senior",
    status: "ready",
    acceptanceRate: 19.7,
    tags: ["express", "redos", "routing", "performance-security", "regex"],
    runStatus: "idle"
  },
  {
    id: "006",
    href: "/challenges/review/006-tough-cookie-prototype-pollution",
    title: {
      zh: "CookieJar 原型污染黑名单修复审查",
      en: "CookieJar prototype pollution blacklist review"
    },
    summary: {
      zh: "审查一个只拦截 __proto__ domain 的补丁，它没有修复 CookieJar 内部索引使用普通对象的问题。",
      en: "Review a blacklist patch that blocks only __proto__ while leaving ordinary-object indexes vulnerable."
    },
    mode: "review",
    difficulty: "senior",
    status: "ready",
    acceptanceRate: 17.3,
    tags: ["nodejs", "prototype-pollution", "cookies", "security", "blacklist"],
    runStatus: "idle"
  },
  {
    id: "007",
    href: "/challenges/review/007-jsonwebtoken-algorithm-pinning",
    title: {
      zh: "JWT verify 未固定算法审查",
      en: "JWT verification without algorithm pinning review"
    },
    summary: {
      zh: "审查一个让测试通过的认证补丁，它把 key 变成可空配置并移除了 algorithms 白名单。",
      en: "Review an auth patch that makes the key optional and removes algorithm pinning."
    },
    mode: "review",
    difficulty: "senior",
    status: "ready",
    acceptanceRate: 16.9,
    tags: ["jwt", "auth", "security", "algorithm-confusion", "configuration"],
    runStatus: "idle"
  },
  {
    id: "008",
    href: "/challenges/review/008-django-username-newline-anchor",
    title: {
      zh: "Django 用户名换行锚点审查",
      en: "Django username newline anchor review"
    },
    summary: {
      zh: "审查一个用 strip() 处理用户名换行的补丁，它可能静默改写用户输入而不是拒绝非法用户名。",
      en: "Review a username validator patch that strips input instead of rejecting trailing newlines."
    },
    mode: "review",
    difficulty: "mid",
    status: "ready",
    acceptanceRate: 42.1,
    tags: ["django", "validation", "regex", "security", "swe-bench"],
    runStatus: "idle"
  },
  {
    id: "009",
    href: "/challenges/review/009-django-password-reset-email-token",
    title: {
      zh: "Django 密码重置 token 未绑定邮箱审查",
      en: "Django password reset token email binding review"
    },
    summary: {
      zh: "审查一个只检查当前邮箱非空的补丁，它没有让旧密码重置 token 在邮箱变更后失效。",
      en: "Review a password reset patch that checks email presence but does not bind tokens to email changes."
    },
    mode: "review",
    difficulty: "senior",
    status: "ready",
    acceptanceRate: 28.4,
    tags: ["django", "auth", "password-reset", "security", "swe-bench"],
    runStatus: "idle"
  },
  {
    id: "010",
    href: "/challenges/review/010-django-admin-save-as-new-permission",
    title: {
      zh: "Django Admin save_as_new 权限审查",
      en: "Django admin save_as_new permission review"
    },
    summary: {
      zh: "审查一个把 Save as new 按钮放宽给 change 权限用户的补丁，它可能允许无 add 权限用户创建对象。",
      en: "Review an admin patch that exposes Save as new to users without add permission."
    },
    mode: "review",
    difficulty: "senior",
    status: "ready",
    acceptanceRate: 22.7,
    tags: ["django", "admin", "authorization", "permissions", "swe-bench"],
    runStatus: "idle"
  },
  {
    id: "011",
    href: "/challenges/review/011-django-jsonfield-readonly-display",
    title: {
      zh: "Django readonly JSONField 展示格式审查",
      en: "Django readonly JSONField display review"
    },
    summary: {
      zh: "审查一个用 str(value) 展示 readonly JSONField 的补丁，它可能继续输出非 JSON 文本并破坏无效输入处理。",
      en: "Review a readonly JSONField display patch that keeps using Python string formatting instead of field preparation."
    },
    mode: "review",
    difficulty: "mid",
    status: "ready",
    acceptanceRate: 48.3,
    tags: ["django", "jsonfield", "admin", "formatting", "swe-bench"],
    runStatus: "idle"
  },
  {
    id: "012",
    href: "/challenges/review/012-requests-redirect-method-chain",
    title: {
      zh: "Requests 多跳重定向方法保持审查",
      en: "Requests redirect method chain review"
    },
    summary: {
      zh: "审查一个每轮都复制原始请求的补丁，它会在 303 后遇到 307 时错误恢复 POST。",
      en: "Review a redirect patch that keeps copying the original request and restores POST after a 303 then 307 chain."
    },
    mode: "review",
    difficulty: "mid",
    status: "ready",
    acceptanceRate: 38.8,
    tags: ["requests", "http", "redirect", "method", "swe-bench"],
    runStatus: "idle"
  },
  {
    id: "013",
    href: "/challenges/review/013-requests-urllib3-exception-boundary",
    title: {
      zh: "Requests urllib3 异常边界审查",
      en: "Requests urllib3 exception boundary review"
    },
    summary: {
      zh: "审查一个只包装 ClosedPoolError 的补丁，它没有处理 urllib3 DecodeError 和 TimeoutError 穿透 Requests API。",
      en: "Review a patch that wraps only ClosedPoolError while leaving other urllib3 exceptions leaking through."
    },
    mode: "review",
    difficulty: "mid",
    status: "ready",
    acceptanceRate: 45.6,
    tags: ["requests", "urllib3", "exceptions", "api-boundary", "swe-bench"],
    runStatus: "idle"
  },
  {
    id: "014",
    href: "/challenges/review/014-pytest-skipif-cache-globals",
    title: {
      zh: "pytest skipif 字符串条件缓存审查",
      en: "pytest skipif string-condition cache review"
    },
    summary: {
      zh: "审查一个按表达式字符串缓存 skipif/xfail 的补丁，它忽略了不同模块 globals 会改变求值结果。",
      en: "Review a skipif cache patch that keys only by expression string and ignores per-module globals."
    },
    mode: "review",
    difficulty: "senior",
    status: "ready",
    acceptanceRate: 34.2,
    tags: ["pytest", "cache", "globals", "skipif", "swe-bench"],
    runStatus: "idle"
  },
  {
    id: "015",
    href: "/challenges/review/015-sphinx-empty-all",
    title: {
      zh: "Sphinx autodoc 空 __all__ 审查",
      en: "Sphinx autodoc empty __all__ review"
    },
    summary: {
      zh: "审查一个把空 __all__ 当成未设置的补丁，它会继续把本应隐藏的模块成员全部文档化。",
      en: "Review an autodoc patch that treats an empty __all__ like no __all__ and documents members that should be hidden."
    },
    mode: "review",
    difficulty: "mid",
    status: "ready",
    acceptanceRate: 51.9,
    tags: ["sphinx", "autodoc", "api-docs", "__all__", "swe-bench"],
    runStatus: "idle"
  },
  {
    id: "016",
    href: "/challenges/review/016-astropy-separability-nested-model",
    title: {
      zh: "Astropy 嵌套 CompoundModel separability 审查",
      en: "Astropy nested CompoundModel separability review"
    },
    summary: {
      zh: "审查一个把右侧坐标矩阵填成 1 的补丁，它对嵌套模型会丢失已有 separability 结构。",
      en: "Review a separability patch that fills nested right-side matrices with ones and loses the existing structure."
    },
    mode: "review",
    difficulty: "mid",
    status: "ready",
    acceptanceRate: 36.5,
    tags: ["astropy", "matrix", "modeling", "nested-model", "swe-bench"],
    runStatus: "idle"
  },
  {
    id: "017",
    href: "/challenges/review/017-astropy-nddata-mask-propagation",
    title: {
      zh: "Astropy NDData mask 传播 None 分支审查",
      en: "Astropy NDData mask propagation None-branch review"
    },
    summary: {
      zh: "审查一个把 operand is None 改成 operand.mask is None 的补丁，它可能在 operand 本身为 None 时崩溃。",
      en: "Review an NDData mask patch that dereferences operand.mask before handling operand being None."
    },
    mode: "review",
    difficulty: "mid",
    status: "ready",
    acceptanceRate: 41.8,
    tags: ["astropy", "mask", "none-handling", "data-semantics", "swe-bench"],
    runStatus: "idle"
  },
  {
    id: "018",
    href: "/challenges/review/018-xarray-update-preserve-dask-chunks",
    title: {
      zh: "xarray update 保留 dask chunk 审查",
      en: "xarray update preserves dask chunks review"
    },
    summary: {
      zh: "审查一个用 np.asarray() 消除歧义的补丁，它会急切计算 dask DataArray 并丢失 chunk。",
      en: "Review an xarray update patch that resolves ambiguity by eagerly converting dask-backed data to NumPy."
    },
    mode: "review",
    difficulty: "senior",
    status: "ready",
    acceptanceRate: 29.6,
    tags: ["xarray", "dask", "lazy-evaluation", "performance", "swe-bench"],
    runStatus: "idle"
  },
  {
    id: "019",
    href: "/challenges/review/019-sklearn-svm-empty-support-vectors",
    title: {
      zh: "scikit-learn SVM 空 support_vectors_ 审查",
      en: "scikit-learn SVM empty support vectors review"
    },
    summary: {
      zh: "审查一个为空 support_vectors_ 返回空 csr_matrix 的补丁，它可能生成错误形状的 dual_coef_。",
      en: "Review an SVM sparse-fit patch that avoids division by zero but creates dual_coef_ with the wrong shape."
    },
    mode: "review",
    difficulty: "mid",
    status: "ready",
    acceptanceRate: 33.9,
    tags: ["scikit-learn", "svm", "sparse", "shape-invariant", "swe-bench"],
    runStatus: "idle"
  },
  {
    id: "020",
    href: "/challenges/review/020-sympy-partitions-dict-reuse",
    title: {
      zh: "SymPy partitions 复用字典审查",
      en: "SymPy partitions dictionary reuse review"
    },
    summary: {
      zh: "审查一个只在 size=False 时 copy 的补丁，它仍让 size=True 返回的分区字典被后续迭代篡改。",
      en: "Review a partitions patch that copies only one yield mode while leaving size=True dictionaries reused."
    },
    mode: "review",
    difficulty: "mid",
    status: "ready",
    acceptanceRate: 39.4,
    tags: ["sympy", "iterator", "mutation", "api-contract", "swe-bench"],
    runStatus: "idle"
  }
];
