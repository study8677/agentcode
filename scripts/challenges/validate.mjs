import { join } from "node:path";

import { z } from "zod";

import { challengeDirectories, normalizeText, physicalFiles, readJson } from "./lib.mjs";

const allowedSeverities = new Set(["critical", "high", "medium", "low", "check"]);
const allowedKinds = new Set(["defect", "verification", "test"]);
const broadTerms = new Set(["test", "tests", "path", "key", "value", "data", "code", "error", "fix", "issue", "测试", "路径", "数据", "错误"]);
const reviewSkills = [
  "security-boundary", "authorization", "behavior-contract", "state-semantics", "error-boundary", "performance-resource",
  "test-quality", "evidence-location", "impact-reasoning", "remediation", "false-positive-control", "concurrency",
  "compatibility", "maintainability"
];
const metadataKeys = new Set([
  "id", "order", "slug", "mode", "difficulty", "status", "title", "summary", "language", "tags", "source",
  "reviewTarget", "pr", "background", "analysis", "learningGoal", "scenario", "context", "reviewFocus", "terms",
  "behaviorChecks", "scoringHints", "skills"
]);
const expectedKeys = new Set(["schemaVersion", "canMerge", "mergeRationale", "requiredFindings", "optionalFindings", "disallowedConclusions"]);
const findingKeys = new Set([
  "id", "kind", "required", "severity", "blocksMerge", "summary", "expectedReasoning", "acceptableFix", "anchors", "criteria", "matchTerms"
]);
const criteriaKeys = new Set(["problem", "evidence", "impact", "fix", "tests"]);
const seenIds = new Set();
const seenOrders = new Set();
const seenSlugs = new Set();
const usedSkills = new Set();
const errors = [];
const warnings = [];

const localizedSchema = z.object({ zh: z.string().min(1), en: z.string().min(1) }).strict();
const sourceLinkSchema = z.object({ label: z.string().min(1), url: z.string().url() }).strict();
const metadataSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().positive(),
  slug: z.string().min(1),
  mode: z.literal("review"),
  difficulty: z.enum(["junior", "mid", "senior"]),
  status: z.enum(["ready", "draft", "needs-review"]),
  title: localizedSchema,
  summary: localizedSchema,
  language: z.string().min(1),
  tags: z.array(z.string().min(1)),
  source: z.object({
    project: z.string().min(1),
    benchmarkInstance: z.string().optional(),
    upstreamIssue: z.string().url().optional(),
    upstreamPullRequest: z.string().url().optional(),
    securityAdvisory: z.string().min(1).optional(),
    references: z.array(sourceLinkSchema)
  }).strict(),
  reviewTarget: z.object({ file: z.string().min(1), kind: z.string().min(1), note: z.string() }).strict(),
  pr: z.object({ title: z.string().min(1), author: z.string().min(1), body: z.array(z.string()) }).strict().optional(),
  background: z.array(z.string()).optional(),
  analysis: z.object({ dimension: z.string().optional(), notes: z.array(z.string()) }).strict().optional(),
  learningGoal: z.string().min(1),
  scenario: z.string().optional(),
  context: z.array(z.string()).optional(),
  reviewFocus: z.array(z.string()).optional(),
  terms: z.array(z.object({ term: z.string(), description: z.string() }).strict()),
  behaviorChecks: z.array(z.object({ input: z.string(), expected: z.string(), reviewQuestion: z.string() }).strict()),
  scoringHints: z.object({
    coreRiskTerms: z.array(z.string()),
    boundaryTerms: z.array(z.string()),
    testTerms: z.array(z.string()),
    fixTerms: z.array(z.string())
  }).strict(),
  skills: z.array(z.enum(reviewSkills)).min(2).max(4)
    .refine((items) => new Set(items).size === items.length, "skills must be unique")
}).strict();
const matchGroupsSchema = z.array(z.array(z.string().min(1)).min(1)).min(1);
const anchorSchema = z.object({
  fileName: z.string().min(1),
  startLine: z.number().int().positive(),
  endLine: z.number().int().positive(),
  lineIncludes: z.string().min(1)
}).strict();
const findingSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["defect", "verification", "test"]),
  required: z.boolean(),
  severity: z.enum(["critical", "high", "medium", "low", "check"]),
  blocksMerge: z.boolean(),
  summary: z.string().min(1),
  expectedReasoning: z.string().optional(),
  acceptableFix: z.string().optional(),
  anchors: z.array(anchorSchema).min(1),
  criteria: z.object({
    problem: matchGroupsSchema.optional(),
    evidence: matchGroupsSchema.optional(),
    impact: matchGroupsSchema.optional(),
    fix: matchGroupsSchema.optional(),
    tests: matchGroupsSchema.optional()
  }).strict(),
  matchTerms: matchGroupsSchema.optional()
}).strict();
const disallowedSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  fields: z.array(z.enum(["conclusion", "problem", "evidence", "impact", "fix", "tests"])).min(1),
  match: matchGroupsSchema,
  penalty: z.literal(10)
}).strict();
const expectedSchema = z.object({
  schemaVersion: z.literal(2),
  canMerge: z.boolean(),
  mergeRationale: z.string().optional(),
  requiredFindings: z.array(findingSchema).min(1),
  optionalFindings: z.array(findingSchema),
  disallowedConclusions: z.array(disallowedSchema)
}).strict();

