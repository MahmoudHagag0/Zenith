-- CreateTable
CREATE TABLE "MacroSeriesValue" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "observationDate" TIMESTAMP(3) NOT NULL,
    "value" DECIMAL(24,8) NOT NULL,
    "provider" TEXT NOT NULL,
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MacroSeriesValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MacroSeriesValue_seriesId_idx" ON "MacroSeriesValue"("seriesId");

-- CreateIndex
CREATE UNIQUE INDEX "MacroSeriesValue_seriesId_observationDate_key" ON "MacroSeriesValue"("seriesId", "observationDate");
