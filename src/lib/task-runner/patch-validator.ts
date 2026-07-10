import { createHash } from "node:crypto";
import path from "node:path";

import { TaskRunnerError } from "./errors";
import { TASK_PATCH_MAX_BYTES } from "./types";

const MAX_PATCH_FILES = 20;
const MAX_PATCH_LINE_BYTES = 64 * 1024;
const BINARY_MARKERS = ["GIT binary patch", "Binary files ", "literal ", "delta "];

export type ValidatedPatch = {
  bytes: number;
  hash: string;
  paths: string[];
};

type PatchSection = {
  diffOldPath: string;
  diffNewPath: string;
  oldPath: string | null;
  newPath: string | null;
  sawOldHeader: boolean;
  sawNewHeader: boolean;
  sawHunk: boolean;
};

function invalidPatch(message: string, code: "INVALID_PATCH" | "UNSAFE_PATCH" = "INVALID_PATCH"): never {
  throw new TaskRunnerError(code, message, 422);
}

function pathMatches(pattern: string, candidate: string): boolean {
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    return candidate === prefix || candidate.startsWith(`${prefix}/`);
  }

  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -2);
    const remainder = candidate.startsWith(`${prefix}/`) ? candidate.slice(prefix.length + 1) : "";
    return Boolean(remainder) && !remainder.includes("/");
  }

  return candidate === pattern;
}

function normalizePatchPath(rawValue: string, expectedPrefix?: "a/" | "b/"): string | null {
  const value = rawValue.split("\t", 1)[0];

  if (value === "/dev/null") {
    return null;
  }

  if (
    !value
    || value.startsWith('"')
    || value.includes("\\")
    || /[\u0000-\u001f\u007f]/.test(value)
    || value.includes(" ")
  ) {
    invalidPatch("Quoted, whitespace, control-character, or backslash paths are not accepted.", "UNSAFE_PATCH");
  }

  if (expectedPrefix && !value.startsWith(expectedPrefix)) {
    invalidPatch(`Patch path must use the ${expectedPrefix} git prefix.`, "UNSAFE_PATCH");
  }

  const withoutPrefix = value.startsWith("a/") || value.startsWith("b/") ? value.slice(2) : value;
  const components = withoutPrefix.split("/");

  if (
    !withoutPrefix
    || path.posix.isAbsolute(withoutPrefix)
    || components.some((component) => component === "" || component === "." || component === "..")
    || components.some((component) => component.toLowerCase() === ".git")
    || path.posix.normalize(withoutPrefix) !== withoutPrefix
  ) {
    invalidPatch("Absolute paths, traversal, .git paths, and non-normalized paths are forbidden.", "UNSAFE_PATCH");
  }

  if (withoutPrefix === ".gitmodules") {
    invalidPatch("Submodule metadata cannot be changed.", "UNSAFE_PATCH");
  }

  return withoutPrefix;
}

function parseDiffHeader(line: string): [string, string] {
  const tokens = line.slice("diff --git ".length).split(" ");

  if (tokens.length !== 2 || !tokens[0] || !tokens[1]) {
    invalidPatch("Only unquoted canonical git diff headers are accepted.");
  }

  const oldPath = normalizePatchPath(tokens[0], "a/");
  const newPath = normalizePatchPath(tokens[1], "b/");

  if (!oldPath || !newPath) {
    invalidPatch("The diff --git header cannot use /dev/null.");
  }

  return [oldPath, newPath];
}

function finalizeSection(section: PatchSection | null): void {
  if (!section) {
    return;
  }

  if (!section.sawOldHeader || !section.sawNewHeader || !section.sawHunk) {
    invalidPatch("Each changed file must contain canonical ---, +++, and @@ headers.");
  }

  if (section.oldPath && section.oldPath !== section.diffOldPath) {
    invalidPatch("The old file header does not match the diff header.");
  }

  if (section.newPath && section.newPath !== section.diffNewPath) {
    invalidPatch("The new file header does not match the diff header.");
  }
}

