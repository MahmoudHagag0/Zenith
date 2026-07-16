import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AnalysisEngineModule } from '../analysis-engine/analysis-engine.module';
import { TrackedAssetsModule } from '../tracked-assets/tracked-assets.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { InstrumentReadingService } from './instrument-reading.service';

/**
 * Dashboard Backend Foundation (S1-019 Sprint Brief, Scope item 9).
 * Imports `AnalysisEngineModule` for `MarketSeriesService`/`CONFLUENCE_ENGINE`
 * (unchanged by this Sprint beyond WP1's additive method) rather than
 * duplicating any of that module's own composition. `InstrumentReadingService`
 * is exported so a later Watchlist/Portfolio annotation endpoint can reuse
 * it without rebuilding it (no such endpoint exists yet -- Sprint Brief,
 * Out of Scope). `DashboardService` is additionally exported (S1-020
 * Sprint Brief, Scope item 6) so the Narrative Composer can reuse its
 * own instrument-gathering/ranking orchestration verbatim rather than
 * duplicating it.
 */
@Module({
  imports: [AuthModule, AnalysisEngineModule, TrackedAssetsModule],
  controllers: [DashboardController],
  providers: [DashboardService, InstrumentReadingService],
  exports: [InstrumentReadingService, DashboardService],
})
export class DashboardModule {}
