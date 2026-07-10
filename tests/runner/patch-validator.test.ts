import { describe, expect, it } from "vitest";

import { TaskRunnerError } from "../../src/lib/task-runner/errors";
import { validateUnifiedDiff } from "../../src/lib/task-runner/patch-validator";
import { TASK_PATCH_MAX_BYTES } from "../../src/lib/task-runner/types";
import { VALID_TASK_PATCH } from "./fixtures";

function expectPatchError(patch: string, code: string): void {
  try {
    validateUnifiedDiff(patch, ["src/slug.ts"]);
    throw new Error("Expected patch validation to fail.");
  } catch (error) {
    expect(error).toBeInstanceOf(TaskRunnerError);
    expect((error as TaskRunnerError).code).toBe(code);
  }
}

describe("validateUnifiedDiff", () => {
  it("accepts a canonical allowlisted text patch", () => {
    const result = validateUnifiedDiff(VALID_TASK_PATCH, ["src/slug.ts"]);

    expect(result.paths).toEqual(["src/slug.ts"]);
    expect(result.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.bytes).toBe(Buffer.byteLength(VALID_TASK_PATCH));
  });

  it("rejects patches larger than 256 KiB", () => {
    expectPatchError("x".repeat(TASK_PATCH_MAX_BYTES + 1), "PATCH_TOO_LARGE");
  });

  it("rejects traversal paths", () => {
    expectPatchError(`diff --git a/../../etc/passwd b/../../etc/passwd
--- a/../../etc/passwd
+++ b/../../etc/passwd
@@ -1 +1 @@
-old
+new
`, "UNSAFE_PATCH");
  });

  it("rejects paths outside the manifest allowlist", () => {
    expectPatchError(`diff --git a/tests/slug.test.ts b/tests/slug.test.ts
--- a/tests/slug.test.ts
+++ b/tests/slug.test.ts
@@ -1 +1 @@
-old
+new
`, "UNSAFE_PATCH");
  });

  it("rejects binary patches", () => {
    expectPatchError(`diff --git a/src/slug.ts b/src/slug.ts
GIT binary patch
literal 3
abc
`, "UNSAFE_PATCH");
  });

  it("rejects symlink modes", () => {
    expectPatchError(`diff --git a/src/slug.ts b/src/slug.ts
old mode 100644
new mode 120000
--- a/src/slug.ts
+++ b/src/slug.ts
@@ -1 +1 @@
-old
+target
`, "UNSAFE_PATCH");
  });

  it("rejects submodule modes", () => {
    expectPatchError(`diff --git a/src/slug.ts b/src/slug.ts
old mode 100644
new mode 160000
--- a/src/slug.ts
+++ b/src/slug.ts
@@ -1 +1 @@
-old
+Subproject commit abc
`, "UNSAFE_PATCH");
  });
});
