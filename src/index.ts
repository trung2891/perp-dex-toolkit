import { LighterClient } from "../src/exchanges/lighter";
import "dotenv/config";
import { HedgeConfig, HedgeManager } from "../src/strategy/hedge/hedge";
import { z } from "zod";
import { createTradeHistoryRepository, disconnectPrisma } from "./db";

const envSchema = z.object({
  LIGHTER_API_PRIVATE_KEY_1: z
    .string()
    .min(1, "LIGHTER_API_PRIVATE_KEY_1 is required"),
  LIGHTER_ACCOUNT_INDEX_1: z
    .string()
    .transform((val: string) => Number.parseInt(val, 10)),
  LIGHTER_API_INDEX_1: z
    .string()
    .transform((val: string) => Number.parseInt(val, 10)),
  LIGHTER_API_PRIVATE_KEY_2: z
    .string()
    .min(1, "LIGHTER_API_PRIVATE_KEY_2 is required"),
  LIGHTER_ACCOUNT_INDEX_2: z
    .string()
    .transform((val: string) => Number.parseInt(val, 10)),
  LIGHTER_API_INDEX_2: z
    .string()
    .transform((val: string) => Number.parseInt(val, 10)),
  DB_ENABLED: z
    .string()
    .optional()
    .default("false")
    .transform((val) => val === "true"),
  DATABASE_URL: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors
        .map((err: z.ZodIssue) => `${err.path.join(".")}: ${err.message}`)
        .join("\n");
      throw new Error(`Invalid environment variables:\n${missingVars}`);
    }
    throw error;
  }
}

let hedgeManager: HedgeManager | null = null;

// TODO: move to cli config
const config: HedgeConfig = {
  minSizeUSD: 10,
  maxSizeUSD: 30,
  minSleepBetweenOrdersMs: 1000,
  maxSleepBetweenOrdersMs: 5000,
  minHoldTimeMs: 5000,
  maxHoldTimeMs: 10000, // 10 seconds
  slippage: 0.02,
};

async function start() {
  const env = validateEnv();

  // Validate DATABASE_URL if DB is enabled
  if (env.DB_ENABLED && !env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required when DB_ENABLED=true. Please set DATABASE_URL in environment variables."
    );
  }

  const lighter_1 = new LighterClient({
    name: "lighter",
    baseUrl: "https://mainnet.zklighter.elliot.ai",
    apiKeyPrivateKey: env.LIGHTER_API_PRIVATE_KEY_1,
    accountIndex: env.LIGHTER_ACCOUNT_INDEX_1,
    apiKeyIndex: env.LIGHTER_API_INDEX_1,
  });

  const lighter_2 = new LighterClient({
    name: "lighter",
    baseUrl: "https://mainnet.zklighter.elliot.ai",
    apiKeyPrivateKey: env.LIGHTER_API_PRIVATE_KEY_2,
    accountIndex: env.LIGHTER_ACCOUNT_INDEX_2,
    apiKeyIndex: env.LIGHTER_API_INDEX_2,
  });

  // Create repository based on DB_ENABLED configuration
  const tradeHistoryRepository = createTradeHistoryRepository();

  hedgeManager = new HedgeManager(
    lighter_1,
    lighter_2,
    tradeHistoryRepository,
    config
  );
  await hedgeManager.initialize();

  await hedgeManager.run(["BTC", "ETH"]);
}

async function stop() {
  if (hedgeManager) {
    await hedgeManager.stop("BTC");
  }
  // Gracefully disconnect from database if connected
  await disconnectPrisma();
}

process.on("SIGINT", async () => {
  await stop();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await stop();
  process.exit(0);
});

start().catch(console.error);
