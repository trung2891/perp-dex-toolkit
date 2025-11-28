# Perp DEX Toolkit

A TypeScript toolkit for perpetual futures trading on multiple DEX exchanges. Modular, type-safe, and production-ready.

## Supported Exchanges

- **Lighter** (zkSync) - Fully integrated ✅
- **Paradex** (Starknet) - Fully integrated ✅

## Setup

Install dependencies:

```bash
npm install
# or
yarn install
```

### Database Setup (Optional)

This project supports optional database persistence for trade history using Prisma with PostgreSQL.

#### Running WITHOUT Database (Default)

By default, the toolkit runs without database persistence. Trade operations are logged to console but not saved:

```bash
# In your .env file (or omit entirely)
DB_ENABLED=false
```

No database setup required! The toolkit will skip all database operations.

#### Running WITH Database Persistence

To enable database persistence:

1. **Set up PostgreSQL database** and create a `.env` file:

```bash
# Enable database persistence
DB_ENABLED=true

# Database connection string
DATABASE_URL="postgresql://user:password@localhost:5432/lfg_vault_farming"
```

2. **Generate Prisma Client**:

```bash
yarn db:generate
```

3. **Push the schema to your database** (for development):

```bash
yarn db:push
```

Or use migrations for production:

```bash
yarn db:migrate
```

4. **Open Prisma Studio** (optional, for database inspection):

```bash
yarn db:studio
```

**Note:** When `DB_ENABLED=true`, you MUST provide a valid `DATABASE_URL` or the application will fail to start.

## Development

Run in development mode:

```bash
npm run dev
```

## Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

## Run

Run the compiled JavaScript:

```bash
npm start
```

## Watch Mode

Watch for changes and recompile:

```bash
npm run watch
```

## Exchange Integration

### Lighter Exchange

See `examples/lighter.ts` for usage examples.

Configuration:
```typescript
import { LighterClient } from "./src/exchanges";

const client = new LighterClient({
  name: "lighter",
  baseUrl: "https://mainnet.zklighter.elliot.ai",
  apiKeyPrivateKey: process.env.LIGHTER_API_PRIVATE_KEY,
  accountIndex: 0,
  apiKeyIndex: 0,
});
```

### Paradex Exchange

See `examples/paradex.ts` and `docs/PARADEX_INTEGRATION.md` for detailed documentation.

Configuration:
```typescript
import { ParadexClient } from "./src/exchanges";

const client = new ParadexClient({
  name: "paradex",
  privateKey: process.env.PARADEX_PRIVATE_KEY,
  accountAddress: process.env.PARADEX_ACCOUNT_ADDRESS,
  environment: "testnet", // or "mainnet"
});
```

**Environment Variables for Paradex:**
```env
PARADEX_PRIVATE_KEY=your_starknet_private_key
PARADEX_ACCOUNT_ADDRESS=your_paradex_account_address
PARADEX_ENVIRONMENT=testnet
```

## Project Structure

```
src/
├── exchanges/          # Exchange client implementations
│   ├── base.ts        # Base exchange interface
│   ├── lighter.ts     # Lighter exchange client
│   ├── paradex.ts     # Paradex exchange client
│   └── index.ts       # Exchange exports
├── domain/            # Domain types and errors
│   ├── types.ts       # Trading types (Order, Position, etc.)
│   └── errors.ts      # Error classifications
├── strategy/          # Trading strategies
│   └── hedge/         # Hedge strategy implementation
├── db/                # Database layer (optional)
│   ├── client.ts      # Prisma client
│   ├── schema.prisma  # Database schema
│   └── repositories/  # Data repositories
└── index.ts           # Main entry point

examples/              # Usage examples
├── lighter.ts         # Lighter client examples
└── paradex.ts         # Paradex client examples

docs/                  # Documentation
├── DATABASE_CONFIGURATION.md
└── PARADEX_INTEGRATION.md
```

## Features

### Trading Operations
- Place orders (limit, market)
- Cancel orders (individual or all)
- Query order status
- Manage positions
- Account balances

### Risk Management
- Position sizing
- Leverage control
- Liquidation price calculation
- PnL tracking (realized & unrealized)

### Market Data
- Real-time tickers
- Order book snapshots
- Funding rates
- 24h statistics

### Infrastructure
- Multi-exchange abstraction
- Type-safe API
- Comprehensive error handling
- Optional database persistence
- Structured logging
