-- CreateEnum
CREATE TYPE "CotTraderCategory" AS ENUM ('COMMERCIAL', 'NON_COMMERCIAL', 'NON_REPORTABLE');

-- CreateTable
CREATE TABLE "CotReport" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL,
    "category" "CotTraderCategory" NOT NULL,
    "longPositions" INTEGER NOT NULL,
    "shortPositions" INTEGER NOT NULL,
    "netPosition" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CotReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CotReport_assetId_idx" ON "CotReport"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "CotReport_assetId_reportDate_category_key" ON "CotReport"("assetId", "reportDate", "category");

-- AddForeignKey
ALTER TABLE "CotReport" ADD CONSTRAINT "CotReport_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
