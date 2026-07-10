import { copyFile, lstat, mkdir, mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import type { TaskChallenge } from "../src/lib/task-runner/challenge";

const WORKSPACE_PREFIX = "agentcode-task-";
const MAX_SEED_BYTES = 64 * 1024 * 1024;

async function copyTrustedTree(source: string, destination: string, state: { bytes: number }): Promise<void> {
  const sourceStat = await lstat(source);

  if (sourceStat.isSymbolicLink()) {
    throw new Error(`Challenge seed contains a symlink: ${source}`);
  }

  if (sourceStat.isDirectory()) {
    await mkdir(destination, { recursive: true, mode: 0o700 });

    for (const entry of await readdir(source)) {
      await copyTrustedTree(path.join(source, entry), path.join(destination, entry), state);
    }
    return;
  }

  if (!sourceStat.isFile()) {
    throw new Error(`Challenge seed contains a non-regular file: ${source}`);
  }

  state.bytes += sourceStat.size;

  if (state.bytes > MAX_SEED_BYTES) {
    throw new Error("Challenge seed exceeds the 64 MiB worker limit.");
  }

  await copyFile(source, destination);
}

export type TaskWorkspace = {
  root: string;
  hidden: string;
  parent: string;
};

export async function createTaskWorkspace(challenge: TaskChallenge): Promise<TaskWorkspace> {
  const parent = await mkdtemp(path.join(tmpdir(), WORKSPACE_PREFIX));
  const workspace = path.join(parent, "workspace");
  const hidden = path.join(parent, "hidden");
  const state = { bytes: 0 };

  try {
    await mkdir(workspace, { recursive: true, mode: 0o700 });

    for (const entry of await readdir(challenge.starterDirectory)) {
      await copyTrustedTree(
        path.join(challenge.starterDirectory, entry),
        path.join(workspace, entry),
        state
      );
    }

    await mkdir(path.join(workspace, ".cache"), { mode: 0o700 });
    await copyTrustedTree(challenge.hiddenDirectory, hidden, state);
    return { root: workspace, hidden, parent };
  } catch (error) {
    await rm(parent, { recursive: true, force: true });
    throw error;
  }
}

export async function removeTaskWorkspace(workspace: TaskWorkspace): Promise<void> {
  const expectedPrefix = path.join(tmpdir(), WORKSPACE_PREFIX);

  if (!workspace.parent.startsWith(expectedPrefix)) {
    throw new Error("Refusing to remove a directory outside the task workspace prefix.");
  }

  await rm(workspace.parent, { recursive: true, force: true });
}
