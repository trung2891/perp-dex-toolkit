/**
 * Lighter exchange client implementation
 * https://lighter.xyz/
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
} from "../domain/types";

import {
  SignerClient,
  OrderType,
  MarketConfig,
  ApiClient,
  OrderApi,
  MarketHelper,
} from "@oraichain/lighter-ts-sdk";
import type { CreateOrderParams } from "@oraichain/lighter-ts-sdk/dist/signer/wasm-signer-client";

/**
 * Lighter-specific configuration
 */
export interface LighterConfig extends ExchangeConfig {
  /** API private key */
  apiKeyPrivateKey?: string;
  /** Account index */
  accountIndex?: number;
  /** API key index */
  apiKeyIndex?: number;
}

/**
 * Lighter exchange client
 */
export class LighterClient extends BaseExchange {
  readonly name = "lighter";

  private signerClient: SignerClient;
  private apiClient: ApiClient;
  private orderApi: OrderApi;

  // cache market config
  private marketHelperCache: Map<number, MarketHelper> = new Map();

  constructor(config: LighterConfig) {
    super(config);
    this.signerClient = new SignerClient({
      url: config.baseUrl ?? "https://mainnet.zklighter.elliot.ai",
      privateKey: config.apiKeyPrivateKey ?? "",
      accountIndex: config.accountIndex ?? 0,
      apiKeyIndex: config.apiKeyIndex ?? 0,
    });
    this.apiClient = new ApiClient({
      host: config.baseUrl ?? "https://mainnet.zklighter.elliot.ai",
    });
    this.orderApi = new OrderApi(this.apiClient);
  }

  // === Private methods ===
  private getTimeInForce(timeInForce: string): number {
    switch (timeInForce) {
      case "GTT":
        return SignerClient.ORDER_TIME_IN_FORCE_GOOD_TILL_TIME;
      case "IOC":
        return SignerClient.ORDER_TIME_IN_FORCE_IMMEDIATE_OR_CANCEL;
      case "FOK":
        return SignerClient.ORDER_TIME_IN_FORCE_FILL_OR_KILL;
      default:
        throw new Error(`Invalid time in force: ${timeInForce}`);
    }
  }
  // === Public methods ===

  /**
   * Initialize the exchange client
   */
  async initialize(): Promise<void> {
    await this.signerClient.initialize();
    await this.signerClient.ensureWasmClient();
    this.connected = true;
  }

  async getMarketHelper(marketIndex: number): Promise<MarketHelper> {
    let marketHelper = this.marketHelperCache.get(marketIndex);
    if (marketHelper) {
      return marketHelper;
    }

    marketHelper = new MarketHelper(marketIndex, this.orderApi);
    await marketHelper.initialize();
    this.marketHelperCache.set(marketIndex, marketHelper);
    return marketHelper;
  }

  /**
   * Place an order
   */
  async placeOrder(options: PlaceOrderOptions): Promise<Order> {
    // TODO: Implement order placement

    const clientOrderId = Date.now();
    const marketHelper = await this.getMarketHelper(Number(options.contractId));

    const orderPrams: CreateOrderParams = {
      marketIndex: Number(options.contractId),
      clientOrderIndex: clientOrderId,
      baseAmount: marketHelper.amountToUnits(Number(options.quantity)),
      price: marketHelper.priceToUnits(Number(options.price)),
      isAsk: options.side === "buy" ? false : true,
      orderType: options.type === "limit" ? OrderType.LIMIT : OrderType.MARKET,
      timeInForce: this.getTimeInForce(options.timeInForce ?? "GTT"),
      reduceOnly: options.reduceOnly ? true : false,
      triggerPrice: options.triggerPrice ? Number(options.triggerPrice) : 0,
      orderExpiry: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
    };

    // try to place the order
    try {
      const order = await this.signerClient.createOrder(orderPrams);
      return order as any;
    } catch (error) {
      throw new Error(`Failed to place order: ${error}`);
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(options: CancelOrderOptions): Promise<Order> {
    // TODO: Implement order cancellation
    throw new Error("Not implemented");
  }

  /**
   * Cancel all open orders for a symbol
   */
  async cancelAllOrders(symbol: string): Promise<Order[]> {
    // TODO: Implement cancel all orders
    throw new Error("Not implemented");
  }

  /**
   * Get order status
   */
  async getOrder(options: GetOrderOptions): Promise<Order> {
    // TODO: Implement get order
    throw new Error("Not implemented");
  }

  /**
   * Get all open orders
   */
  async getOpenOrders(symbol?: string): Promise<Order[]> {
    // TODO: Implement get open orders
    throw new Error("Not implemented");
  }

  /**
   * Get positions
   */
  async getPositions(options?: GetPositionsOptions): Promise<Position[]> {
    // TODO: Implement get positions
    throw new Error("Not implemented");
  }

  /**
   * Get account balances
   */
  async getBalances(): Promise<Balance[]> {
    // TODO: Implement get balances
    throw new Error("Not implemented");
  }

  /**
   * Get ticker (market data) for a symbol
   */
  async getTicker(symbol: string): Promise<Ticker> {
    // TODO: Implement get ticker
    throw new Error("Not implemented");
  }

  /**
   * Get order book for a symbol
   */
  async getOrderBook(symbol: string, depth?: number): Promise<OrderBook> {
    // TODO: Implement get order book
    throw new Error("Not implemented");
  }

  /**
   * Resolve contract ID from symbol
   */
  async resolveContractId(symbol: string): Promise<string> {
    // TODO: Implement contract ID resolution
    throw new Error("Not implemented");
  }

  /**
   * Close the exchange connection
   */
  async close(): Promise<void> {
    // TODO: Clean up Lighter SDK client
    await super.close();
  }
}
