import { IExchange } from "../../exchanges/base";
import type { Order, OrderSide, Position } from "../../domain/types";
import { randomBetween, randomIntegerBetween, sleep } from "../../helpers";

/**
 * Configuration for hedge strategy randomization
 */
export interface HedgeConfig {
  /** Minimum order size in USD */
  minSizeUSD: number;
  /** Maximum order size in USD */
  maxSizeUSD: number;
  /** Minimum sleep time between orders in milliseconds */
  minSleepBetweenOrdersMs: number;
  /** Maximum sleep time between orders in milliseconds */
  maxSleepBetweenOrdersMs: number;
  /** Minimum time to keep positions open in milliseconds */
  minHoldTimeMs: number;
  /** Maximum time to keep positions open in milliseconds */
  maxHoldTimeMs: number;
  /** Slippage percentage */
  slippage: number;
}

/**
 * Default hedge configuration
 */
const DEFAULT_HEDGE_CONFIG: HedgeConfig = {
  minSizeUSD: 100,
  maxSizeUSD: 1000,
  minSleepBetweenOrdersMs: 1000,
  maxSleepBetweenOrdersMs: 5000,
  minHoldTimeMs: 30000,
  maxHoldTimeMs: 300000, // 5 minutes
  slippage: 0.02,
};

/**
 * Hedge Manager for delta-neutral trading strategy
 * Places long and short positions on two different exchanges
 */
export class HedgeManager {
  private config: HedgeConfig;
  private isRunning = false;

  constructor(
    private readonly firstExchange: IExchange,
    private readonly secondExchange: IExchange,
    config?: Partial<HedgeConfig>
  ) {
    this.config = { ...DEFAULT_HEDGE_CONFIG, ...config };
  }

  /**
   * Initialize both exchanges
   */
  async initialize(): Promise<void> {
    if (!this.firstExchange.isConnected()) {
      await this.firstExchange.initialize();
    }
    if (!this.secondExchange.isConnected()) {
      await this.secondExchange.initialize();
    }
  }

  /**
   * Calculate quantity from USD size using current price
   */
  private async calculateQuantityFromUSD(
    symbol: string,
    sizeUSD: number,
    lastPrice: number
  ): Promise<string> {
    if (lastPrice <= 0) {
      throw new Error(`Invalid price for ${symbol}: ${lastPrice}`);
    }
    // Calculate quantity with some precision (6 decimal places)
    const quantity = sizeUSD / lastPrice;
    return quantity.toFixed(6);
  }

  private calculatePriceWithSlippage(
    price: number,
    slippage: number,
    side: OrderSide
  ): number {
    if (side === "buy") {
      return price * (1 + slippage);
    } else {
      return price * (1 - slippage);
    }
  }

  /**
   * Place market orders on both exchanges (long on first, short on second)
   * @param symbol Trading pair symbol
   * @param sizeUSD Order size in USD
   * @returns Array of placed orders [longOrder, shortOrder]
   */
  async placeMarketOrder(
    symbol: string,
    sizeUSD: number,
    firstSide: OrderSide,
    secondSide: OrderSide
  ): Promise<[Order, Order]> {
    if (sizeUSD <= 0) {
      throw new Error("sizeUSD must be greater than 0");
    }

    // Resolve contract IDs for both exchanges
    const firstContractId = await this.firstExchange.resolveContractId(symbol);
    const secondContractId =
      await this.secondExchange.resolveContractId(symbol);

    // Calculate quantities from USD size, same for both exchanges
    const fistTicker = await this.firstExchange.getTicker(symbol);
    const secondTicker = await this.secondExchange.getTicker(symbol);
    const quantity = await this.calculateQuantityFromUSD(
      symbol,
      sizeUSD,
      parseFloat(fistTicker.lastPrice)
    );
    const firstPrice = this.calculatePriceWithSlippage(
      parseFloat(fistTicker.lastPrice),
      this.config.slippage,
      firstSide
    );
    const secondPrice = this.calculatePriceWithSlippage(
      parseFloat(secondTicker.lastPrice),
      this.config.slippage,
      secondSide
    );

    // Place long order on first exchange
    const [longOrder, shortOrder] = await Promise.all([
      this.firstExchange.placeOrder({
        symbol,
        contractId: firstContractId,
        side: "buy",
        type: "market",
        quantity: quantity,
        price: firstPrice.toString(),
        timeInForce: "IOC",
      }),
      this.secondExchange.placeOrder({
        symbol,
        contractId: secondContractId,
        side: "sell",
        type: "market",
        quantity: quantity,
        price: secondPrice.toString(),
        timeInForce: "IOC",
      }),
    ]);
    // console.log({ longOrder, shortOrder });

    // TODO: Replace with structured logging (pino/winston)
    console.log(
      `[HedgeManager] Placed delta-neutral orders: ${quantity} ${symbol} on ${this.firstExchange.name} and ${this.secondExchange.name}`
    );

    return [longOrder, shortOrder];
  }

