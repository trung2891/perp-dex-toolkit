import { LighterClient } from "../src/exchanges/lighter";
import "dotenv/config";
import { HedgeConfig, HedgeManager } from "../src/strategy/hedge/hedge";
import { sleep } from "../src/helpers";
import { TradeHistoryRepository } from "../src/db/repositories/trade-history.repository";

async function main() {
  const lighter_1 = new LighterClient({
    name: "lighter",
    baseUrl: "https://mainnet.zklighter.elliot.ai",
    apiKeyPrivateKey: process.env.LIGHTER_API_PRIVATE_KEY_1 ?? "",
    accountIndex: Number(process.env.LIGHTER_ACCOUNT_INDEX_1 ?? 0),
    apiKeyIndex: Number(process.env.LIGHTER_API_INDEX_1 ?? 0),
  });
  await lighter_1.initialize();

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
  //   type: "limit",
  //   quantity: "0.01",
  //   price: "2850",
  //   timeInForce: "GTT",
  //   reduceOnly: false,
  // });

  // await sleep(5000);
  // // console.log(order);
  // const matchingInfo = await lighter_1.getMatchingInfoFromTransactionHash(
  //   "ETH",
  //   order[1] as string
  // );
  // console.log(matchingInfo);

  // const res = await lighter_1.signerClient.waitForTransaction(
  //   // "b5729c76ffd0291f8f8e53038d6e44095481894403bea587633752ba8e2d57c29a3dd74b92c236f1",
  //   order[1] as string,
  //   10000,
  //   2000
  // );
  // console.log(res);
  // === Hedge manager ===

  // /**
  //  * Default hedge configuration
  //  */
  const config: HedgeConfig = {
    minSizeUSD: 100,
    maxSizeUSD: 1000,
    minSleepBetweenOrdersMs: 1000,
    maxSleepBetweenOrdersMs: 5000,
    minHoldTimeMs: 30000,
    maxHoldTimeMs: 300000, // 5 minutes
    slippage: 0.02,
  };
  const tradeHistoryRepository = new TradeHistoryRepository();
  const hedgeManager = new HedgeManager(
    lighter_1,
    lighter_2,
    tradeHistoryRepository,
    config
  );
  await hedgeManager.initialize();

  // await hedgeManager.placeMarketOrder("BNB", 20, "buy", "sell");
  // await hedgeManager.closePositions("BNB");

  // await hedgeManager.run("BTC");
}

main().catch(console.error);
