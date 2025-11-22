/**
 * Domain types for perpetual futures trading
 * All monetary values use string to avoid precision loss
 */

/**
 * Order side: buy or sell
 */
export type OrderSide = "buy" | "sell";

/**
 * Order type: limit or market
 */
export type OrderType = "limit" | "market";

/**
 * Order status
 */
export type OrderStatus =
  | "pending" // Order submitted but not yet confirmed
  | "open" // Order is active on the exchange
  | "partially_filled" // Order partially executed
  | "filled" // Order fully executed
  | "cancelled" // Order cancelled
  | "rejected" // Order rejected by exchange
  | "expired"; // Order expired

/**
 * Order direction (alias for OrderSide)
 */
export type OrderDirection = OrderSide;

/**
 * Order representation
 * All amounts and prices are strings to maintain precision
 */
export interface Order {
  /** Exchange-specific order ID */
  id: string;
  /** Client order ID (optional) */
  clientOrderId?: string;
  /** Trading pair symbol (e.g., 'ETH', 'BTC') */
  symbol: string;
  /** Contract ID (exchange-specific) */
  contractId?: string;
  /** Order side */
  side: OrderSide;
  /** Order type */
  type: OrderType;
  /** Order quantity (base asset) */
  quantity: string;
  /** Limit price (required for limit orders) */
  price?: string;
  /** Order status */
  status: OrderStatus;
  /** Filled quantity */
  filledQuantity?: string;
  /** Average fill price */
  avgFillPrice?: string;
  /** Timestamp when order was created (Unix timestamp in seconds) */
  createdAt: number;
  /** Timestamp when order was updated (Unix timestamp in seconds) */
  updatedAt: number;
  /** Reduce-only flag (only reduce position, not increase) */
  reduceOnly?: boolean;
  /** Post-only flag (maker order only) */
  postOnly?: boolean;
}

/**
 * Position representation
 */
export interface Position {
  /** Trading pair symbol */
  symbol: string;
  /** Contract ID (exchange-specific) */
  contractId?: string;
  /** Position size (positive for long, negative for short) */
  size: string;
  /** Position side */
  side: OrderSide;
  /** Entry price */
  entryPrice: string;
  /** Current mark price */
  markPrice?: string;
  /** Current index price */
  indexPrice?: string;
  /** Unrealized PnL */
  unrealizedPnl: string;
  /** Realized PnL */
  realizedPnl?: string;
  /** Margin used */
  marginUsed: string;
  /** Leverage */
  leverage?: string;
  /** Liquidation price */
  liquidationPrice?: string;
  /** Funding rate (current) */
  fundingRate?: string;
  /** Next funding time (Unix timestamp in seconds) */
  nextFundingTime?: number;
}

/**
 * Balance representation
 */
export interface Balance {
  /** Asset symbol (e.g., 'USDC', 'USDT') */
  asset: string;
  /** Available balance (can be used for trading) */
  available: string;
  /** Total balance (available + locked) */
  total: string;
  /** Locked balance (in orders) */
  locked?: string;
}

/**
 * Market data (ticker)
 */
export interface Ticker {
  /** Trading pair symbol */
  symbol: string;
  /** Contract ID (exchange-specific) */
  contractId?: string;
  /** Last traded price */
  lastPrice: string;
  /** Best bid price */
  bidPrice?: string;
  /** Best ask price */
  askPrice?: string;
  /** 24h volume */
  volume24h?: string;
  /** 24h high */
  high24h?: string;
  /** 24h low */
  low24h?: string;
  /** 24h price change percentage */
  change24h?: string;
  /** Funding rate */
  fundingRate?: string;
  /** Next funding time (Unix timestamp in seconds) */
  nextFundingTime?: number;
}

/**
 * Order book entry
 */
export interface OrderBookEntry {
  /** Price level */
  price: string;
  /** Quantity at this price level */
  quantity: string;
}

/**
 * Order book snapshot
 */
export interface OrderBook {
  /** Trading pair symbol */
  symbol: string;
  /** Contract ID (exchange-specific) */
  contractId?: string;
  /** Bid side (sorted by price descending) */
  bids: OrderBookEntry[];
  /** Ask side (sorted by price ascending) */
  asks: OrderBookEntry[];
  /** Timestamp of the snapshot */
  timestamp: number;
}

/**
 * Exchange configuration
 */
export interface ExchangeConfig {
  /** Exchange name */
  name: string;
  /** API base URL */
  baseUrl?: string;
  /** WebSocket URL */
  wsUrl?: string;
  /** API key (if required) */
  apiKey?: string;
  /** API secret (if required) */
  apiSecret?: string;
  /** Additional exchange-specific config */
  [key: string]: unknown;
}
