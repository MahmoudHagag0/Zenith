import { Injectable, Logger } from '@nestjs/common';
import { AssetsService } from '../assets/assets.service';
import { InstrumentReadingService } from '../dashboard/instrument-reading.service';
import { CalendarNewsService } from '../calendar-news/calendar-news.service';
import { CotService } from '../cot/cot.service';
import { AlertsService } from '../alerts/alerts.service';
import { JournalService } from '../journal/journal.service';
import type { InstrumentReading } from '../dashboard/dashboard.types';

/**
 * AI Workspace (S1-033, Phase 5 of the post-S1-024 roadmap). The
 * cross-cutting reasoning layer the roadmap named last, deliberately: it
 * benefits from every other data domain already existing (Confluence
 * Engine reading via Dashboard, News/Calendar, COT, Alerts, Journal) and
 * introduces no independent signal computation of its own -- every field
 * here is a direct, unmodified read from an already-built, already-tested
 * service. One instrument, one screen, everything already known about it.
 */
@Injectable()
export class WorkspaceService {
  private readonly logger = new Logger(WorkspaceService.name);

  constructor(
    private readonly assetsService: AssetsService,
    private readonly instrumentReadingService: InstrumentReadingService,
    private readonly calendarNewsService: CalendarNewsService,
    private readonly cotService: CotService,
    private readonly alertsService: AlertsService,
    private readonly journalService: JournalService,
  ) {}

  async getWorkspace(userId: string, assetId: string) {
    const asset = await this.assetsService.findOne(assetId);

    let reading: InstrumentReading | null = null;
    let readingFailureReason: string | null = null;
    try {
      reading = await this.instrumentReadingService.getInstrumentReading(assetId);
    } catch (error) {
      // Mirrors DashboardService's own honesty rule (Constitution §4.1): a
      // failed reading is disclosed, never silently dropped or faked.
      readingFailureReason = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Workspace: instrument reading failed for asset ${assetId}: ${readingFailureReason}`);
    }

    const [news, upcomingEvents, cotReports, alerts, journalEntries] = await Promise.all([
      this.calendarNewsService.getNewsForAsset(assetId),
      this.calendarNewsService.getUpcomingEventsForAsset(assetId),
      this.cotService.getReportsForAsset(assetId),
      this.alertsService.findByAsset(userId, assetId),
      this.journalService.findByAsset(userId, assetId),
    ]);

    return {
      assetId: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      reading,
      readingFailureReason,
      news,
      upcomingEvents,
      cotReports: this.latestPerCategory(cotReports),
      alerts,
      journalEntries,
    };
  }

  /** COT reports already come ordered desc by reportDate (CotService); keeps only the most recent report per category, matching the same collapsing the /cot screen itself performs. */
  private latestPerCategory<T extends { category: string }>(reports: readonly T[]): T[] {
    const seen = new Set<string>();
    const latest: T[] = [];
    for (const report of reports) {
      if (seen.has(report.category)) continue;
      seen.add(report.category);
      latest.push(report);
    }
    return latest;
  }
}
