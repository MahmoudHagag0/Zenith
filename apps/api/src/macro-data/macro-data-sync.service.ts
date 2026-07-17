import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MacroDataService } from './macro-data.service';
import { TRACKED_MACRO_SERIES } from './tracked-macro-series';

/**
 * Daily refresh of cached Macro Context series (L1-007,
 * 28_LIVE_DATA_BLUEPRINT.md §6: "MacroDataSyncService (FRED) — daily").
 * Unlike every prior L1 Sprint's sync service, this one does NOT reuse
 * MarketDataSyncService.getTrackedAssetIds() -- Macro Context series are
 * global economic data with no Asset/Watchlist/Portfolio relation to
 * scope by, so the loop iterates the small, disclosed
 * TRACKED_MACRO_SERIES reference set instead.
 */
@Injectable()
export class MacroDataSyncService {
  private readonly logger = new Logger(MacroDataSyncService.name);

  constructor(private readonly macroDataService: MacroDataService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncTrackedSeries(): Promise<void> {
    let succeeded = 0;
    let failed = 0;

    for (const seriesId of TRACKED_MACRO_SERIES) {
      try {
        await this.macroDataService.syncSeries(seriesId);
        succeeded += 1;
      } catch (error) {
        failed += 1;
        this.logger.warn(`Macro data sync failed for series ${seriesId}: ${(error as Error).message}`);
      }
    }

    this.logger.log(`Macro data sync finished: ${succeeded} succeeded, ${failed} failed, ${TRACKED_MACRO_SERIES.length} tracked`);
  }
}