  /**
   * Close a position on an exchange
   * @param exchange Exchange to close position on
   * @param position Position to close
   * @returns The closed order
   */
  private async closePosition(
    exchange: IExchange,
    position: Position
  ): Promise<Order> {
    const contractId =
      position.contractId ||
      (await exchange.resolveContractId(position.symbol));
    const side = position.side === "buy" ? "sell" : "buy";
    const ticker = await exchange.getTicker(position.symbol);
    const price = this.calculatePriceWithSlippage(
      parseFloat(ticker.lastPrice),
      this.config.slippage,
      side
    );
    return exchange.placeOrder({
      symbol: position.symbol,
      contractId: contractId,
      side: side,
      type: "market",
      quantity: position.size,
      price: price.toString(),
      timeInForce: "IOC",
      reduceOnly: true,
    });
  }

  /**
   * Close positions on both exchanges for a symbol
   * @param symbol Trading pair symbol to close positions for
   * @returns The closed orders
   */
  async closePositions(symbol: string): Promise<boolean> {
    // retry 5 times to close positions

    for (let i = 0; i < 5; i++) {
      try {
        // Get positions from both exchanges
        const firstPosition = await this.firstExchange.getPosition(symbol);
        const secondPosition = await this.secondExchange.getPosition(symbol);

        const closePromises: Promise<Order>[] = [];

        // Close first exchange position if exists
        if (firstPosition && parseFloat(firstPosition.size) > 0) {
          closePromises.push(
            this.closePosition(this.firstExchange, firstPosition)
          );
        }

        // Close second exchange position if exists
        if (secondPosition && parseFloat(secondPosition.size) > 0) {
          closePromises.push(
            this.closePosition(this.secondExchange, secondPosition)
          );
        }

        if (closePromises.length === 0) {
          return true;
        }

        const closedOrders = await Promise.all(closePromises);
        console.log(
          `[HedgeManager] Closed positions for ${symbol} on both exchanges`
        );
      } catch (error) {
        console.error(`[HedgeManager] Error closing positions:`, error);
      }
      await sleep(1000);
    }

    // check if all positions are closed
    const firstPosition = await this.firstExchange.getPosition(symbol);
    const secondPosition = await this.secondExchange.getPosition(symbol);
    if (firstPosition && parseFloat(firstPosition.size) > 0) {
      return false;
    }
    if (secondPosition && parseFloat(secondPosition.size) > 0) {
      return false;
    }
    return true;
  }

  /**
   * Control worker run with randomization
   * - Random order size
   * - Random sleep between orders
   * - Random time to keep positions before closing
   * Runs forever in a loop until stopped
   * @param symbols Trading pair symbols to trade
   */
  async run(symbols: string[]): Promise<void> {
    if (this.isRunning) {
      throw new Error("HedgeManager is already running");
    }

    this.isRunning = true;

    try {
      while (this.isRunning) {
        try {
          // Check for interrupt before starting cycle
          if (!this.isRunning) {
            break;
          }
          // randomize the symbol
          const symbol = symbols[randomIntegerBetween(0, symbols.length - 1)];

          // Generate random order size
          const randomSizeUSD = randomBetween(
            this.config.minSizeUSD,
            this.config.maxSizeUSD
          );

          console.log(
            `[HedgeManager] Starting hedge cycle for ${symbol} with size: $${randomSizeUSD.toFixed(2)}`
          );

          // ensure positions are closed
          let positionsClosed = await this.closePositions(symbol);
          if (!positionsClosed) {
            console.error(
              `[HedgeManager] Failed to close positions for ${symbol}`
            );
            continue;
          }

          // randomize the side of the order
          const { firstSide, secondSide } =
            randomIntegerBetween(1, 2) === 1
              ? { firstSide: "buy", secondSide: "sell" }
              : { firstSide: "sell", secondSide: "buy" };

          // Place market orders on both exchanges (long on first, short on second)
          await this.placeMarketOrder(
            symbol,
            randomSizeUSD,
            firstSide as OrderSide,
            secondSide as OrderSide
          );

          // Random time to keep positions open
          const holdTime = randomBetween(
            this.config.minHoldTimeMs,
            this.config.maxHoldTimeMs
          );

          // TODO: Replace with structured logging
          console.log(
            `[HedgeManager] Holding positions for ${(holdTime / 1000).toFixed(2)} seconds`
          );

          await sleep(holdTime);

          // Check for interrupt before closing
          if (!this.isRunning) {
            break;
          }

          // Close positions
          positionsClosed = await this.closePositions(symbol);
          if (!positionsClosed) {
            console.error(
              `[HedgeManager] Failed to close positions for ${symbol}`
            );
            await sleep(1000);
            // continue to ensure positions are closed
            continue;
          }

          // wait for sleep to open new positions
          const sleepTime = randomBetween(
            this.config.minSleepBetweenOrdersMs,
            this.config.maxSleepBetweenOrdersMs
          );
          await sleep(sleepTime);

          // TODO: Replace with structured logging
          console.log(`[HedgeManager] Hedge cycle completed for ${symbol}`);
        } catch (error) {
          console.error(`[HedgeManager] Error in hedge cycle:`, error);
        }

        // always sleep for a small amount of time to avoid busy-waiting
        await sleep(1000);
      }
    } finally {
      this.isRunning = false;
      // Ensure positions are closed when stopping

      for (const symbol of symbols) {
        try {
          await this.closePositions(symbol);
        } catch (closeError) {
          console.error(
            `[HedgeManager] Error closing positions on stop:`,
            closeError
          );
        }
      }
    }
  }

  /**
   * Stop the hedge manager (closes any open positions)
   */
  async stop(symbol: string): Promise<void> {
    this.isRunning = false;
    await this.closePositions(symbol);
  }
}
