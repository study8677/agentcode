import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const reviewRoot = join(repoRoot, "challenges", "review");
export const hiddenAssetFiles = new Set([
  "expected-findings.json",
  "rubric.md",
  "metadata.json",
  "README.zh.md",
  "README.en.md"
]);

const stopWords = new Set([
  "about", "after", "again", "also", "because", "before", "being", "change", "correct", "does", "from",
  "have", "into", "needed", "only", "other", "patch", "should", "still", "than", "that", "their", "there",
  "these", "this", "through", "when", "where", "which", "while", "with", "without", "would", "test", "tests",
  "测试", "补丁", "需要", "应该", "不能", "没有", "这个", "因为", "仍然", "问题", "行为", "修复"
]);
const broadSingletonTerms = new Set([
  "test", "tests", "path", "key", "value", "data", "code", "error", "fix", "issue", "测试", "路径", "数据", "错误"
]);
const anchorOverrides = new Map(Object.entries({
  "001-sympy-point2d-ai-patch:imaginary-coordinate-regression": ["ai-pr.diff", 12],
  "003-next-server-actions-ssrf:host-header-ssrf": ["ai-pr.diff", 30],
  "004-axios-baseurl-absolute-url:absolute-url-still-bypasses-baseurl": ["ai-pr.diff", 11],
  "008-django-username-newline-anchor:z-anchor-matches-absolute-end": ["ai-pr.diff", 10],
  "008-django-username-newline-anchor:valid-usernames-unaffected": ["ai-pr.diff", 10],
  "009-django-password-reset-email-token:email-not-bound-to-reset-token": ["ai-pr.diff", 4],
  "010-django-admin-save-as-new-permission:save-as-new-requires-add-permission": ["ai-pr.diff", 4],
  "012-requests-redirect-method-chain:redirect-chain-uses-original-method": ["ai-pr.diff", 21],
  "013-requests-urllib3-exception-boundary:closedpoolerror-was-genuinely-leaking": ["ai-pr.diff", 3],
  "013-requests-urllib3-exception-boundary:new-except-placement-is-safe": ["ai-pr.diff", 5],
  "014-pytest-skipif-cache-globals:cache-key-misses-globals": ["ai-pr.diff", 32],
  "015-sphinx-empty-all:implicit-path-only-when-all-absent": ["ai-pr.diff", 12],
  "015-sphinx-empty-all:empty-all-documents-no-members": ["ai-pr.diff", 12],
  "017-astropy-nddata-mask-propagation:reintroduces-none-mask-crash": ["ai-pr.diff", 14],
  "018-xarray-update-preserve-dask-chunks:dask-data-eagerly-materialized": ["ai-pr.diff", 6],
  "019-sklearn-svm-empty-support-vectors:root-cause-is-zero-step-arange": ["ai-pr.diff", 19],
  "019-sklearn-svm-empty-support-vectors:normal-path-unchanged": ["ai-pr.diff", 27],
  "020-sympy-partitions-dict-reuse:size-true-still-reuses-dicts": ["ai-pr.diff", 4]
}));

