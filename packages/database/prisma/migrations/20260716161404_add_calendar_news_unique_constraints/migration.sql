-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_assetId_title_scheduledAt_key" ON "CalendarEvent"("assetId", "title", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsItem_assetId_headline_publishedAt_key" ON "NewsItem"("assetId", "headline", "publishedAt");
