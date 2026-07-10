import { randomUUID } from "node:crypto";

import { getDb } from "../db";
import { TaskRepositoryUnavailableError } from "./errors";
import type {
  ClaimedTaskRun,
  CompleteTaskRunInput,
  EnqueueTaskInput,
  TaskCheckResult,
  TaskResourceUsage,
  TaskRunRecord,
  TaskRunStatus,
  TaskVerdict
} from "./types";

export interface TaskRepository {
  enqueue(input: EnqueueTaskInput): Promise<TaskRunRecord>;
  findRun(id: string): Promise<TaskRunRecord | null>;
  claimNext(workerId: string): Promise<ClaimedTaskRun | null>;
  complete(runId: string, workerId: string, input: CompleteTaskRunInput): Promise<void>;
}

type SqlClient = {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<number>;
  $transaction<T>(callback: (transaction: SqlClient) => Promise<T>): Promise<T>;
};

type SqlTaskRunRow = {
  id: string;
  submissionId: string;
  challengeSlug: string;
  challengeVersion: string;
  imageDigest: string;
  status: string;
  structuredChecks: unknown;
  logs: string;
  verdict: string | null;
  resourceUsage: unknown;
  queuedAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  patchText?: string;
  patchHash?: string;
  workerId?: string;
};

function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return value as T;
}

function fromDatabaseStatus(value: string): TaskRunStatus {
  switch (value) {
    case "QUEUED": return "queued";
    case "RUNNING": return "running";
    case "SUCCESS": return "success";
    case "FAILED": return "failed";
    default: throw new Error(`Unknown task run status: ${value}`);
  }
}

function fromDatabaseVerdict(value: string | null): TaskVerdict {
  switch (value) {
    case null: return null;
    case "ACCEPTED": return "accepted";
    case "REJECTED": return "rejected";
    case "ERROR": return "error";
    default: throw new Error(`Unknown task verdict: ${value}`);
  }
}

function mapRunRow(row: SqlTaskRunRow): TaskRunRecord {
  return {
    id: row.id,
    submissionId: row.submissionId,
    challengeSlug: row.challengeSlug,
    challengeVersion: row.challengeVersion,
    imageDigest: row.imageDigest,
    status: fromDatabaseStatus(row.status),
    checks: parseJsonValue<TaskCheckResult[]>(row.structuredChecks, []),
    logs: row.logs,
    verdict: fromDatabaseVerdict(row.verdict),
    resourceUsage: parseJsonValue<TaskResourceUsage | null>(row.resourceUsage, null),
    queuedAt: row.queuedAt,
    startedAt: row.startedAt,
    finishedAt: row.finishedAt
  };
}

function selectRunColumns(alias: string): string {
  return `
    ${alias}."id",
    ${alias}."submissionId",
    ${alias}."challengeSlug",
    ${alias}."challengeVersion",
    ${alias}."imageDigest",
    ${alias}."status"::text AS "status",
    ${alias}."structuredChecks",
    ${alias}."logs",
    ${alias}."verdict"::text AS "verdict",
    ${alias}."resourceUsage",
    ${alias}."queuedAt",
    ${alias}."startedAt",
    ${alias}."finishedAt"`;
}

export class PostgresTaskRepository implements TaskRepository {
  constructor(private readonly database: SqlClient) {}

