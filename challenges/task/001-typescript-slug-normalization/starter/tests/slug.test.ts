import assert from "node:assert/strict";
import test from "node:test";

import { normalizeSlug } from "../src/slug.ts";

test("normalizes words and punctuation", () => {
  assert.equal(normalizeSlug("  Hello,   World!  "), "hello-world");
});

test("collapses repeated separators", () => {
  assert.equal(normalizeSlug("release---candidate___two"), "release-candidate-two");
});

test("keeps ASCII digits", () => {
  assert.equal(normalizeSlug("API version 2"), "api-version-2");
});
