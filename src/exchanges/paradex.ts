/**
 * Paradex exchange client implementation using CCXT
 * https://www.paradex.trade/
 *
 * Paradex is a Layer 2 derivatives exchange built on Starknet
 * Docs: https://docs.paradex.trade/
 * CCXT Docs: https://docs.ccxt.com/#/
 *
 * TODO: Implement all methods using CCXT library
 */

import {
  BaseExchange,
  type CancelOrderOptions,
  type GetOrderOptions,
  type GetPositionsOptions,
  type PlaceOrderOptions,
} from "./base";
import type {
  Balance,
  ExchangeConfig,
  Order,
  OrderBook,
  Position,
  Ticker,
  MatchingInfo,
} from "../domain/types";
import { paradex } from "ccxt";

/**
 * Paradex-specific configuration
 */
export interface ParadexConfig extends ExchangeConfig {
  /** Starknet private key for signing */
  privateKey: string;
  /** Paradex account address */
  accountAddress: string;
  /** Environment: mainnet or testnet */
  environment?: "mainnet" | "testnet";
}

/**
 * Paradex exchange client using CCXT
 */
export class ParadexClient extends BaseExchange {
  readonly name = "paradex";

  private exchangeClient: paradex;

  constructor(config: ParadexConfig) {
    super(config);

    // TODO: Initialize CCXT Paradex client with proper configuration
    this.exchangeClient = new paradex({
      privateKey: config.privateKey,
      walletAddress: config.accountAddress,
    });
  }

  /**
   * Initialize the exchange client
   */
  async initialize(): Promise<void> {
    await this.exchangeClient.loadMarkets();
    this.connected = true;
  }

  /**
   * Place an order
   */
  async placeOrder(options: PlaceOrderOptions): Promise<any> {
    // resolve contract id
    let price = options.price ? Number(options.price) : undefined;
    if (options.type === "market") {
      price = undefined;
    }

    const contractId = await this.resolveContractId(options.symbol);
    return await this.exchangeClient.createOrder(
      contractId,
      options.type,
      options.side,
      Number(options.quantity),
      price,
      {
        timeInForce: options.timeInForce,
      }
    );
  }

  /**
   * Cancel an order
   */
  async cancelOrder(options: CancelOrderOptions): Promise<any> {
    return await this.exchangeClient.cancelOrder(options.orderId);
  }

  /**
   * Cancel all open orders for a symbol
   
   */
  async cancelAllOrders(symbol: string): Promise<any> {
    return await this.exchangeClient.cancelAllOrders(symbol);
  }

  /**
   * Get order status
   * TODO: Implement using CCXT fetchOrder()
   */
  async getOrder(options: GetOrderOptions): Promise<Order> {
    // TODO: Use this.exchangeClient.fetchOrder()
    // TODO: Convert CCXT order response to internal Order type
    throw new Error("Not implemented - TODO: Use CCXT to fetch order");
  }

  /**
   * Get all open orders
   * TODO: Implement using CCXT fetchOpenOrders()
   */
  async getOpenOrders(symbol?: string): Promise<Order[]> {
    // TODO: Use this.exchangeClient.fetchOpenOrders()
    // TODO: Convert CCXT order responses to internal Order types
    throw new Error("Not implemented - TODO: Use CCXT to fetch open orders");
  }

  /**
   * Get positions
   *
   */
  async getPositions(options?: GetPositionsOptions): Promise<Position[]> {
    let positions = await this.exchangeClient.fetchPositions();
    // filter positions with size != 0
    positions = positions.filter((position) => Number(position.info.size) != 0);

    return positions.map((position) => ({
      symbol: this.resolveSymbolFromContractId(position.symbol),
      size: Math.abs(Number(position.info.size)).toString(),
      side: position.side?.toUpperCase() === "LONG" ? "buy" : "sell",
      entryPrice: position.info.average_entry_price,
      unrealizedPnl: position.info.unrealized_pnl,
      marginUsed: position.collateral?.toString() ?? "0",
      liquidationPrice: position.info.liquidation_price,
    }));
  }

  /**
   * Get account balances
   * TODO: Implement using CCXT fetchBalance()
   */
  async getBalances(): Promise<Balance[]> {
    // TODO: Use this.exchangeClient.fetchBalance()
    // TODO: Convert CCXT balance response to internal Balance types
    throw new Error("Not implemented - TODO: Use CCXT to fetch balances");
  }

  /**
   * Get ticker (market data) for a symbol
   * TODO: Implement using CCXT fetchTicker()
   */
  async getTicker(symbol: string): Promise<Ticker> {
    // resolve contract id
    const contractId = await this.resolveContractId(symbol);
    const ticker = await this.exchangeClient.fetchTicker(contractId);
    if (!ticker.last) {
      throw new Error("Last price not found");
    }
    return {
      symbol: symbol,
      lastPrice: ticker.last.toString(),
    };
  }

  /**
   * Get order book for a symbol
   * TODO: Implement using CCXT fetchOrderBook()
   */
  async getOrderBook(symbol: string, depth?: number): Promise<OrderBook> {
    // TODO: Use this.exchangeClient.fetchOrderBook()
    // TODO: Convert CCXT orderbook response to internal OrderBook type
    throw new Error("Not implemented - TODO: Use CCXT to fetch order book");
  }

  /**
   * Resolve contract ID from symbol
   * TODO: Implement using CCXT market lookup
   */
  async resolveContractId(symbol: string): Promise<string> {
    return symbol + "/USD:USDC";
  }

  resolveSymbolFromContractId(contractId: string): string {
    return contractId.split("/")[0];
  }

  /**
   * Get matching info from transaction hash
   * TODO: Implement using CCXT or Starknet RPC
   */
  async getMatchingInfoFromTransactionHash(
    symbol: string,
    transactionHash: string
  ): Promise<MatchingInfo> {
    // TODO: Implement transaction parsing (may need Starknet RPC if not in CCXT)
    throw new Error(
      "Not implemented - TODO: Implement transaction hash parsing"
    );
  }

  /**
   * Close the exchange connection
   * TODO: Implement cleanup
   */
  async close(): Promise<void> {
    // TODO: Close CCXT client if needed
    await super.close();
  }
}
