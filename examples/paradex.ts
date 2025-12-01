/**
 * Paradex Exchange Client Example
 *
 * This example demonstrates how to use the ParadexClient
 * to interact with the Paradex exchange.
 *
 * WARNING: Never commit real API keys or private keys to version control
 */

import { ParadexClient, type ParadexConfig } from "../src/exchanges/paradex";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  // Initialize Paradex client
  const config: ParadexConfig = {
    name: "paradex",
    privateKey: process.env.PARADEX_PRIVATE_KEY_2 || "",
    accountAddress: process.env.PARADEX_ACCOUNT_ADDRESS_2 || "",
  };

  const client = new ParadexClient(config);

  //   // place a market order
  const order = await client.placeOrder({
    symbol: "ETH",
    contractId: "ETH",
    side: "buy",
    type: "market",
    quantity: "0.005",
    price: undefined,
    timeInForce: "IOC",
  });

  // place a limit order
  //   const order = await client.placeOrder({
  //     symbol: "ETH/USD:USDC",
  //     contractId: "ETH/USD:USDC",
  //     side: "buy",
  //     type: "limit",
  //     quantity: "0.005",
  //     price: "2000.00",
  //     timeInForce: "IOC",
  //   });
  //   console.log(order);

  //   // cancel an order
  //   const cancelledOrder = await client.cancelOrder({
  //     orderId: "1764239315070201709265640002",
  //     symbol: "ETH/USD:USDC",
  //   });
  //   console.log(cancelledOrder);

  // cancel all orders
  //   const cancelledOrders = await client.cancelAllOrders("ETH/USD:USDC");
  //   console.log(cancelledOrders);

  // get positions
  //   const positions = await client.getPositions();
  //   console.log(positions);
}

main().catch(console.error);
