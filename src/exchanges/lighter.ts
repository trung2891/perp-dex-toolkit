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
  MatchingInfo,
} from "../domain/types";

import {
  SignerClient,
  OrderType,
  MarketConfig,
  ApiClient,
  OrderApi,
  MarketHelper,
  AccountApi,
  Account,
  OrderBook as LighterOrderBook,
} from "@oraichain/lighter-ts-sdk";
import type { CreateOrderParams } from "@oraichain/lighter-ts-sdk/dist/signer/wasm-signer-client";

/**
 * Lighter-specific configuration
 */
export interface LighterConfig extends ExchangeConfig {
  /** API private key */
  apiKeyPrivateKey: string;
  /** Account index */
  accountIndex: number;
  /** API key index */
  apiKeyIndex: number;
}

/**
 * Lighter exchange client
 */
export class LighterClient extends BaseExchange {
  readonly name = "lighter";

  signerClient: SignerClient;
  private apiClient: ApiClient;
  private orderApi: OrderApi;
  private accountApi: AccountApi;

  // === cache data ===
  private marketHelperCache: Map<number, MarketHelper> = new Map();
  private orderBookInfoCache: LighterOrderBook[] | null = null;

  constructor(config: LighterConfig) {
    super(config);
    this.signerClient = new SignerClient({
      url: config.baseUrl ?? "https://mainnet.zklighter.elliot.ai",
      privateKey: config.apiKeyPrivateKey,
      accountIndex: config.accountIndex,
      apiKeyIndex: config.apiKeyIndex,
    });
    this.apiClient = new ApiClient({
      host: config.baseUrl ?? "https://mainnet.zklighter.elliot.ai",
    });
    this.orderApi = new OrderApi(this.apiClient);
    this.accountApi = new AccountApi(this.apiClient);
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

  async getAccounts(): Promise<Account[]> {
    return this.accountApi.getAccount({
      by: "index",
      value: this.config.accountIndex?.toString() ?? "0",
    });
  }

  async getOrderBooksInfo(
    refresh: boolean = false
  ): Promise<LighterOrderBook[]> {
    if (this.orderBookInfoCache && !refresh) {
      return this.orderBookInfoCache;
    }

    this.orderBookInfoCache = await this.orderApi.getOrderBooks();
    return this.orderBookInfoCache;
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

    const clientOrderId = options.clientOrderId
      ? Number(options.clientOrderId)
      : Date.now();

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
    const accounts = await this.getAccounts();
    const positions = accounts[0].positions.filter(
      (position) => parseFloat(position.position) > 0
    );

    return positions.map((position) => ({
      symbol: position.symbol,
      contractId: position.market_id.toString(),
      size: position.position,
      side: position.sign === 1 ? "buy" : "sell",
      entryPrice: position.avg_entry_price,
      unrealizedPnl: position.unrealized_pnl,
      marginUsed: position.allocated_margin,
      liquidationPrice: position.liquidation_price,
    }));
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
    const exchangeStats = await this.orderApi.getExchangeStats();
    const orderBook = exchangeStats.order_book_stats.find(
      (orderBook) => orderBook.symbol === symbol
    );
    if (!orderBook) {
      throw new Error(`Order book not found for symbol: ${symbol}`);
    }
    return {
      symbol: symbol,
      lastPrice: orderBook.last_trade_price.toString(),
    };
  }

  /**
   * Get order book for a symbol
   */
  async getOrderBook(symbol: string, depth?: number): Promise<OrderBook> {
    const marketIndex = await this.resolveContractId(symbol);

    const orderBook = await this.orderApi.getOrderBookOrders(
      Number(marketIndex),
      depth ?? 100
    );
    return {
      symbol: symbol,
      contractId: marketIndex.toString(),
      bids: orderBook.bids.map((bid) => ({
        price: bid.price || "0",
        quantity: Number(bid.remaining_base_amount || "0").toString(),
      })),
      asks: orderBook.asks.map((ask) => ({
        price: ask.price || "0",
        quantity: Number(ask.remaining_base_amount || "0").toString(),
      })),
      timestamp: Date.now(),
    };
  }

  /**
   * Resolve contract ID from symbol
   */
  async resolveContractId(symbol: string): Promise<string> {
    const orderBooks = await this.getOrderBooksInfo();
    const orderBook = orderBooks.find(
      (orderBook) => orderBook.symbol === symbol
    );
    if (!orderBook) {
      throw new Error(`Order book not found for symbol: ${symbol}`);
    }
    return orderBook.market_id.toString();
  }

  /**
   * get order info from the transaction hash
   */
  async getMatchingInfoFromTransactionHash(
    symbol: string,
    transactionHash: string
  ): Promise<MatchingInfo> {
    // wait 5 seconds for the transaction to be confirmed
    const res = await this.signerClient.waitForTransaction(
      transactionHash,
      5000,
      2000
    );
    if (res.code != 200) {
      throw new Error(
        `Failed to get matching info from transaction hash: ${transactionHash}`
      );
    }

    const marketHelper = await this.getMarketHelper(
      Number(await this.resolveContractId(symbol))
    );

    const event = JSON.parse(res.event_info as any);
    const matchingInfo: MatchingInfo = {
      price: marketHelper
        .unitsToPrice(Number(event.t.p?.toString() ?? "0"))
        .toString(),
      quantity: marketHelper
        .unitsToAmount(Number(event.t.s?.toString() ?? "0"))
        .toString(),
    };
    return matchingInfo;
  }

  /**
   * Close the exchange connection
   */
  async close(): Promise<void> {
    // TODO: Clean up Lighter SDK clien`t
    await super.close();
  }
}
