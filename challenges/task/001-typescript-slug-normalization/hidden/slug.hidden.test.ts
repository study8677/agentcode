import assert from "node:assert/strict";
import test from "node:test";

import { normalizeSlug } from "../src/slug.ts";

test("removes path-like punctuation", () => {
  assert.equal(normalizeSlug("../Admin/Profile"), "admin-profile");
});

test("folds common accented Latin input", () => {
  assert.equal(normalizeSlug("Crème brûlée"), "creme-brulee");
});

test("rejects input with no slug characters", () => {
  assert.throws(() => normalizeSlug("🎉 / ?"), TypeError);
});