export const skillAssignments = new Map(Object.entries({
  "001-sympy-point2d-ai-patch": ["behavior-contract", "impact-reasoning", "test-quality", "remediation"],
  "002-next-middleware-header-bypass": ["security-boundary", "authorization", "evidence-location", "test-quality"],
  "003-next-server-actions-ssrf": ["security-boundary", "evidence-location", "impact-reasoning", "test-quality"],
  "004-axios-baseurl-absolute-url": ["security-boundary", "behavior-contract", "remediation", "test-quality"],
  "005-path-to-regexp-redos": ["performance-resource", "security-boundary", "test-quality", "remediation"],
  "006-tough-cookie-prototype-pollution": ["security-boundary", "state-semantics", "test-quality", "remediation"],
  "007-jsonwebtoken-algorithm-pinning": ["security-boundary", "authorization", "state-semantics", "test-quality"],
  "008-django-username-newline-anchor": ["behavior-contract", "false-positive-control", "test-quality", "evidence-location"],
  "009-django-password-reset-email-token": ["security-boundary", "authorization", "state-semantics", "test-quality"],
  "010-django-admin-save-as-new-permission": ["authorization", "behavior-contract", "test-quality", "impact-reasoning"],
  "011-django-jsonfield-readonly-display": ["false-positive-control", "error-boundary", "behavior-contract", "test-quality"],
  "012-requests-redirect-method-chain": ["state-semantics", "behavior-contract", "test-quality", "impact-reasoning"],
  "013-requests-urllib3-exception-boundary": ["error-boundary", "false-positive-control", "test-quality", "evidence-location"],
  "014-pytest-skipif-cache-globals": ["state-semantics", "compatibility", "test-quality", "maintainability"],
  "015-sphinx-empty-all": ["behavior-contract", "compatibility", "false-positive-control", "test-quality"],
  "016-astropy-separability-nested-model": ["behavior-contract", "state-semantics", "test-quality", "impact-reasoning"],
  "017-astropy-nddata-mask-propagation": ["state-semantics", "error-boundary", "test-quality", "remediation"],
  "018-xarray-update-preserve-dask-chunks": ["performance-resource", "behavior-contract", "test-quality", "impact-reasoning"],
  "019-sklearn-svm-empty-support-vectors": ["error-boundary", "false-positive-control", "test-quality", "maintainability"],
  "020-sympy-partitions-dict-reuse": ["state-semantics", "behavior-contract", "compatibility", "concurrency"]
}));

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function challengeDirectories() {
  return readdirSync(reviewRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ slug: entry.name, dir: join(reviewRoot, entry.name) }))
    .filter(({ dir }) => {
      try {
        readFileSync(join(dir, "metadata.json"));
        return true;
      } catch {
        return false;
      }
    })
    .sort((first, second) => first.slug.localeCompare(second.slug));
}

export function physicalFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !hiddenAssetFiles.has(entry.name))
    .map((entry) => ({
      name: entry.name,
      content: readFileSync(join(dir, entry.name), "utf8")
    }))
    .sort((first, second) => first.name.localeCompare(second.name));
}

