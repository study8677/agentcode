import path from "node:path";

import { TASK_RUN_TIMEOUT_MS } from "./types";

const PINNED_IMAGE_PATTERN = /^[a-z0-9./:_-]+@sha256:[a-f0-9]{64}$/;
const CONTAINER_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/;

export type DockerCommandInput = {
  image: string;
  workspacePath: string;
  containerName: string;
  argv: readonly string[];
  uid: number;
  gid: number;
  timeoutMs?: number;
  readOnlyMounts?: readonly {
    source: string;
    destination: string;
  }[];
};

export type DockerCommand = {
  command: "docker";
  args: string[];
  timeoutMs: number;
};

function assertSafeArgument(value: string, label: string): void {
  if (!value || value.includes("\0") || value.includes("\n") || value.includes("\r")) {
    throw new Error(`${label} contains an unsafe value.`);
  }
}

export function assertPinnedImage(image: string): void {
  if (!PINNED_IMAGE_PATTERN.test(image)) {
    throw new Error("Runner images must be pinned by sha256 digest.");
  }
}

export function buildRootlessDockerCommand(input: DockerCommandInput): DockerCommand {
  assertPinnedImage(input.image);

  if (!path.isAbsolute(input.workspacePath) || input.workspacePath.includes(",")) {
    throw new Error("Docker workspace path must be an absolute path without commas.");
  }

  if (!CONTAINER_NAME_PATTERN.test(input.containerName)) {
    throw new Error("Docker container name is invalid.");
  }

  if (!Number.isSafeInteger(input.uid) || input.uid <= 0 || !Number.isSafeInteger(input.gid) || input.gid <= 0) {
    throw new Error("Docker worker must run with a non-root uid and gid.");
  }

  if (input.argv.length === 0) {
    throw new Error("A manifest-owned command is required.");
  }

  input.argv.forEach((argument, index) => assertSafeArgument(argument, `argv[${index}]`));

  for (const mount of input.readOnlyMounts ?? []) {
    if (
      !path.isAbsolute(mount.source)
      || mount.source.includes(",")
      || !mount.destination.startsWith("/workspace/")
      || mount.destination.includes(",")
      || mount.destination.includes("..")
    ) {
      throw new Error("Additional Docker mounts must be safe read-only workspace paths.");
    }
  }

  const timeoutMs = input.timeoutMs ?? TASK_RUN_TIMEOUT_MS;

  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > TASK_RUN_TIMEOUT_MS) {
    throw new Error("Docker timeout exceeds the 120 second hard limit.");
  }

  return {
    command: "docker",
    args: [
      "run",
      "--rm",
      "--pull",
      "never",
      "--name",
      input.containerName,
      "--network",
      "none",
      "--cap-drop",
      "ALL",
      "--security-opt",
      "no-new-privileges:true",
      "--cpus",
      "1",
      "--memory",
      "512m",
      "--memory-swap",
      "512m",
      "--pids-limit",
      "128",
      "--read-only",
      "--init",
      "--stop-timeout",
      "5",
      "--user",
      `${input.uid}:${input.gid}`,
      "--workdir",
      "/workspace",
      "--env",
      "CI=1",
      "--env",
      "HOME=/tmp/home",
      "--mount",
      `type=bind,src=${input.workspacePath},dst=/workspace,readonly`,
      "--tmpfs",
      "/tmp:rw,noexec,nosuid,nodev,size=67108864,mode=1777",
      "--tmpfs",
      "/workspace/.cache:rw,noexec,nosuid,nodev,size=67108864,mode=0700",
      ...(input.readOnlyMounts ?? []).flatMap((mount) => [
        "--mount",
        `type=bind,src=${mount.source},dst=${mount.destination},readonly`
      ]),
      input.image,
      ...input.argv
    ],
    timeoutMs
  };
}
