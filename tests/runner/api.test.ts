import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { GET as getRun } from "../../src/app/api/task/runs/[id]/route";
import { POST as submitTask } from "../../src/app/api/task/[slug]/submit/route";
import { InMemoryTaskRepository, registerTaskRepository } from "../../src/lib/task-runner/repository";
import { VALID_TASK_PATCH } from "./fixtures";

const previousFlag = process.env.TASK_RUNNER_ENABLED;

describe("Task Runner API", () => {
  beforeEach(() => {
    process.env.TASK_RUNNER_ENABLED = "true";
    registerTaskRepository(new InMemoryTaskRepository());
  });

  afterEach(() => {
    registerTaskRepository(undefined);

    if (previousFlag === undefined) {
      delete process.env.TASK_RUNNER_ENABLED;
    } else {
      process.env.TASK_RUNNER_ENABLED = previousFlag;
    }
  });

  it("queues only the patch and returns a pollable run id", async () => {
    const submitResponse = await submitTask(new Request("http://localhost/api/task/001-typescript-slug-normalization/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ patch: VALID_TASK_PATCH })
    }), { params: Promise.resolve({ slug: "001-typescript-slug-normalization" }) });
    const submitted = await submitResponse.json() as { runId: string; status: string };

    expect(submitResponse.status).toBe(202);
    expect(submitted.status).toBe("queued");

    const pollResponse = await getRun(new Request(`http://localhost/api/task/runs/${submitted.runId}`), {
      params: Promise.resolve({ id: submitted.runId })
    });
    const polled = await pollResponse.json() as { run: { id: string; status: string; logs: string } };

    expect(pollResponse.status).toBe(200);
    expect(polled.run).toMatchObject({ id: submitted.runId, status: "queued", logs: "" });
  });

  it("rejects user-controlled fields before queueing", async () => {
    const response = await submitTask(new Request("http://localhost/api/task/001-typescript-slug-normalization/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ patch: VALID_TASK_PATCH, command: "curl example.test" })
    }), { params: Promise.resolve({ slug: "001-typescript-slug-normalization" }) });

    expect(response.status).toBe(400);
  });

  it("is hidden by default when the feature flag is absent", async () => {
    delete process.env.TASK_RUNNER_ENABLED;

    const response = await submitTask(new Request("http://localhost/api/task/001-typescript-slug-normalization/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ patch: VALID_TASK_PATCH })
    }), { params: Promise.resolve({ slug: "001-typescript-slug-normalization" }) });

    expect(response.status).toBe(404);
  });
});
