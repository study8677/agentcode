import { describe, expect, it } from "vitest";

import { buildRootlessDockerCommand } from "../../src/lib/task-runner/docker-command";

const IMAGE = "node:22@sha256:b04ce4ae4e95b522112c2e5c52f781471a5cbc3b594527bcddedee9bc48c03a0";

describe("buildRootlessDockerCommand", () => {
  it("builds argv with every required isolation limit", () => {
    const command = buildRootlessDockerCommand({
      image: IMAGE,
      workspacePath: "/tmp/agentcode-task-safe",
      containerName: "agentcode-run-1",
      argv: ["node", "--test", "tests/task.test.ts"],
      uid: 1001,
      gid: 1001
    });

    expect(command.command).toBe("docker");
    expect(command.args).toEqual(expect.arrayContaining([
      "--network", "none",
      "--cap-drop", "ALL",
      "--security-opt", "no-new-privileges:true",
      "--cpus", "1",
      "--memory", "512m",
      "--memory-swap", "512m",
      "--pids-limit", "128",
      "--read-only",
      "--user", "1001:1001",
      "--pull", "never"
    ]));
    expect(command.args.slice(-3)).toEqual(["node", "--test", "tests/task.test.ts"]);
    expect(command.timeoutMs).toBe(120_000);
  });

  it("never interprets manifest arguments through a shell", () => {
    const command = buildRootlessDockerCommand({
      image: IMAGE,
      workspacePath: "/tmp/agentcode-task-safe",
      containerName: "agentcode-run-2",
      argv: ["node", "$(touch /tmp/pwned)"],
      uid: 1001,
      gid: 1001
    });

    expect(command.args.at(-1)).toBe("$(touch /tmp/pwned)");
    expect(command.args).not.toContain("sh");
    expect(command.args).not.toContain("-c");
  });

  it("rejects mutable images, root users, and ambiguous mounts", () => {
    expect(() => buildRootlessDockerCommand({
      image: "node:22",
      workspacePath: "/tmp/workspace",
      containerName: "run-1",
      argv: ["node", "--test"],
      uid: 1001,
      gid: 1001
    })).toThrow(/pinned/);

    expect(() => buildRootlessDockerCommand({
      image: IMAGE,
      workspacePath: "/tmp/workspace,readonly",
      containerName: "run-1",
      argv: ["node", "--test"],
      uid: 1001,
      gid: 1001
    })).toThrow(/workspace/);

    expect(() => buildRootlessDockerCommand({
      image: IMAGE,
      workspacePath: "/tmp/workspace",
      containerName: "run-1",
      argv: ["node", "--test"],
      uid: 0,
      gid: 0
    })).toThrow(/non-root/);
  });
});
