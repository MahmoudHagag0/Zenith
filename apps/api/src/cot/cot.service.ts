import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AssetsService } from '../assets/assets.service';
import { COT_PROVIDER, type CotProvider } from './providers/cot-provider.interface';

const REPORT_FRESHNESS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * COT (Commitment of Traders) caching layer (S1-032, Phase 4 of the
 * post-S1-024 roadmap). Not user-owned -- mirrors MarketQuote/NewsItem: a
 * shared cache keyed by asset, populated on demand and by CotSyncService.
 * Unlike NewsItem/CalendarEvent, a COT report has a genuine natural key
 * (assetId, reportDate, category), so caching uses a real upsert rather
 * than the idempotent findFirst-then-create guard those use.
 */
@Injectable()
export class CotService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assetsService: AssetsService,
    @Inject(COT_PROVIDER) private readonly provider: CotProvider,
  ) {}

  async getReportsForAsset(assetId: string) {
    const asset = await this.assetsService.findOne(assetId);
    await this.ensureCached(asset.id, asset.symbol);
    return this.prisma.cotReport.findMany({
      where: { assetId },
      orderBy: [{ reportDate: 'desc' }, { category: 'asc' }],
    });
  }

  /** Used by CotSyncService -- populates the cache for one already-resolved asset. */
  async syncAsset(assetId: string, symbol: string): Promise<void> {
    await this.ensureCached(assetId, symbol);
  }

  private async ensureCached(assetId: string, symbol: string): Promise<void> {
    const since = new Date(Date.now() - REPORT_FRESHNESS_WINDOW_MS);
    const latest = await this.prisma.cotReport.findFirst({ where: { assetId }, orderBy: { reportDate: 'desc' } });
    if (latest && latest.reportDate.getTime() >= since.getTime()) return;

    const reports = await this.provider.getLatestReports(symbol);
    await Promise.all(
      reports.map((report) => {
        const netPosition = report.longPositions - report.shortPositions;
        return this.prisma.cotReport.upsert({
          where: { assetId_reportDate_category: { assetId, reportDate: report.reportDate, category: report.category } },
          create: {
            assetId,
            reportDate: report.reportDate,
            category: report.category,
            longPositions: report.longPositions,
            shortPositions: report.shortPositions,
            netPosition,
            provider: this.provider.name,
          },
          update: {
            longPositions: report.longPositions,
            shortPositions: report.shortPositions,
            netPosition,
            provider: this.provider.name,
          },
        });
      }),
    );
  }
}
