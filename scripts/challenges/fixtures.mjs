import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

import { challengeDirectories } from "./lib.mjs";

const expectedNames = [
  "strong-zh.json",
  "strong-en.json",
  "partial.json",
  "wrong-disallowed.json",
  "keyword-stuffing-fabricated-location.json"
];
let count = 0;
const errors = [];

for (const { dir, slug } of challengeDirectories()) {
  for (const name of expectedNames) {
    const path = join(dir, "fixtures", name);
    let fixture;
    try {
      fixture = JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      errors.push(`${slug}/${name}: ${error instanceof Error ? error.message : "unreadable"}`);
      continue;
    }
    if (!fixture.draft || !fixture.expected || !Array.isArray(fixture.draft.findings)) {
      errors.push(`${slug}/${name}: invalid fixture envelope`);
    }
    count += 1;
  }
}

if (errors.length) {
  process.stderr.write(`${errors.map((error) => `error: ${error}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`validated fixture inventory: ${count}/100\n`);
  const result = spawnSync("pnpm", ["exec", "vitest", "run", "tests/evaluator/review-evaluator.test.ts", "-t", "review evaluator v2 golden fixtures"], {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "inherit"
  });
  if (result.error) {
    process.stderr.write(`error: unable to run evaluator fixtures: ${result.error.message}\n`);
    process.exitCode = 1;
  } else if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
}
