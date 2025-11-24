import { Prisma, TradeHistory as PrismaTradeHistory } from "@prisma/client";
import { prisma } from "../client";

/**
 * Trade history status
 */
export type TradeStatus = "open" | "close";

/**
 * Input type for creating a new trade history record
 * All monetary values are strings to maintain precision
 */
export interface CreateTradeHistoryInput {
  /** Trading pair symbol (e.g., 'ETH', 'BTC') */
  symbol: string;
  /** Trade size (base asset) */
  size: string;
  /** Trade status */
  status: TradeStatus;
  /** Open timestamp (Unix timestamp in seconds) */
  openTimestamp: bigint;
  /** Long account number */
  longAccount: number;
  /** Long position open transaction hash */
  longOpenTx?: string;
  /** Short position open transaction hash */
  shortOpenTx?: string;
  /** Long entry price */
  longEntryPrice?: string;
  /** Short entry price */
  shortEntryPrice?: string;
}

/**
 * Input type for updating trade history (closing a trade)
 * All monetary values are strings to maintain precision
 */
export interface UpdateTradeHistoryInput {
  /** Close timestamp (Unix timestamp in seconds) */
  closeTimestamp?: bigint;
  /** Long position close transaction hash */
  longCloseTx?: string;
  /** Short position close transaction hash */
  shortCloseTx?: string;
  /** Long exit price */
  longExitPrice?: string;
  /** Short exit price */
  shortExitPrice?: string;
  /** Long PnL */
  longPnl?: string;
  /** Short PnL */
  shortPnl?: string;
  /** Spread (difference between long and short PnL) */
  spread?: string;
  /** Updated status */
  status?: TradeStatus;
}

/**
 * Trade history record with string-based monetary values
 */
export interface TradeHistoryRecord {
  id: number;
  symbol: string;
  size: string;
  status: TradeStatus;
  openTimestamp: bigint;
  longAccount: number;
  longOpenTx: string | null;
  shortOpenTx: string | null;
  longEntryPrice: string | null;
  shortEntryPrice: string | null;
  closeTimestamp: bigint | null;
  longCloseTx: string | null;
  shortCloseTx: string | null;
  longExitPrice: string | null;
  shortExitPrice: string | null;
  longPnl: string | null;
  shortPnl: string | null;
  spread: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Query filters for trade history
 */
export interface TradeHistoryFilters {
  /** Filter by symbol */
  symbol?: string;
  /** Filter by status */
  status?: TradeStatus;
  /** Filter by open timestamp (greater than or equal) */
  openTimestampGte?: bigint;
  /** Filter by open timestamp (less than or equal) */
  openTimestampLte?: bigint;
}

/**
 * Query options for trade history
 */
export interface TradeHistoryQueryOptions {
  /** Maximum number of records to return */
  limit?: number;
  /** Number of records to skip */
  offset?: number;
  /** Sort order */
  orderBy?: "openTimestamp" | "closeTimestamp" | "createdAt" | "updatedAt";
  /** Sort direction */
  orderDirection?: "asc" | "desc";
}

/**
 * Database-backed repository for TradeHistory operations.
 * Handles conversion between Prisma Decimal types and string-based monetary values.
 *
 * This implementation persists all trade data to PostgreSQL via Prisma.
 */
export class TradeHistoryRepository {
  /**
   * Convert Prisma Decimal to string
   */
  private decimalToString(
    value: Prisma.Decimal | null | undefined
  ): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    return value.toString();
  }

  /**
   * Convert string to Prisma Decimal
   * Validates the string is a valid decimal number
   */
  private stringToDecimal(
    value: string | null | undefined
  ): Prisma.Decimal | null {
    if (value === null || value === undefined) {
      return null;
    }
    // Prisma.Decimal constructor accepts strings and validates them
    return new Prisma.Decimal(value);
  }

