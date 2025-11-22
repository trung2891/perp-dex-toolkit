import { LighterClient } from "../src/exchanges/lighter";
import "dotenv/config";

async function main() {
  const lighter = new LighterClient({
    name: "lighter",
    baseUrl: "https://mainnet.zklighter.elliot.ai",
    apiKeyPrivateKey: process.env.LIGHTER_API_PRIVATE_KEY ?? "",
    accountIndex: Number(process.env.LIGHTER_ACCOUNT_INDEX ?? 0),
    apiKeyIndex: Number(process.env.LIGHTER_API_INDEX ?? 0),
  });

  await lighter.initialize();

  const order = await lighter.placeOrder({
    symbol: "ETH/USDC",
    contractId: "0",
    side: "buy",
    type: "market",
    quantity: "0.01",
    price: "2800",
    timeInForce: "IOC",
    reduceOnly: false,
  });
  console.log(order);
}

main().catch(console.error);
