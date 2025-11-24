export { prisma, disconnectPrisma, isDatabaseEnabled } from "./client";
export type { TradeHistory } from "@prisma/client";
export * from "./repositories";

import { isDatabaseEnabled } from "./client";
import { TradeHistoryRepository } from "./repositories";

/**
 * Create a TradeHistory repository instance based on DB_ENABLED configuration.
 *
 * - If DB_ENABLED=true: returns database-backed repository
 * - If DB_ENABLED=false: returns undefined (no database operations)
 *
 * This allows the application to run with or without database persistence.
 *
 * @returns TradeHistoryRepository instance or undefined
 */
export function createTradeHistoryRepository():
  | TradeHistoryRepository
  | undefined {
  if (isDatabaseEnabled()) {
    console.log(
      "[Database] DB persistence enabled - using TradeHistoryRepository"
    );
    return new TradeHistoryRepository();
  } else {
    console.log(
      "[Database] DB persistence disabled - no trade history will be saved"
    );
    return undefined;
  }
}
