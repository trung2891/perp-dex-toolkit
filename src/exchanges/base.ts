/**
 * Base exchange interface for perpetual futures trading
 * All exchanges must implement this interface
 */

import type {
  Balance,
  ExchangeConfig,
  Order,
  OrderBook,
  OrderSide,
  OrderType,
  Position,
  Ticker,
} from "../domain/types";
import type {
  AuthenticationError,
  BusinessError,
  ExchangeError,
  NetworkError,
  RateLimitError,
} from "../domain/errors";

/**
 * Options for placing an order
 */
export interface PlaceOrderOptions {
  /** Trading pair symbol (e.g., 'ETH', 'BTC') */
  symbol: string;
  /** Contract ID (exchange-specific) */
  contractId: string;
  /** Order side */
  side: OrderSide;
  /** Order type */
  type: OrderType;
  /** Order quantity (base asset) */
  quantity: string;
  /** Limit price (required for limit orders) */
  price?: string;
  /** Trigger price (required for stop loss/take profit orders) */
  triggerPrice?: string;
  /** Client order ID (optional) */
  clientOrderId?: string;
  /** Reduce-only flag */
  reduceOnly?: boolean;
  /** Post-only flag (maker order only) */
  postOnly?: boolean;
  /** Time in force (exchange-specific) */
  timeInForce?: "GTT" | "IOC" | "FOK ";
}

/**
 * Options for canceling an order
 */
export interface CancelOrderOptions {
  /** Order ID */
  orderId: string;
  /** Trading pair symbol */
  symbol: string;
  /** Client order ID (if order was placed with one) */
  clientOrderId?: string;
}

/**
 * Options for getting order status
 */
export interface GetOrderOptions {
  /** Order ID */
  orderId: string;
  /** Trading pair symbol */
  symbol: string;
  /** Client order ID (alternative to orderId) */
  clientOrderId?: string;
}

/**
 * Options for getting positions
 */
export interface GetPositionsOptions {
  /** Filter by symbol (optional) */
  symbol?: string;
}

/**
 * Base exchange interface
 * All exchange implementations must implement this interface
 */
export interface IExchange {
  /**
   * Exchange name
   */
  readonly name: string;

  /**
   * Initialize the exchange client
   * @throws {AuthenticationError} If authentication fails
   * @throws {NetworkError} If connection fails
   */
  initialize(): Promise<void>;

  /**
   * Place an order
   * @param options Order placement options
   * @returns The placed order
   * @throws {NetworkError} If network request fails
   * @throws {AuthenticationError} If authentication fails
   * @throws {BusinessError} If order is rejected (insufficient balance, invalid params, etc.)
   * @throws {RateLimitError} If rate limit is exceeded
   */
  placeOrder(options: PlaceOrderOptions): Promise<Order>;

  /**
   * Cancel an order
   * @param options Cancel order options
   * @returns The cancelled order
   * @throws {NetworkError} If network request fails
   * @throws {AuthenticationError} If authentication fails
   * @throws {BusinessError} If order not found or already filled/cancelled
   * @throws {RateLimitError} If rate limit is exceeded
   */
  cancelOrder(options: CancelOrderOptions): Promise<Order>;

  /**
   * Cancel all open orders for a symbol
   * @param symbol Trading pair symbol
   * @returns Array of cancelled orders
   * @throws {NetworkError} If network request fails
   * @throws {AuthenticationError} If authentication fails
   * @throws {RateLimitError} If rate limit is exceeded
   */
  cancelAllOrders(symbol: string): Promise<Order[]>;

  /**
   * Get order status
   * @param options Get order options
   * @returns The order
   * @throws {NetworkError} If network request fails
   * @throws {AuthenticationError} If authentication fails
   * @throws {BusinessError} If order not found
   * @throws {RateLimitError} If rate limit is exceeded
   */
  getOrder(options: GetOrderOptions): Promise<Order>;

  /**
   * Get all open orders
   * @param symbol Optional symbol filter
   * @returns Array of open orders
   * @throws {NetworkError} If network request fails
   * @throws {AuthenticationError} If authentication fails
   * @throws {RateLimitError} If rate limit is exceeded
   */
  getOpenOrders(symbol?: string): Promise<Order[]>;

  /**
   * Get positions
   * @param options Get positions options
   * @returns Array of positions
   * @throws {NetworkError} If network request fails
   * @throws {AuthenticationError} If authentication fails
   * @throws {RateLimitError} If rate limit is exceeded
   */
  getPositions(options?: GetPositionsOptions): Promise<Position[]>;

