export const VALID_TASK_PATCH = `diff --git a/src/slug.ts b/src/slug.ts
--- a/src/slug.ts
+++ b/src/slug.ts
@@ -1,3 +1,9 @@
 export function normalizeSlug(input: string): string {
-  return input.trim().toLowerCase().replace(/\\s+/g, "-");
+  const slug = input.normalize("NFKD")
+    .replace(/[\\u0300-\\u036f]/g, "")
+    .toLowerCase()
+    .replace(/[^a-z0-9]+/g, "-")
+    .replace(/^-|-$/g, "");
+  if (!slug) throw new TypeError("slug is empty");
+  return slug;
 }
`;
