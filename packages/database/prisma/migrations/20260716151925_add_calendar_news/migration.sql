-- CreateEnum
CREATE TYPE "NewsCategory" AS ENUM ('EARNINGS', 'ECONOMIC', 'MARKET', 'COMPANY');

-- CreateEnum
CREATE TYPE "CalendarImportance" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateTable
CREATE TABLE "NewsItem" (
    "id" TEXT NOT NULL,
    "assetId" TEXT,
    "headline" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "category" "NewsCategory" NOT NULL,
    "source" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "assetId" TEXT,
    "title" TEXT NOT NULL,
    "category" "NewsCategory" NOT NULL,
    "importance" "CalendarImportance" NOT NULL,
    "description" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsItem_assetId_idx" ON "NewsItem"("assetId");

-- CreateIndex
CREATE INDEX "NewsItem_publishedAt_idx" ON "NewsItem"("publishedAt");

-- CreateIndex
CREATE INDEX "CalendarEvent_assetId_idx" ON "CalendarEvent"("assetId");

-- CreateIndex
CREATE INDEX "CalendarEvent_scheduledAt_idx" ON "CalendarEvent"("scheduledAt");

-- AddForeignKey
ALTER TABLE "NewsItem" ADD CONSTRAINT "NewsItem_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
