-- CreateEnum
CREATE TYPE "CorporateActionType" AS ENUM ('SPLIT', 'DIVIDEND');

-- CreateTable
CREATE TABLE "CorporateAction" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" "CorporateActionType" NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "ratio" DECIMAL(24,8),
    "amount" DECIMAL(24,8),
    "currency" TEXT,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorporateAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CorporateAction_assetId_idx" ON "CorporateAction"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "CorporateAction_assetId_type_effectiveDate_key" ON "CorporateAction"("assetId", "type", "effectiveDate");

-- AddForeignKey
ALTER TABLE "CorporateAction" ADD CONSTRAINT "CorporateAction_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