export function validateUnifiedDiff(patch: string, editablePaths: readonly string[]): ValidatedPatch {
  const bytes = Buffer.byteLength(patch, "utf8");

  if (bytes > TASK_PATCH_MAX_BYTES) {
    throw new TaskRunnerError("PATCH_TOO_LARGE", "Patch exceeds the 256 KiB limit.", 413);
  }

  if (!patch.trim()) {
    invalidPatch("Patch cannot be empty.");
  }

  if (patch.includes("\0")) {
    invalidPatch("NUL bytes and binary patches are forbidden.", "UNSAFE_PATCH");
  }

  if (editablePaths.length === 0) {
    throw new Error("Task challenge must declare at least one editable path.");
  }

  const lines = patch.replace(/\r\n/g, "\n").split("\n");
  let section: PatchSection | null = null;
  let sectionCount = 0;
  const touchedPaths = new Set<string>();

  for (const line of lines) {
    if (Buffer.byteLength(line, "utf8") > MAX_PATCH_LINE_BYTES) {
      invalidPatch("Patch contains an excessively long line.", "UNSAFE_PATCH");
    }

    if (BINARY_MARKERS.some((marker) => line.startsWith(marker))) {
      invalidPatch("Binary patches are forbidden.", "UNSAFE_PATCH");
    }

    if (/^(?:new file mode|old mode|new mode)\s+(?:120000|160000)$/.test(line) || line.startsWith("Subproject commit ")) {
      invalidPatch("Symlink and submodule changes are forbidden.", "UNSAFE_PATCH");
    }

    if (/^(?:rename|copy) (?:from|to) /.test(line) || line.startsWith("diff --cc ") || line.startsWith("diff --combined ")) {
      invalidPatch("Rename, copy, and combined diffs are not accepted.", "UNSAFE_PATCH");
    }

    if (line.startsWith("diff --git ")) {
      finalizeSection(section);
      const [diffOldPath, diffNewPath] = parseDiffHeader(line);
      sectionCount += 1;

      if (sectionCount > MAX_PATCH_FILES) {
        invalidPatch(`Patch may change at most ${MAX_PATCH_FILES} files.`, "UNSAFE_PATCH");
      }

      section = {
        diffOldPath,
        diffNewPath,
        oldPath: null,
        newPath: null,
        sawOldHeader: false,
        sawNewHeader: false,
        sawHunk: false
      };
      continue;
    }

    if (!section) {
      if (line && !line.startsWith("From ") && !line.startsWith("Subject: ")) {
        invalidPatch("Patch must start with a canonical diff --git section.");
      }
      continue;
    }

    if (!section.sawHunk && line.startsWith("--- ")) {
      section.oldPath = normalizePatchPath(line.slice(4), "a/");
      section.sawOldHeader = true;
      continue;
    }

    if (!section.sawHunk && line.startsWith("+++ ")) {
      section.newPath = normalizePatchPath(line.slice(4), "b/");
      section.sawNewHeader = true;
      continue;
    }

    if (line.startsWith("@@ ")) {
      section.sawHunk = true;
    }
  }

  finalizeSection(section);

  if (!section || sectionCount === 0) {
    invalidPatch("A unified diff with at least one changed file is required.");
  }

  for (const current of lines) {
    if (current.startsWith("diff --git ")) {
      const [oldPath, newPath] = parseDiffHeader(current);
      touchedPaths.add(oldPath);
      touchedPaths.add(newPath);
    }
  }

  for (const touchedPath of touchedPaths) {
    if (!editablePaths.some((pattern) => pathMatches(pattern, touchedPath))) {
      invalidPatch(`Patch path is outside the challenge allowlist: ${touchedPath}`, "UNSAFE_PATCH");
    }
  }

  return {
    bytes,
    hash: createHash("sha256").update(patch, "utf8").digest("hex"),
    paths: [...touchedPaths].sort()
  };
}