export function normalizeText(value) {
  return String(value ?? "").normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

export function classifyKind(finding, canMerge) {
  if (["defect", "verification", "test"].includes(finding.kind)) return finding.kind;
  const searchable = normalizeText(`${finding.id} ${finding.summary}`);
  if (/test|测试|coverage|覆盖/.test(searchable)) return "test";
  if (canMerge || finding.severity === "check") return "verification";
  return "defect";
}

function meaningfulTokens(value) {
  const normalized = normalizeText(value);
  const english = normalized.match(/[a-z_][a-z0-9_.()-]{3,}/g) ?? [];
  const chinese = normalized.match(/[\p{Script=Han}]{2,8}/gu) ?? [];
  return [...new Set([...english, ...chinese])]
    .map((token) => token.replace(/^[.(]+|[.)]+$/g, ""))
    .filter((token) => token.length >= 3 && !stopWords.has(token))
    .sort((first, second) => second.length - first.length);
}

export function phraseCriteria(value, fallback = []) {
  const tokens = meaningfulTokens(value).slice(0, 5);
  if (tokens.length >= 2) return [[tokens[0], tokens[1]]];
  if (tokens.length === 1) return [[tokens[0]]];
  return fallback.length ? fallback : [];
}

function safeGroups(groups) {
  const filtered = groups.filter((group) => !(group.length === 1 && broadSingletonTerms.has(normalizeText(group[0]))));
  return filtered.length ? filtered : groups.length ? [groups.find((group) => group.length > 1) ?? groups[0]] : [];
}

function lineScore(line, tokens, kind, testSection) {
  const normalized = normalizeText(line);
  if (!normalized) return -1;
  let score = tokens.reduce((total, token) => total + (normalized.includes(token) ? Math.min(token.length, 12) : 0), 0);
  if (kind === "test" && testSection) score += 40;
  if (kind !== "test" && testSection) score -= 60;
  if (kind === "test" && /test|spec|assert|测试/.test(normalized)) score += 12;
  if (/^[+\-](?![+\-])/.test(line)) score += 8;
  if (/^[+\-](?![+\-])\s*(if|elif|else|return|raise|yield|const|let|var|except|[a-z_][\w.]*\s*=)/i.test(line)) score += 8;
  if (/^[+\-]\s*(#|\/\/|\/\*)/.test(line)) score -= 8;
  if (/^@@/.test(line)) score -= 10;
  return score;
}

export function chooseAnchor(dir, metadata, finding, kind) {
  const files = physicalFiles(dir);
  const override = anchorOverrides.get(`${metadata.slug}:${finding.id}`);
  if (override) {
    const [fileName, lineNumber] = override;
    const file = files.find((candidate) => candidate.name === fileName);
    const line = file?.content.split(/\r?\n/)[lineNumber - 1];
    if (!file || !line?.trim()) throw new Error(`Stale anchor override for ${metadata.slug}/${finding.id}`);
    return {
      fileName,
      startLine: lineNumber,
      endLine: lineNumber,
      lineIncludes: line.trim().slice(0, 160)
    };
  }
  const preferred = files.find((file) => file.name === metadata.reviewTarget.file);
  const ordered = preferred ? [preferred, ...files.filter((file) => file !== preferred)] : files;
  const tokens = meaningfulTokens([
    finding.id,
    finding.summary,
    finding.expectedReasoning,
    finding.acceptableFix,
    ...(finding.matchTerms ?? []).flat()
  ].join(" ")).slice(0, 24);
  let best = null;

  for (const file of ordered) {
    let testSection = false;
    file.content.split(/\r?\n/).forEach((line, index) => {
      const header = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
      if (header) testSection = /(^|[/_.-])(test|tests|testing|spec)([/_.-]|$)/i.test(header[2]);
      const score = lineScore(line, tokens, kind, testSection) + (file === preferred ? 50 : 0);
      if (!best || score > best.score) best = { file, line, lineNumber: index + 1, score };
    });
  }

  if (!best || !best.line.trim()) {
    throw new Error(`No reviewable anchor found for ${metadata.slug}/${finding.id}`);
  }

  return {
    fileName: best.file.name,
    startLine: best.lineNumber,
    endLine: best.lineNumber,
    lineIncludes: best.line.trim().slice(0, 160)
  };
}

export function migrateFinding(dir, metadata, finding, canMerge, required) {
  const kind = classifyKind(finding, canMerge);
  const legacyTerms = Array.isArray(finding.matchTerms) ? finding.matchTerms : [];
  const problemCriteria = safeGroups(legacyTerms.length ? legacyTerms : phraseCriteria(finding.summary));
  const evidenceCriteria = phraseCriteria(finding.expectedReasoning, problemCriteria.slice(0, 1));
  const impactCriteria = phraseCriteria(finding.expectedReasoning, problemCriteria.slice(-1));
  const fixCriteria = phraseCriteria(finding.acceptableFix, problemCriteria.slice(0, 1));
  const criteria = kind === "test"
    ? { tests: problemCriteria }
    : {
        problem: problemCriteria,
        evidence: evidenceCriteria,
        impact: impactCriteria,
        fix: fixCriteria
      };

  return {
    id: finding.id,
    kind,
    required,
    severity: finding.severity === "blocking" ? "critical" : finding.severity,
    blocksMerge: finding.blocksMerge ?? (kind === "defect" && !canMerge),
    summary: finding.summary,
    ...(finding.expectedReasoning ? { expectedReasoning: finding.expectedReasoning } : {}),
    ...(finding.acceptableFix ? { acceptableFix: finding.acceptableFix } : {}),
    anchors: [chooseAnchor(dir, metadata, finding, kind)],
    criteria,
    // Kept for the current reveal UI and for backwards-compatible consumers.
    ...(legacyTerms.length ? { matchTerms: legacyTerms } : {})
  };
}

export function migrateDisallowed(value, index) {
  if (typeof value !== "string") {
    return {
      ...value,
      fields: ["conclusion"],
      penalty: 10
    };
  }
  return {
    id: `disallowed-${String(index + 1).padStart(2, "0")}`,
    description: value,
    fields: ["conclusion"],
    match: phraseCriteria(value, [[value]]),
    penalty: 10
  };
}

export function formatOrderList(orders) {
  return orders.map((order) => String(order).padStart(3, "0")).join("、");
}