  /**
   * Convert Prisma TradeHistory to domain TradeHistoryRecord
   */
  private toDomain(record: PrismaTradeHistory): TradeHistoryRecord {
    return {
      id: record.id,
      symbol: record.symbol,
      size: this.decimalToString(record.size) ?? "0",
      status: record.status as TradeStatus,
      openTimestamp: record.openTimestamp,
      longAccount: record.longAccount,
      longOpenTx: record.longOpenTx,
      shortOpenTx: record.shortOpenTx,
      longEntryPrice: this.decimalToString(record.longEntryPrice),
      shortEntryPrice: this.decimalToString(record.shortEntryPrice),
      closeTimestamp: record.closeTimestamp,
      longCloseTx: record.longCloseTx,
      shortCloseTx: record.shortCloseTx,
      longExitPrice: this.decimalToString(record.longExitPrice),
      shortExitPrice: this.decimalToString(record.shortExitPrice),
      longPnl: this.decimalToString(record.longPnl),
      shortPnl: this.decimalToString(record.shortPnl),
      spread: this.decimalToString(record.spread),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  /**
   * Create a new trade history record
   */
  async create(input: CreateTradeHistoryInput): Promise<TradeHistoryRecord> {
    const record = await prisma.tradeHistory.create({
      data: {
        symbol: input.symbol,
        size: this.stringToDecimal(input.size)!,
        status: input.status,
        openTimestamp: input.openTimestamp,
        longAccount: input.longAccount,
        longOpenTx: input.longOpenTx ?? null,
        shortOpenTx: input.shortOpenTx ?? null,
        longEntryPrice: this.stringToDecimal(input.longEntryPrice),
        shortEntryPrice: this.stringToDecimal(input.shortEntryPrice),
      },
    });

    return this.toDomain(record);
  }

  /**
   * Find trade history by ID
   */
  async findById(id: number): Promise<TradeHistoryRecord | null> {
    const record = await prisma.tradeHistory.findUnique({
      where: { id },
    });

    return record ? this.toDomain(record) : null;
  }

  /**
   * Find trade history records with filters
   */
  async findMany(
    filters?: TradeHistoryFilters,
    options?: TradeHistoryQueryOptions
  ): Promise<TradeHistoryRecord[]> {
    const where: Prisma.TradeHistoryWhereInput = {};

    if (filters?.symbol) {
      where.symbol = filters.symbol;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (
      filters?.openTimestampGte !== undefined ||
      filters?.openTimestampLte !== undefined
    ) {
      where.openTimestamp = {};
      if (filters.openTimestampGte !== undefined) {
        where.openTimestamp.gte = filters.openTimestampGte;
      }
      if (filters.openTimestampLte !== undefined) {
        where.openTimestamp.lte = filters.openTimestampLte;
      }
    }

    const orderBy: Prisma.TradeHistoryOrderByWithRelationInput = {};
    const orderField = options?.orderBy ?? "openTimestamp";
    const orderDirection = options?.orderDirection ?? "desc";
    orderBy[orderField] = orderDirection;

    const records = await prisma.tradeHistory.findMany({
      where,
      orderBy,
      take: options?.limit,
      skip: options?.offset,
    });

    return records.map((record) => this.toDomain(record));
  }

  /**
   * Find open trades for a symbol
   */
  async findOpenTrades(symbol?: string): Promise<TradeHistoryRecord[]> {
    const filters: TradeHistoryFilters = {
      status: "open",
      ...(symbol && { symbol }),
    };

    return this.findMany(filters, {
      orderBy: "openTimestamp",
      orderDirection: "desc",
    });
  }

  /**
   * Find closed trades for a symbol
   */
  async findClosedTrades(
    symbol?: string,
    options?: TradeHistoryQueryOptions
  ): Promise<TradeHistoryRecord[]> {
    const filters: TradeHistoryFilters = {
      status: "close",
      ...(symbol && { symbol }),
    };

    return this.findMany(filters, {
      orderBy: "closeTimestamp",
      orderDirection: "desc",
      ...options,
    });
  }

  /**
   * Update trade history record
   */
  async update(
    id: number,
    input: UpdateTradeHistoryInput
  ): Promise<TradeHistoryRecord> {
    const updateData: Prisma.TradeHistoryUpdateInput = {};

    if (input.closeTimestamp !== undefined) {
      updateData.closeTimestamp = input.closeTimestamp;
    }

    if (input.longCloseTx !== undefined) {
      updateData.longCloseTx = input.longCloseTx ?? null;
    }

    if (input.shortCloseTx !== undefined) {
      updateData.shortCloseTx = input.shortCloseTx ?? null;
    }

    if (input.longExitPrice !== undefined) {
      updateData.longExitPrice = this.stringToDecimal(input.longExitPrice);
    }

    if (input.shortExitPrice !== undefined) {
      updateData.shortExitPrice = this.stringToDecimal(input.shortExitPrice);
    }

    if (input.longPnl !== undefined) {
      updateData.longPnl = this.stringToDecimal(input.longPnl);
    }

    if (input.shortPnl !== undefined) {
      updateData.shortPnl = this.stringToDecimal(input.shortPnl);
    }

    if (input.spread !== undefined) {
      updateData.spread = this.stringToDecimal(input.spread);
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    const record = await prisma.tradeHistory.update({
      where: { id },
      data: updateData,
    });

    return this.toDomain(record);
  }

  /**
   * Close a trade (update status and close fields)
   */
  async closeTrade(
    id: number,
    input: Omit<UpdateTradeHistoryInput, "status">
  ): Promise<TradeHistoryRecord> {
    return this.update(id, {
      ...input,
      status: "close",
    });
  }

  /**
   * Count trade history records matching filters
   */
  async count(filters?: TradeHistoryFilters): Promise<number> {
    const where: Prisma.TradeHistoryWhereInput = {};

    if (filters?.symbol) {
      where.symbol = filters.symbol;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (
      filters?.openTimestampGte !== undefined ||
      filters?.openTimestampLte !== undefined
    ) {
      where.openTimestamp = {};
      if (filters.openTimestampGte !== undefined) {
        where.openTimestamp.gte = filters.openTimestampGte;
      }
      if (filters.openTimestampLte !== undefined) {
        where.openTimestamp.lte = filters.openTimestampLte;
      }
    }

    return prisma.tradeHistory.count({ where });
  }

  /**
   * Delete trade history record by ID
   */
  async delete(id: number): Promise<void> {
    await prisma.tradeHistory.delete({
      where: { id },
    });
  }
}

/**
 * Singleton instance of TradeHistoryRepository
 */
export const tradeHistoryRepository = new TradeHistoryRepository();
