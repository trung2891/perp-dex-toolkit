import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton instance.
 * Use this for all database operations.
 *
 * In production, ensure DATABASE_URL is set in environment variables.
 */
export const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

/**
 * Gracefully disconnect Prisma client on application shutdown.
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
