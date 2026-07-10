import { describe, expect, it } from "vitest";

import { sanitizeTaskLog } from "../../src/lib/task-runner/logs";
import { TASK_LOG_MAX_BYTES } from "../../src/lib/task-runner/types";

describe("sanitizeTaskLog", () => {
  it("redacts credentials, bearer tokens, ANSI codes, and workspace paths", () => {
    const output = sanitizeTaskLog(
      "\u001b[31mTOKEN=top-secret Bearer abc.def.ghi https://alice:password@example.test /tmp/agentcode-task-123/file\u001b[0m",
      { workspacePaths: ["/tmp/agentcode-task-123"], secrets: ["top-secret"] }
    );

    expect(output).not.toContain("top-secret");
    expect(output).not.toContain("abc.def.ghi");
    expect(output).not.toContain("alice:password");
    expect(output).not.toContain("\u001b");
    expect(output).toContain("[workspace]/file");
  });

  it("caps UTF-8 output at one MiB including the marker", () => {
    const output = sanitizeTaskLog("测".repeat(TASK_LOG_MAX_BYTES));

    expect(Buffer.byteLength(output, "utf8")).toBeLessThanOrEqual(TASK_LOG_MAX_BYTES);
    expect(output).toContain("[log truncated at 1 MiB]");
  });
});
