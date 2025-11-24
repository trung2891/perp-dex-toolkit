import { PrismaClient } from "@prisma/client";
import { DB_CONFIG } from "../config";

/**
 * Prisma client singleton instance.
 * Only initialized when DB_ENABLED=true in environment variables.
 *
 * In production, ensure DATABASE_URL is set in environment variables.
 */
let prismaInstance: PrismaClient | null = null;

/**
 * Get or create Prisma client instance
 * @throws Error if database is not enabled
 */
function getPrismaClient(): PrismaClient {
  if (!DB_CONFIG.enabled) {
    throw new Error(
      "Database is not enabled. Set DB_ENABLED=true in environment variables to use database features."
    );
  }

  if (!prismaInstance) {
    if (!DB_CONFIG.databaseUrl) {
      throw new Error(
        "DATABASE_URL is required when DB_ENABLED=true. Please set DATABASE_URL in environment variables."
      );
    }

    prismaInstance = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  }

  return prismaInstance;
}

/**
 * Export Prisma client - will throw if DB is not enabled
 * Use this for all database operations when DB is enabled.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClient();
    return client[prop as keyof PrismaClient];
  },
});

/**
 * Check if database is enabled
 */
export function isDatabaseEnabled(): boolean {
  return DB_CONFIG.enabled;
}

/**
 * Gracefully disconnect Prisma client on application shutdown.
 * Safe to call even if database is not enabled.
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
  }
}
