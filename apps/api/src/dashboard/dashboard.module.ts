import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AnalysisEngineModule } from '../analysis-engine/analysis-engine.module';
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
 * Out of Scope).
 */
@Module({
  imports: [DatabaseModule, AuthModule, AnalysisEngineModule],
  controllers: [DashboardController],
  providers: [DashboardService, InstrumentReadingService],
  exports: [InstrumentReadingService],
})
export class DashboardModule {}
