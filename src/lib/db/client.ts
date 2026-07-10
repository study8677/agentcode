import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  agentCodePrisma?: PrismaClient;
};

export class DatabaseUnavailableError extends Error {
  readonly code = "DATABASE_UNAVAILABLE";

  constructor(message = "Review data storage is not configured.", options?: ErrorOptions) {
    super(message, options);
    this.name = "DatabaseUnavailableError";
  }
}

export function getDb(): PrismaClient {
  if (globalForPrisma.agentCodePrisma) {
    return globalForPrisma.agentCodePrisma;
  }

  const connectionString = process.env.DATABASE_URL?.trim();

  if (!connectionString) {
    throw new DatabaseUnavailableError("DATABASE_URL is required for review persistence.");
  }

  try {
    const adapter = new PrismaPg({ connectionString });
    const client = new PrismaClient({ adapter });

    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.agentCodePrisma = client;
    }

    return client;
  } catch (error) {
    throw new DatabaseUnavailableError("Failed to initialize the PostgreSQL review data store.", { cause: error });
  }
}
