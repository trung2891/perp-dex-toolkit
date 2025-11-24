# Database Configuration Guide

## Overview

The Perpetual Futures Trading Toolkit now supports **optional database persistence** for trade history. You can run the toolkit with or without a database based on your needs.

## Quick Start

### Running WITHOUT Database (Default)

No setup required! Simply don't set `DB_ENABLED` or set it to `false`:

```bash
# .env file
DB_ENABLED=false
```

Or omit it entirely - the default is `false`.

### Running WITH Database

Enable database persistence by setting:

```bash
# .env file
DB_ENABLED=true
DATABASE_URL="postgresql://user:password@localhost:5432/your_database"
```

Then run database migrations as described in the README.

## Environment Variables

### `DB_ENABLED`

- **Type:** Boolean (string `"true"` or `"false"`)
- **Default:** `"false"`
- **Description:** Enable/disable database persistence
- **Values:**
  - `"true"` - Persist all trade history to PostgreSQL database
  - `"false"` - Run without database (trades logged to console only)

### `DATABASE_URL`

- **Type:** String (PostgreSQL connection URL)
- **Required:** Only when `DB_ENABLED=true`
- **Format:** `postgresql://user:password@host:port/database`
- **Example:** `postgresql://postgres:password@localhost:5432/trading_toolkit`

## Architecture

### Optional Repository Pattern

The toolkit uses a simple **optional parameter approach**:

#### `TradeHistoryRepository` (Database-backed)

- Used when `DB_ENABLED=true`
- Persists all trade data to PostgreSQL via Prisma
- Supports full CRUD operations
- Maintains transaction history for analysis

#### No Repository (undefined)

- Used when `DB_ENABLED=false`
- Repository parameter is `undefined`
- All database operations are skipped via conditional checks
- No persistence, no overhead

### Factory Function

The `createTradeHistoryRepository()` factory function returns a repository or `undefined` based on `DB_ENABLED`:

```typescript
import { createTradeHistoryRepository } from "./db";

// Returns TradeHistoryRepository or undefined
const repository = createTradeHistoryRepository();
```

### Type Safety

The `HedgeManager` accepts an optional `TradeHistoryRepository` parameter:

```typescript
constructor(
  firstExchange: IExchange,
  secondExchange: IExchange,
  tradeHistoryRepository?: TradeHistoryRepository,  // Optional!
  config?: Partial<HedgeConfig>
)
```

This ensures:
- ✅ Type safety across the application
- ✅ Simple conditional checks: `if (this.tradeHistoryRepository) { ... }`
- ✅ Zero overhead when database is disabled

## Use Cases

### When to DISABLE Database (`DB_ENABLED=false`)

✅ **Development without DB setup** - Start coding immediately without PostgreSQL  
✅ **Quick testing** - Test trading logic without database overhead  
✅ **Stateless environments** - Run in containers where persistence isn't needed  
✅ **CI/CD pipelines** - Unit/integration tests without DB dependencies  
✅ **Demo/sandbox mode** - Show functionality without data storage  

### When to ENABLE Database (`DB_ENABLED=true`)

✅ **Production trading** - Maintain audit trail of all trades  
✅ **Historical analysis** - Analyze past performance and PnL  
✅ **Compliance/reporting** - Meet regulatory requirements  
✅ **Risk management** - Track position history and exposure  
✅ **Strategy backtesting** - Use real trade data for strategy optimization  

## Code Examples

### Main Entry Point (src/index.ts)

```typescript
import { createTradeHistoryRepository, disconnectPrisma } from "./db";

async function start() {
  // Automatically uses correct repository based on DB_ENABLED
  const repository = createTradeHistoryRepository();
  
  const hedgeManager = new HedgeManager(
    exchange1,
    exchange2,
    repository,
    config
  );
  
  await hedgeManager.initialize();
  await hedgeManager.run(["BTC", "ETH"]);
}

async function stop() {
  // Safe to call even if DB is disabled
  await disconnectPrisma();
}
```

### Strategy Implementation (src/strategy/hedge/hedge.ts)

