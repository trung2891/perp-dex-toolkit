import { ParadexClient } from "../exchanges/paradex";
import "dotenv/config";
import { HedgeConfig, HedgeManager } from "../strategy/hedge/hedge";
import { z } from "zod";
import { createTradeHistoryRepository, disconnectPrisma } from "../db";

const envSchema = z.object({
  PARADEX_PRIVATE_KEY_1: z.string().min(1, "PARADEX_PRIVATE_KEY_1 is required"),
  PARADEX_ACCOUNT_ADDRESS_1: z
    .string()
    .min(1, "PARADEX_ACCOUNT_ADDRESS is required"),
  PARADEX_PRIVATE_KEY_2: z.string().min(1, "PARADEX_PRIVATE_KEY_2 is required"),
  PARADEX_ACCOUNT_ADDRESS_2: z
    .string()
    .min(1, "PARADEX_ACCOUNT_ADDRESS_2 is required"),
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
  minSizeUSD: 11,
  maxSizeUSD: 20,
  minSleepBetweenOrdersMs: 1000,
  maxSleepBetweenOrdersMs: 5000,
  minHoldTimeMs: 20000,
  maxHoldTimeMs: 40000, // 10 seconds
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

  const paradex_1 = new ParadexClient({
    name: "paradex",
    privateKey: env.PARADEX_PRIVATE_KEY_1,
    accountAddress: env.PARADEX_ACCOUNT_ADDRESS_1,
  });

  const paradex_2 = new ParadexClient({
    name: "paradex",
    privateKey: env.PARADEX_PRIVATE_KEY_2,
    accountAddress: env.PARADEX_ACCOUNT_ADDRESS_2,
  });

  // Create repository based on DB_ENABLED configuration
  const tradeHistoryRepository = createTradeHistoryRepository();

  hedgeManager = new HedgeManager(
    paradex_1,
    paradex_2,
    "paradex-hedge",
    tradeHistoryRepository,
    config
  );
  await hedgeManager.initialize();

  await hedgeManager.run(["BTC"]);
  //   await hedgeManager.closePositions("BTC");
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
