-- CreateTable
CREATE TABLE "TradeHistory" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "size" DECIMAL(20,8) NOT NULL,
    "status" TEXT NOT NULL,
    "openTimestamp" BIGINT NOT NULL,
    "longOpenTx" TEXT,
    "shortOpenTx" TEXT,
    "longEntryPrice" DECIMAL(20,8),
    "shortEntryPrice" DECIMAL(20,8),
    "longAccount" INTEGER NOT NULL,
    "closeTimestamp" BIGINT,
    "longCloseTx" TEXT,
    "shortCloseTx" TEXT,
    "longExitPrice" DECIMAL(20,8),
    "shortExitPrice" DECIMAL(20,8),
    "longPnl" DECIMAL(20,8),
    "shortPnl" DECIMAL(20,8),
    "spread" DECIMAL(20,8),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TradeHistory_symbol_idx" ON "TradeHistory"("symbol");

-- CreateIndex
CREATE INDEX "TradeHistory_status_idx" ON "TradeHistory"("status");

-- CreateIndex
CREATE INDEX "TradeHistory_openTimestamp_idx" ON "TradeHistory"("openTimestamp");
