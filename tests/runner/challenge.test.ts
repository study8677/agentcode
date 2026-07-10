import { describe, expect, it } from "vitest";

import { getTaskChallenge } from "../../src/lib/task-runner/challenge";

describe("Task challenge loader", () => {
  it("loads the READY Alpha challenge with a content-derived version", () => {
    const challenge = getTaskChallenge("001-typescript-slug-normalization");

    expect(challenge?.manifest.status).toBe("READY");
    expect(challenge?.manifest.editablePaths).toEqual(["src/slug.ts"]);
    expect(challenge?.manifest.image).toMatch(/@sha256:[a-f0-9]{64}$/);
    expect(challenge?.version).toMatch(/^[a-f0-9]{64}$/);
  });

  it("does not resolve unsafe or unknown slugs", () => {
    expect(getTaskChallenge("../../etc")).toBeNull();
    expect(getTaskChallenge("missing-task")).toBeNull();
  });
});
