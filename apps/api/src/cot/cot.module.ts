import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AssetsModule } from '../assets/assets.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { LiveDataObservabilityService } from '../monitoring/live-data-observability.service';
import { CotController } from './cot.controller';
import { CotService } from './cot.service';
import { CotSyncService } from './cot-sync.service';
import { COT_PROVIDER } from './providers/cot-provider.interface';
import { createCotProvider } from './providers/cot-provider.factory';

@Module({
  imports: [DatabaseModule, AuthModule, AssetsModule, MarketDataModule, MonitoringModule],
  controllers: [CotController],
  providers: [
    CotService,
    CotSyncService,
    // First real provider as of L1-004 (28_LIVE_DATA_BLUEPRINT.md §9 Phase
    // 4, ADR-003 precedent) — a single one-line DI-registration swap, no
    // interface change, no consumer change. Gated behind COT_MODE so an
    // environment without it set falls back to SimulatedCotProvider.
    // As of L1-008, LiveDataObservabilityService is threaded through for
    // passive provider-health/metrics recording (Architecture Team
    // Decision 2/3) -- no live ping, no change to CotProvider itself.
    {
      provide: COT_PROVIDER,
      useFactory: (liveDataObservabilityService: LiveDataObservabilityService) =>
        createCotProvider(process.env.COT_MODE, process.env.CFTC_APP_TOKEN, liveDataObservabilityService),
      inject: [LiveDataObservabilityService],
    },
  ],
  exports: [CotService],
})
export class CotModule {}