function fail(slug, message) { errors.push(`${slug}: ${message}`); }
function unknownKeys(value, allowed) { return Object.keys(value).filter((key) => !allowed.has(key)); }
function validateGroups(slug, findingId, field, groups) {
  if (!Array.isArray(groups) || groups.length === 0) return fail(slug, `${findingId}.criteria.${field} must contain match groups`);
  groups.forEach((group, groupIndex) => {
    if (!Array.isArray(group) || group.length === 0 || group.some((term) => typeof term !== "string" || !term.trim())) {
      fail(slug, `${findingId}.criteria.${field}.${groupIndex} must be a non-empty string array`);
      return;
    }
    if (group.length === 1 && broadTerms.has(normalizeText(group[0]))) {
      fail(slug, `${findingId}.criteria.${field}.${groupIndex} uses an over-broad term`);
    }
  });
}

for (const { dir, slug } of challengeDirectories()) {
  const metadata = readJson(join(dir, "metadata.json"));
  const expected = readJson(join(dir, "expected-findings.json"));
  const files = new Map(physicalFiles(dir).map((file) => [file.name, file]));

  const metadataResult = metadataSchema.safeParse(metadata);
  if (!metadataResult.success) fail(slug, `metadata schema: ${z.prettifyError(metadataResult.error).replace(/\n/g, " | ")}`);
  const expectedResult = expectedSchema.safeParse(expected);
  if (!expectedResult.success) fail(slug, `expected-findings schema: ${z.prettifyError(expectedResult.error).replace(/\n/g, " | ")}`);

  unknownKeys(metadata, metadataKeys).forEach((key) => fail(slug, `unknown metadata key ${key}`));
  unknownKeys(expected, expectedKeys).forEach((key) => fail(slug, `unknown expected-findings key ${key}`));
  if (metadata.slug !== slug) fail(slug, `metadata.slug does not match directory`);
  if (metadata.mode !== "review") fail(slug, `metadata.mode must be review`);
  if (!files.has(metadata.reviewTarget?.file)) fail(slug, `reviewTarget.file is not a physical file`);
  if (seenIds.has(metadata.id)) fail(slug, `duplicate metadata id ${metadata.id}`); else seenIds.add(metadata.id);
  if (seenOrders.has(metadata.order)) fail(slug, `duplicate order ${metadata.order}`); else seenOrders.add(metadata.order);
  if (seenSlugs.has(metadata.slug)) fail(slug, `duplicate slug ${metadata.slug}`); else seenSlugs.add(metadata.slug);
  if (expected.schemaVersion !== 2) fail(slug, `schemaVersion must be 2`);
  if (typeof expected.canMerge !== "boolean") fail(slug, `canMerge must be boolean`);
  (metadata.skills ?? []).forEach((skill) => usedSkills.add(skill));

  const findingIds = new Set();
  const required = expected.requiredFindings ?? [];
  const optional = expected.optionalFindings ?? [];
  for (const [requiredValue, findings] of [[true, required], [false, optional]]) {
    for (const finding of findings) {
      unknownKeys(finding, findingKeys).forEach((key) => fail(slug, `${finding.id}: unknown key ${key}`));
      if (!finding.id || findingIds.has(finding.id)) fail(slug, `finding ids must be non-empty and unique: ${finding.id}`);
      findingIds.add(finding.id);
      if (!allowedKinds.has(finding.kind)) fail(slug, `${finding.id}: invalid kind`);
      if (!allowedSeverities.has(finding.severity)) fail(slug, `${finding.id}: invalid severity`);
      if (finding.required !== requiredValue) fail(slug, `${finding.id}: required flag contradicts collection`);
      if (typeof finding.blocksMerge !== "boolean") fail(slug, `${finding.id}: blocksMerge must be boolean`);
      if (!finding.criteria || unknownKeys(finding.criteria, criteriaKeys).length) fail(slug, `${finding.id}: invalid criteria object`);
      const expectedFields = finding.kind === "test" ? ["tests"] : ["problem", "evidence", "impact", "fix"];
      expectedFields.forEach((field) => validateGroups(slug, finding.id, field, finding.criteria?.[field]));

      if (!Array.isArray(finding.anchors) || finding.anchors.length === 0) fail(slug, `${finding.id}: at least one physical anchor is required`);
      for (const anchor of finding.anchors ?? []) {
        const file = files.get(anchor.fileName);
        if (!file) {
          fail(slug, `${finding.id}: anchor references a non-physical file`);
          continue;
        }
        const lines = file.content.split(/\r?\n/);
        if (!Number.isInteger(anchor.startLine) || !Number.isInteger(anchor.endLine) || anchor.startLine < 1 || anchor.endLine < anchor.startLine || anchor.endLine > lines.length) {
          fail(slug, `${finding.id}: anchor line range is invalid`);
          continue;
        }
        if (!lines.slice(anchor.startLine - 1, anchor.endLine).some((line) => line.includes(anchor.lineIncludes))) {
          fail(slug, `${finding.id}: lineIncludes does not match anchored content`);
        }
      }
    }
  }

  const requiredCore = required.filter((finding) => finding.kind !== "test");
  if (!requiredCore.length || requiredCore.some((finding) => !finding.anchors?.some((anchor) => /\.diff$|\.patch$|^src-/.test(anchor.fileName)))) {
    fail(slug, `every required core item needs a diff/source anchor`);
  }
  if (expected.canMerge && required.some((finding) => finding.blocksMerge)) fail(slug, `approve challenge contains a blocking required item`);
  if (!expected.canMerge && !requiredCore.some((finding) => finding.blocksMerge)) fail(slug, `request-changes challenge has no blocking core item`);

  for (const [index, rule] of (expected.disallowedConclusions ?? []).entries()) {
    if (!rule || typeof rule !== "object" || !rule.id || !Array.isArray(rule.fields) || !Array.isArray(rule.match) || rule.penalty !== 10) {
      fail(slug, `disallowedConclusions.${index} is not a structured 10-point rule`);
    }
  }

  const preSubmitText = normalizeText(JSON.stringify({ pr: metadata.pr, background: metadata.background, files: [...files.values()] }));
  for (const finding of required) {
    const summary = normalizeText(finding.summary);
    if (summary.length >= 30 && preSubmitText.includes(summary)) warnings.push(`${slug}: required summary appears verbatim in pre-submit content (${finding.id})`);
  }
}

for (const skill of reviewSkills) {
  if (!usedSkills.has(skill)) fail("catalog", `skill ${skill} is not covered by any challenge`);
}

if (warnings.length) process.stderr.write(`${warnings.map((warning) => `warning: ${warning}`).join("\n")}\n`);
if (errors.length) {
  process.stderr.write(`${errors.map((error) => `error: ${error}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`validated ${seenSlugs.size} challenges (${warnings.length} semantic warnings)\n`);
}
