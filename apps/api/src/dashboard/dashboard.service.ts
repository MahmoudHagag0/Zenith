import { Injectable, Logger } from '@nestjs/common';
import { TrackedAssetsService } from '../tracked-assets/tracked-assets.service';
import { InstrumentReadingService } from './instrument-reading.service';
import type { DecisionCenterResponse, FailedInstrument, RankedOpportunity } from './dashboard.types';

/**
 * Orchestrates Decision Center (`DASH-002`) (S1-019 Sprint Brief, Scope
 * item 4). Gathers the instruments a trader is tracking (the union of
 * every Watchlist item across all of that trader's own Watchlists, and
 * every open Position across all of that trader's own Portfolios --
 * `26_DASHBOARD_HOME_SPECIFICATION.md` §3 DASH-002 Inputs), computes each
 * instrument's own reading (reused, never recomputed per caller), ranks
 * qualifying instruments, and assembles the response -- honestly
 * distinguishing "this instrument yields no qualifying reading" from
 * "this instrument's own computation failed" (Constitution §4.1, §12.4).
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly trackedAssetsService: TrackedAssetsService,
    private readonly instrumentReadingService: InstrumentReadingService,
  ) {}

  async getDecisionCenter(userId: string): Promise<DecisionCenterResponse> {
    const instruments = await this.trackedAssetsService.getTrackedInstrumentsForUser(userId);

    const failed: FailedInstrument[] = [];
    const opportunities: RankedOpportunity[] = [];
    let successCount = 0;

    await Promise.all(
      instruments.map(async (instrument) => {
        try {
          const reading = await this.instrumentReadingService.getInstrumentReading(instrument.assetId);
          successCount += 1;
          if (reading.netDirection === 'NEUTRAL') return; // No qualifying reading for this instrument -- not a failure.
          opportunities.push({
            assetId: instrument.assetId,
            symbol: instrument.symbol,
            marketName: instrument.marketName,
            netDirection: reading.netDirection,
            relevanceScore: reading.relevanceScore,
            agreeingDimensions: reading.agreeingDimensions,
            disagreementPresent: reading.disagreementDimensions.length > 0,
            reading,
          });
        } catch (error) {
          // A single instrument's own computation failure never aborts the batch
          // (Constitution §4.1) -- disclosed in `instrumentsFailed`, never silently dropped.
          const reason = error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(`Dashboard: instrument ${instrument.assetId} failed to compute a reading: ${reason}`);
          failed.push({ assetId: instrument.assetId, reason });
        }
      }),
    );

    opportunities.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Missing Decision 5: DEGRADED only when every attempted instrument failed outright
    // (the closest match to DASH-002's own Error State -- "unable to answer" -- distinct
    // from NO_CLEAR_OPPORTUNITY, "answered: nothing qualifies"). Zero tracked instruments
    // is reported as NO_CLEAR_OPPORTUNITY, the Product-Rule-9-governed valid outcome.
    const readiness = instruments.length > 0 && successCount === 0 ? 'DEGRADED' : opportunities.length > 0 ? 'OPPORTUNITIES_AVAILABLE' : 'NO_CLEAR_OPPORTUNITY';

    return {
      readiness,
      generatedAt: new Date().toISOString(),
      instrumentsConsidered: successCount,
      instrumentsFailed: failed,
      opportunities,
    };
  }
}
