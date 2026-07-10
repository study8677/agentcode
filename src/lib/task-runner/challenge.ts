import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { z } from "zod";

import { assertPinnedImage } from "./docker-command";

const safeRelativePathSchema = z.string().min(1).refine((value) => (
  !path.posix.isAbsolute(value)
  && !value.includes("\\")
  && !value.split("/").some((component) => component === "" || component === "." || component === "..")
), "Path must be a normalized relative POSIX path.");

const taskCheckSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,63}$/),
  kind: z.enum(["public", "hidden"]),
  argv: z.array(z.string().min(1).max(1024)).min(1).max(16)
});

export const taskChallengeManifestSchema = z.strictObject({
  schemaVersion: z.literal(1),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{0,127}$/),
  title: z.strictObject({
    zh: z.string().min(1),
    en: z.string().min(1)
  }),
  summary: z.strictObject({
    zh: z.string().min(1),
    en: z.string().min(1)
  }),
  language: z.literal("typescript"),
  runtime: z.literal("node"),
  difficulty: z.enum(["mid", "senior"]),
  status: z.literal("READY"),
  image: z.string().superRefine((value, context) => {
    try {
      assertPinnedImage(value);
    } catch {
      context.addIssue({ code: "custom", message: "Image must be pinned by sha256 digest." });
    }
  }),
  editablePaths: z.array(safeRelativePathSchema).min(1).max(20),
  starterDirectory: safeRelativePathSchema,
  hiddenDirectory: safeRelativePathSchema,
  checks: z.array(taskCheckSchema).min(1).max(8)
});

export type TaskChallengeManifest = z.infer<typeof taskChallengeManifestSchema>;

export type TaskChallenge = {
  manifest: TaskChallengeManifest;
  version: string;
  rootDirectory: string;
  starterDirectory: string;
  hiddenDirectory: string;
};

function assertUniqueCheckIds(manifest: TaskChallengeManifest): void {
  const ids = new Set<string>();

  for (const check of manifest.checks) {
    if (ids.has(check.id)) {
      throw new Error(`Duplicate task check id: ${check.id}`);
    }

    ids.add(check.id);

    if (check.argv[0] !== "node") {
      throw new Error(`Task check ${check.id} uses a non-allowlisted executable.`);
    }
  }
}

function assertDirectoryInsideChallenge(rootDirectory: string, relativeDirectory: string): string {
  const resolved = path.resolve(rootDirectory, relativeDirectory);

  if (!resolved.startsWith(`${rootDirectory}${path.sep}`)) {
    throw new Error("Task challenge directory escapes its root.");
  }

  const stat = lstatSync(resolved);

  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`Task challenge directory must be a real directory: ${relativeDirectory}`);
  }

  return resolved;
}

function walkFiles(rootDirectory: string, currentDirectory = rootDirectory): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(currentDirectory, { withFileTypes: true }).sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = path.join(currentDirectory, entry.name);
    const stat = lstatSync(absolutePath);

    if (stat.isSymbolicLink()) {
      throw new Error(`Task challenge assets cannot contain symlinks: ${absolutePath}`);
    }

    if (stat.isDirectory()) {
      files.push(...walkFiles(rootDirectory, absolutePath));
    } else if (stat.isFile()) {
      files.push(path.relative(rootDirectory, absolutePath));
    } else {
      throw new Error(`Task challenge assets must be regular files: ${absolutePath}`);
    }
  }

  return files;
}

function computeChallengeVersion(rootDirectory: string, manifestContents: string, assetDirectories: string[]): string {
  const hash = createHash("sha256");
  const parsedManifest = JSON.parse(manifestContents) as unknown;
  hash.update(JSON.stringify(parsedManifest));

  for (const assetDirectory of assetDirectories) {
    for (const relativePath of walkFiles(assetDirectory)) {
      const absolutePath = path.join(assetDirectory, relativePath);
      hash.update("\0");
      hash.update(path.relative(rootDirectory, absolutePath).split(path.sep).join("/"));
      hash.update("\0");
      hash.update(readFileSync(absolutePath));
    }
  }

  return hash.digest("hex");
}

export function getTaskChallenge(slug: string): TaskChallenge | null {
  if (!/^[a-z0-9][a-z0-9-]{0,127}$/.test(slug)) {
    return null;
  }

  const challengesRoot = path.join(process.cwd(), "challenges", "task");
  const rootDirectory = path.join(challengesRoot, slug);
  const manifestPath = path.join(rootDirectory, "manifest.json");

  if (!existsSync(manifestPath)) {
    return null;
  }

  const rootStat = lstatSync(rootDirectory);

  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) {
    throw new Error("Task challenge root must be a real directory.");
  }

  const manifestContents = readFileSync(manifestPath, "utf8");
  const manifest = taskChallengeManifestSchema.parse(JSON.parse(manifestContents) as unknown);

  if (manifest.slug !== slug) {
    throw new Error(`Task challenge directory and manifest slug disagree: ${slug}`);
  }

  assertUniqueCheckIds(manifest);
  const starterDirectory = assertDirectoryInsideChallenge(rootDirectory, manifest.starterDirectory);
  const hiddenDirectory = assertDirectoryInsideChallenge(rootDirectory, manifest.hiddenDirectory);

  return {
    manifest,
    version: computeChallengeVersion(rootDirectory, manifestContents, [starterDirectory, hiddenDirectory]),
    rootDirectory,
    starterDirectory,
    hiddenDirectory
  };
}
