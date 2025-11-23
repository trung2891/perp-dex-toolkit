# Perp DEX Toolkit

A TypeScript toolkit for perpetual futures trading on multiple DEX exchanges. Modular, type-safe, and production-ready.

## Setup

Install dependencies:

```bash
npm install
# or
yarn install
```

### Database Setup

This project uses Prisma with PostgreSQL for storing trade history.

1. **Set up PostgreSQL database** and create a `.env` file with your database connection string:

```bash
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
