import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TrackedAssetsService } from '../tracked-assets/tracked-assets.service';
import { MARKET_SESSION_PROVIDER, type MarketSessionProvider } from './providers/market-session-provider.interface';

/**
 * Daily internal-consistency check for the Market Sessions Table
 * (28_LIVE_DATA_BLUEPRINT.md §6/§9 Phase 2: "MarketSessionSyncService...
 * holiday refresh — daily"). Since the Architecture Team designated the
 * Internal Market Sessions Table as the sole primary source of truth for
 * L1-002 (2026-07-16) -- external providers are not used for runtime
 * lookups -- there is no external data to fetch or reconcile here. This
 * job instead verifies that every currently tracked asset's exchange has a
 * configured entry, and logs a warning for any gap so the fail-open
 * behavior it causes (MarketDataSyncService always polling that exchange)
 * is visible rather than silent.
 */
@Injectable()
export class MarketSessionSyncService {
  private readonly logger = new Logger(MarketSessionSyncService.name);

  constructor(
    private readonly trackedAssetsService: TrackedAssetsService,
    @Inject(MARKET_SESSION_PROVIDER) private readonly marketSessionProvider: MarketSessionProvider,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkSessionCoverage(): Promise<void> {
    const assets = await this.trackedAssetsService.getAllTrackedAssetsWithExchange();
    const exchangeCodes = [...new Set(assets.map((asset) => asset.exchangeCode))];

    const uncovered: string[] = [];
    for (const code of exchangeCodes) {
      const status = await this.marketSessionProvider.getMarketStatus(code);
      if (status === 'UNKNOWN') {
        uncovered.push(code);
      }
    }

    if (uncovered.length > 0) {
      this.logger.warn(
        `Market Sessions Table has no entry for ${uncovered.length} tracked exchange(s): ${uncovered.join(', ')} — sync gating will fail open (always poll) for these until the internal table is extended.`,
      );
    } else {
      this.logger.log(`Market Sessions Table covers all ${exchangeCodes.length} tracked exchange(s).`);
    }
  }
}