```typescript
import type { TradeHistoryRepository } from "../../db/repositories";

export class HedgeManager {
  constructor(
    private readonly firstExchange: IExchange,
    private readonly secondExchange: IExchange,
    private readonly tradeHistoryRepository?: TradeHistoryRepository,  // Optional!
    config?: Partial<HedgeConfig>
  ) {
    this.config = { ...DEFAULT_HEDGE_CONFIG, ...config };
  }
  
  async openTrade(symbol: string, size: number) {
    // Only call repository if it exists
    if (this.tradeHistoryRepository) {
      await this.tradeHistoryRepository.create({
        symbol,
        size: size.toString(),
        status: "open",
        openTimestamp: BigInt(Math.floor(Date.now() / 1000)),
        longAccount: 1,
      });
    }
  }
}
```

## Logging

### With Database Enabled

```
[Database] DB persistence enabled - using TradeHistoryRepository
```

### With Database Disabled

```
[Database] DB persistence disabled - no trade history will be saved
```

## Error Handling

### Missing DATABASE_URL

If `DB_ENABLED=true` but `DATABASE_URL` is not set:

```
Error: DATABASE_URL is required when DB_ENABLED=true. 
Please set DATABASE_URL in environment variables.
```

### DB Access When Disabled

If code tries to directly access Prisma when DB is disabled:

```
Error: Database is not enabled. 
Set DB_ENABLED=true in environment variables to use database features.
```

## Testing

### Unit Tests (No DB)

```bash
# Run tests without database
DB_ENABLED=false npm test
```

### Integration Tests (With DB)

```bash
# Run tests with database
DB_ENABLED=true DATABASE_URL="postgresql://..." npm test
```

## Migration Guide

### Upgrading from Previous Versions

**Before:**

```typescript
import { TradeHistoryRepository } from "./db/repositories/trade-history.repository";

const repository = new TradeHistoryRepository();
```

**After:**

```typescript
import { createTradeHistoryRepository } from "./db";

const repository = createTradeHistoryRepository();
```

The factory function handles everything automatically based on environment configuration.

## Best Practices

### ✅ DO

- Use the `createTradeHistoryRepository()` factory function
- Call `disconnectPrisma()` on application shutdown
- Validate `DATABASE_URL` when `DB_ENABLED=true`
- Use structured logging to track DB operations
- Check `if (repository)` before calling repository methods

### ❌ DON'T

- Access `prisma` client directly when DB might be disabled
- Hardcode database configuration
- Assume data will always be persisted
- Skip `disconnectPrisma()` cleanup
- Call repository methods without checking if it exists

## Security

### Environment Variables

- ✅ Never commit `.env` files to version control
- ✅ Use `.env.example` or documentation for sharing config templates
- ✅ Rotate database credentials regularly
- ✅ Use read-only database users for analytics queries

### Production Deployment

```bash
# Example production environment variables
DB_ENABLED=true
DATABASE_URL="postgresql://prod_user:secure_password@db.example.com:5432/trading_prod?sslmode=require"
NODE_ENV=production
```

## Troubleshooting

### Issue: "Database is not enabled" error

**Solution:** Set `DB_ENABLED=true` in your `.env` file

### Issue: "DATABASE_URL is required" error

**Solution:** Add `DATABASE_URL` to your `.env` file when `DB_ENABLED=true`

### Issue: Prisma client errors

**Solution:** Run `yarn db:generate` to regenerate the Prisma client

### Issue: Connection timeout

**Solution:** Check PostgreSQL is running and `DATABASE_URL` is correct

## Performance Considerations

### With Database Enabled

- Each trade operation performs a database write
- Queries for open trades may impact performance under high load
- Consider connection pooling for production
- Monitor database query performance

### With Database Disabled

- Zero database overhead
- Faster execution (no I/O operations)
- Lower memory footprint
- Suitable for high-frequency strategies in testing

## Future Enhancements

Potential future additions:

- [ ] Support for other databases (MongoDB, MySQL)
- [ ] Configurable persistence strategies (write-through, write-behind)
- [ ] In-memory caching layer for performance
- [ ] Batch write operations for high-frequency trading
- [ ] Read replicas for analytics queries

---

**Need Help?** Check the main README.md or open an issue on GitHub.

