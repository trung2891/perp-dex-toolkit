export const TOKEN_AMOUNT_DECIMALS = {
  BTC: 5,
  ETH: 3,
  SOL: 2,
};

/**
 * Database configuration from environment
 */
export const DB_CONFIG = {
  /** Enable database connection and persistence */
  enabled: process.env.DB_ENABLED === "true",
  /** Database URL (required when DB_ENABLED=true) */
  databaseUrl: process.env.DATABASE_URL,
} as const;
