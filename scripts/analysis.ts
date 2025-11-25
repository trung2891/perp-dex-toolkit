import { createTradeHistoryRepository } from "../src/db";

async function main() {
  const tradeHistoryRepository = createTradeHistoryRepository();
  if (!tradeHistoryRepository) {
    console.error("Trade history repository not found");
    return;
  }
  const trades = await tradeHistoryRepository.findMany({});

  // calc avg spread = total spread / total volume
  let totalSpread = 0;
  let totalVolume = 0;
  for (const trade of trades) {
    totalSpread += parseFloat(trade.spread ?? "0");
    totalVolume +=
      parseFloat(trade.size ?? "0") * parseFloat(trade.longEntryPrice ?? "0");
    totalVolume +=
      parseFloat(trade.size ?? "0") * parseFloat(trade.shortEntryPrice ?? "0");
  }
  const avgSpread = (totalSpread / totalVolume) * 100;
  console.log(`Avg spread: ${avgSpread.toFixed(10)}%`);
}

main().catch(console.error);
