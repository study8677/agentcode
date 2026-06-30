# First Challenge Set

[Home](../../README_en.md)

V0 now includes **20 Review Mode challenges**. They follow the same quality bar as the first challenge: real source material, traceable links, an adapted AI diff, expected findings, and a structured rubric.

Task Mode is still a later phase. It needs a runner, starter repositories, visible tests, and hidden tests before those tasks should be presented as live practice.

## Asset Structure

Challenges are versioned repository assets, not database-only rows.

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

Each challenge should make these questions reviewable:

- Is the source real and traceable?
- Is the adapted AI patch reproducible?
- Are the expected findings and rubric inspectable?
- What engineering judgment is being trained?

## Current 20 Challenges

- [001 Can this AI fix be merged? Reviewing a SymPy Point2D regression](../../challenges/review/001-sympy-point2d-ai-patch/README.en.md)
- [002 Do not trust internal middleware headers](../../challenges/review/002-next-middleware-header-bypass/README.en.md)
- [003 Server Actions relative redirect SSRF review](../../challenges/review/003-next-server-actions-ssrf/README.en.md)
- [004 Axios baseURL absolute URL bypass review](../../challenges/review/004-axios-baseurl-absolute-url/README.en.md)
- [005 Express route pattern ReDoS review](../../challenges/review/005-path-to-regexp-redos/README.en.md)
- [006 CookieJar prototype pollution blacklist review](../../challenges/review/006-tough-cookie-prototype-pollution/README.en.md)
- [007 JWT verification without algorithm pinning review](../../challenges/review/007-jsonwebtoken-algorithm-pinning/README.en.md)
- [008 Django username newline anchor review](../../challenges/review/008-django-username-newline-anchor/README.en.md)
- [009 Django password reset token email binding review](../../challenges/review/009-django-password-reset-email-token/README.en.md)
- [010 Django admin save_as_new permission review](../../challenges/review/010-django-admin-save-as-new-permission/README.en.md)
- [011 Django readonly JSONField display review](../../challenges/review/011-django-jsonfield-readonly-display/README.en.md)
- [012 Requests redirect method chain review](../../challenges/review/012-requests-redirect-method-chain/README.en.md)
- [013 Requests urllib3 exception boundary review](../../challenges/review/013-requests-urllib3-exception-boundary/README.en.md)
- [014 pytest skipif string-condition cache review](../../challenges/review/014-pytest-skipif-cache-globals/README.en.md)
- [015 Sphinx autodoc empty __all__ review](../../challenges/review/015-sphinx-empty-all/README.en.md)
- [016 Astropy nested CompoundModel separability review](../../challenges/review/016-astropy-separability-nested-model/README.en.md)
- [017 Astropy NDData mask propagation None-branch review](../../challenges/review/017-astropy-nddata-mask-propagation/README.en.md)
- [018 xarray update preserves dask chunks review](../../challenges/review/018-xarray-update-preserve-dask-chunks/README.en.md)
- [019 scikit-learn SVM empty support vectors review](../../challenges/review/019-sklearn-svm-empty-support-vectors/README.en.md)
- [020 SymPy partitions dictionary reuse review](../../challenges/review/020-sympy-partitions-dict-reuse/README.en.md)

## Later Task Mode

Task Mode will add:

- `starter/`
- `tests/visible/`
- `tests/hidden/`
- `validator.sh`
- `solution.patch`

Until the runner exists, the live V0 set is the 20 Review Mode challenges.
