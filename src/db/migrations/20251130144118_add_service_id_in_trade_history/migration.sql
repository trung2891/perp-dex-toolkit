/*
  Warnings:

  - Added the required column `serviceID` to the `TradeHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: Add serviceID column with default value for existing rows
ALTER TABLE "TradeHistory" ADD COLUMN "serviceID" TEXT NOT NULL DEFAULT 'lighter-hedge';

-- Update all existing rows to have serviceID = 'lighter-hedge'
UPDATE "TradeHistory" SET "serviceID" = 'lighter-hedge' WHERE "serviceID" IS NULL OR "serviceID" = '';

-- Remove the default value (optional, keeps the column required but without default for new inserts)
ALTER TABLE "TradeHistory" ALTER COLUMN "serviceID" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "TradeHistory_serviceID_idx" ON "TradeHistory"("serviceID");
