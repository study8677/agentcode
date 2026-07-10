import { writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  challengeDirectories,
  migrateDisallowed,
  migrateFinding,
  readJson,
  skillAssignments
} from "./lib.mjs";

let requiredCount = 0;
let optionalCount = 0;
let disallowedCount = 0;

for (const { dir, slug } of challengeDirectories()) {
  const metadata = readJson(join(dir, "metadata.json"));
  const skills = skillAssignments.get(slug);
  if (!skills) throw new Error(`Missing skill assignment for ${slug}`);
  writeFileSync(join(dir, "metadata.json"), `${JSON.stringify({ ...metadata, skills }, null, 2)}\n`);
  const expectedPath = join(dir, "expected-findings.json");
  const expected = readJson(expectedPath);
  const requiredFindings = expected.requiredFindings.map((finding) =>
    migrateFinding(dir, metadata, finding, expected.canMerge, true)
  );
  const optionalFindings = (expected.optionalFindings ?? []).map((finding) =>
    migrateFinding(dir, metadata, finding, expected.canMerge, false)
  );
  const disallowedConclusions = (expected.disallowedConclusions ?? []).map(migrateDisallowed);
  const migrated = {
    schemaVersion: 2,
    canMerge: expected.canMerge,
    ...(expected.mergeRationale ? { mergeRationale: expected.mergeRationale } : {}),
    requiredFindings,
    optionalFindings,
    disallowedConclusions
  };

  writeFileSync(expectedPath, `${JSON.stringify(migrated, null, 2)}\n`);
  requiredCount += requiredFindings.length;
  optionalCount += optionalFindings.length;
  disallowedCount += disallowedConclusions.length;
  process.stdout.write(`migrated ${slug}\n`);
}

process.stdout.write(`done: ${requiredCount} required, ${optionalCount} optional, ${disallowedCount} disallowed\n`);
