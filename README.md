# Perp DEX Toolkit

A TypeScript toolkit for perpetual futures trading on multiple DEX exchanges. Modular, type-safe, and production-ready.

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