  /**
   * Get position for a specific symbol
   * @param symbol Trading pair symbol
   * @returns The position, or null if no position exists
   * @throws {NetworkError} If network request fails
   * @throws {AuthenticationError} If authentication fails
   * @throws {RateLimitError} If rate limit is exceeded
   */
  getPosition(symbol: string): Promise<Position | null>;

  /**
   * Get account balances
   * @returns Array of balances
   * @throws {NetworkError} If network request fails
   * @throws {AuthenticationError} If authentication fails
   * @throws {RateLimitError} If rate limit is exceeded
   */
  getBalances(): Promise<Balance[]>;

  /**
   * Get balance for a specific asset
   * @param asset Asset symbol (e.g., 'USDC', 'USDT')
   * @returns The balance, or null if asset not found
   * @throws {NetworkError} If network request fails
   * @throws {AuthenticationError} If authentication fails
   * @throws {RateLimitError} If rate limit is exceeded
   */
  getBalance(asset: string): Promise<Balance | null>;

  /**
   * Get ticker (market data) for a symbol
   * @param symbol Trading pair symbol
   * @returns The ticker
   * @throws {NetworkError} If network request fails
   * @throws {BusinessError} If symbol not found
   * @throws {RateLimitError} If rate limit is exceeded
   */
  getTicker(symbol: string): Promise<Ticker>;

  /**
   * Get order book for a symbol
   * @param symbol Trading pair symbol
   * @param depth Optional depth (number of levels, default exchange-specific)
   * @returns The order book
   * @throws {NetworkError} If network request fails
   * @throws {BusinessError} If symbol not found
   * @throws {RateLimitError} If rate limit is exceeded
   */
  getOrderBook(symbol: string, depth?: number): Promise<OrderBook>;

  /**
   * Resolve contract ID from symbol
   * Some exchanges require contract IDs instead of symbols
   * @param symbol Trading pair symbol
   * @returns Contract ID or symbol if not needed
   * @throws {NetworkError} If network request fails
   * @throws {BusinessError} If symbol not found
   */
  resolveContractId(symbol: string): Promise<string>;

  /**
   * Check if exchange is connected and authenticated
   * @returns True if connected and authenticated
   */
  isConnected(): boolean;

  /**
   * Close the exchange connection
   */
  close(): Promise<void>;
}

/**
 * Abstract base exchange class
 * Provides common functionality and error handling patterns
 * Exchange implementations should extend this class
 */
export abstract class BaseExchange implements IExchange {
  protected config: ExchangeConfig;
  protected connected = false;

  constructor(config: ExchangeConfig) {
    this.config = config;
  }

  abstract readonly name: string;

  abstract initialize(): Promise<void>;
  abstract placeOrder(options: PlaceOrderOptions): Promise<Order>;
  abstract cancelOrder(options: CancelOrderOptions): Promise<Order>;
  abstract cancelAllOrders(symbol: string): Promise<Order[]>;
  abstract getOrder(options: GetOrderOptions): Promise<Order>;
  abstract getOpenOrders(symbol?: string): Promise<Order[]>;
  abstract getPositions(options?: GetPositionsOptions): Promise<Position[]>;
  abstract getBalances(): Promise<Balance[]>;
  abstract getTicker(symbol: string): Promise<Ticker>;
  abstract getOrderBook(symbol: string, depth?: number): Promise<OrderBook>;
  abstract resolveContractId(symbol: string): Promise<string>;

  /**
   * Get position for a specific symbol
   * Default implementation filters from getPositions
   */
  async getPosition(symbol: string): Promise<Position | null> {
    const positions = await this.getPositions({ symbol });
    return positions.find((p) => p.symbol === symbol) || null;
  }

  /**
   * Get balance for a specific asset
   * Default implementation filters from getBalances
   */
  async getBalance(asset: string): Promise<Balance | null> {
    const balances = await this.getBalances();
    return balances.find((b) => b.asset === asset) || null;
  }

  /**
   * Check if exchange is connected and authenticated
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Close the exchange connection
   * Default implementation just sets connected to false
   */
  async close(): Promise<void> {
    this.connected = false;
  }

  /**
   * Validate order placement options
   * Can be overridden by subclasses for exchange-specific validation
   */
  protected validatePlaceOrderOptions(options: PlaceOrderOptions): void {
    if (!options.symbol) {
      throw new Error("Symbol is required");
    }
    if (!options.quantity || parseFloat(options.quantity) <= 0) {
      throw new Error("Quantity must be greater than 0");
    }
    if (
      options.type === "limit" &&
      (!options.price || parseFloat(options.price) <= 0)
    ) {
      throw new Error(
        "Price is required for limit orders and must be greater than 0"
      );
    }
  }

  /**
   * Get current timestamp in seconds
   */
  protected getCurrentTimestamp(): number {
    return Math.floor(Date.now() / 1000);
  }
}