  async enqueue(input: EnqueueTaskInput): Promise<TaskRunRecord> {
    const submissionId = randomUUID();
    const runId = randomUUID();

    try {
      return await this.database.$transaction(async (transaction) => {
        await transaction.$executeRawUnsafe(
          `INSERT INTO "TaskSubmission"
            ("id", "challengeSlug", "challengeVersion", "patchHash", "patchText", "patchBytes", "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          submissionId,
          input.challengeSlug,
          input.challengeVersion,
          input.patchHash,
          input.patch,
          input.patchBytes
        );

        const rows = await transaction.$queryRawUnsafe<SqlTaskRunRow[]>(
          `INSERT INTO "TaskRun"
            ("id", "submissionId", "challengeSlug", "challengeVersion", "imageDigest", "status", "structuredChecks", "logs", "queuedAt")
           VALUES ($1, $2, $3, $4, $5, 'QUEUED'::"RunStatus", '[]'::jsonb, '', NOW())
           RETURNING ${selectRunColumns('"TaskRun"')}`,
          runId,
          submissionId,
          input.challengeSlug,
          input.challengeVersion,
          input.imageDigest
        );

        if (!rows[0]) {
          throw new Error("Task run insert returned no row.");
        }

        return mapRunRow(rows[0]);
      });
    } catch (error) {
      throw new TaskRepositoryUnavailableError("Failed to persist the task submission and queue entry.", { cause: error });
    }
  }

  async findRun(id: string): Promise<TaskRunRecord | null> {
    try {
      const rows = await this.database.$queryRawUnsafe<SqlTaskRunRow[]>(
        `SELECT ${selectRunColumns("r")}
         FROM "TaskRun" r
         WHERE r."id" = $1
         LIMIT 1`,
        id
      );

      return rows[0] ? mapRunRow(rows[0]) : null;
    } catch (error) {
      throw new TaskRepositoryUnavailableError("Failed to read the task run.", { cause: error });
    }
  }

  async claimNext(workerId: string): Promise<ClaimedTaskRun | null> {
    try {
      const rows = await this.database.$queryRawUnsafe<SqlTaskRunRow[]>(
        `WITH candidate AS (
           SELECT r."id"
           FROM "TaskRun" r
           WHERE r."status" = 'QUEUED'::"RunStatus"
           ORDER BY r."queuedAt" ASC
           FOR UPDATE SKIP LOCKED
           LIMIT 1
         ), claimed AS (
           UPDATE "TaskRun" r
           SET "status" = 'RUNNING'::"RunStatus", "startedAt" = NOW(), "workerId" = $1
           FROM candidate
           WHERE r."id" = candidate."id"
           RETURNING r.*
         )
         SELECT ${selectRunColumns("c")}, s."patchText", s."patchHash", c."workerId"
         FROM claimed c
         JOIN "TaskSubmission" s ON s."id" = c."submissionId"`,
        workerId
      );

      const row = rows[0];

      if (!row) {
        return null;
      }

      if (!row.patchText || !row.patchHash || !row.workerId) {
        throw new Error("Claimed task queue row is incomplete.");
      }

      return {
        ...mapRunRow(row),
        patch: row.patchText,
        patchHash: row.patchHash,
        workerId: row.workerId
      };
    } catch (error) {
      throw new TaskRepositoryUnavailableError("Failed to claim the next task run.", { cause: error });
    }
  }

  async complete(runId: string, workerId: string, input: CompleteTaskRunInput): Promise<void> {
    try {
      const updated = await this.database.$executeRawUnsafe(
        `UPDATE "TaskRun"
         SET "status" = $3::"RunStatus",
             "structuredChecks" = $4::jsonb,
             "logs" = $5,
             "verdict" = $6::"TaskVerdict",
             "resourceUsage" = $7::jsonb,
             "finishedAt" = NOW()
         WHERE "id" = $1 AND "workerId" = $2 AND "status" = 'RUNNING'::"RunStatus"`,
        runId,
        workerId,
        input.status.toUpperCase(),
        JSON.stringify(input.checks),
        input.logs,
        input.verdict.toUpperCase(),
        JSON.stringify(input.resourceUsage)
      );

      if (updated !== 1) {
        throw new Error("Task run completion lost its worker lease.");
      }
    } catch (error) {
      throw new TaskRepositoryUnavailableError("Failed to complete the task run.", { cause: error });
    }
  }
}

type MemorySubmission = EnqueueTaskInput & { id: string };

export class InMemoryTaskRepository implements TaskRepository {
  private readonly submissions = new Map<string, MemorySubmission>();
  private readonly runs = new Map<string, TaskRunRecord & { workerId: string | null }>();

  async enqueue(input: EnqueueTaskInput): Promise<TaskRunRecord> {
    const submissionId = randomUUID();
    const runId = randomUUID();
    const now = new Date();
    const submission = { ...input, id: submissionId };
    const run: TaskRunRecord & { workerId: string | null } = {
      id: runId,
      submissionId,
      challengeSlug: input.challengeSlug,
      challengeVersion: input.challengeVersion,
      imageDigest: input.imageDigest,
      status: "queued",
      checks: [],
      logs: "",
      verdict: null,
      resourceUsage: null,
      queuedAt: now,
      startedAt: null,
      finishedAt: null,
      workerId: null
    };

    this.submissions.set(submissionId, submission);
    this.runs.set(runId, run);
    return { ...run };
  }

  async findRun(id: string): Promise<TaskRunRecord | null> {
    const run = this.runs.get(id);
    return run ? { ...run } : null;
  }

  async claimNext(workerId: string): Promise<ClaimedTaskRun | null> {
    const run = [...this.runs.values()]
      .filter((candidate) => candidate.status === "queued")
      .sort((left, right) => left.queuedAt.getTime() - right.queuedAt.getTime())[0];

    if (!run) {
      return null;
    }

    const submission = this.submissions.get(run.submissionId);

    if (!submission) {
      throw new Error("In-memory task submission is missing.");
    }

    run.status = "running";
    run.startedAt = new Date();
    run.workerId = workerId;

    return {
      ...run,
      patch: submission.patch,
      patchHash: submission.patchHash,
      workerId
    };
  }

  async complete(runId: string, workerId: string, input: CompleteTaskRunInput): Promise<void> {
    const run = this.runs.get(runId);

    if (!run || run.status !== "running" || run.workerId !== workerId) {
      throw new Error("In-memory task run completion lost its worker lease.");
    }

    Object.assign(run, input, { finishedAt: new Date() });
  }
}

const globalTaskRepository = globalThis as unknown as { agentCodeTaskRepository?: TaskRepository };

export function registerTaskRepository(repository: TaskRepository | undefined): void {
  globalTaskRepository.agentCodeTaskRepository = repository;
}

export function createDefaultTaskRepository(): TaskRepository {
  try {
    return new PostgresTaskRepository(getDb() as unknown as SqlClient);
  } catch (error) {
    throw new TaskRepositoryUnavailableError("PostgreSQL task queue is not configured.", { cause: error });
  }
}

export function getTaskRepository(): TaskRepository {
  if (!globalTaskRepository.agentCodeTaskRepository) {
    globalTaskRepository.agentCodeTaskRepository = createDefaultTaskRepository();
  }

  return globalTaskRepository.agentCodeTaskRepository;
}
