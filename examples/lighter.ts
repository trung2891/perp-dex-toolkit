import { LighterClient } from "../src/exchanges/lighter";
import "dotenv/config";
import { HedgeConfig, HedgeManager } from "../src/strategy/hedge/hedge";

async function main() {
  const lighter_1 = new LighterClient({
    name: "lighter",
    baseUrl: "https://mainnet.zklighter.elliot.ai",
    apiKeyPrivateKey: process.env.LIGHTER_API_PRIVATE_KEY ?? "",
    accountIndex: Number(process.env.LIGHTER_ACCOUNT_INDEX ?? 0),
    apiKeyIndex: Number(process.env.LIGHTER_API_INDEX ?? 0),
  });

  const lighter_2 = new LighterClient({
    name: "lighter",
    baseUrl: "https://mainnet.zklighter.elliot.ai",
    apiKeyPrivateKey: process.env.LIGHTER_API_PRIVATE_KEY_2 ?? "",
    accountIndex: Number(process.env.LIGHTER_ACCOUNT_INDEX_2 ?? 0),
    apiKeyIndex: Number(process.env.LIGHTER_API_INDEX_2 ?? 0),
  });

  // console.log(await lighter_1.getPositions());

  // const order = await lighter_1.placeOrder({
  //   symbol: "ETH/USDC",
  //   contractId: "0",
  //   side: "buy",
  //   type: "market",
  //   quantity: "0.01",
  //   price: "2800",
  //   timeInForce: "IOC",
  //   reduceOnly: false,
  // });
  // console.log(order);

  // === Hedge manager ===

  /**
   * Default hedge configuration
   */
  const config: HedgeConfig = {
    minSizeUSD: 100,
    maxSizeUSD: 1000,
    minSleepBetweenOrdersMs: 1000,
    maxSleepBetweenOrdersMs: 5000,
    minHoldTimeMs: 30000,
    maxHoldTimeMs: 300000, // 5 minutes
    slippage: 0.02,
  };
  const hedgeManager = new HedgeManager(lighter_1, lighter_2, config);
  await hedgeManager.initialize();

  await hedgeManager.placeMarketOrder("BTC", 100, "buy", "sell");

  // await hedgeManager.run("BTC");
}

main().catch(console.error);
