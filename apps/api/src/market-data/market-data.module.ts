import { Logger, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AssetsModule } from '../assets/assets.module';
import { TrackedAssetsModule } from '../tracked-assets/tracked-assets.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { LiveDataObservabilityService } from '../monitoring/live-data-observability.service';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { MarketDataSyncService } from './market-data-sync.service';
import { MarketSessionSyncService } from './market-session-sync.service';
import { RateLimiterService } from './rate-limiter.service';
import { MARKET_DATA_PROVIDER } from './providers/market-data-provider.interface';
import { createMarketDataProvider } from './providers/market-data-provider.factory';
import { MARKET_SESSION_PROVIDER } from './providers/market-session-provider.interface';
import { InternalMarketSessionProvider } from './providers/internal-market-session.provider';
import { INSTRUMENT_METADATA_PROVIDER } from './providers/instrument-metadata-provider.interface';
import { createInstrumentMetadataProvider } from './providers/instrument-metadata-provider.factory';

const moduleLogger = new Logger('MarketDataModule');

@Module({
  imports: [DatabaseModule, AuthModule, AssetsModule, TrackedAssetsModule, MonitoringModule],
  controllers: [MarketDataController],
  providers: [
    MarketDataService,
    MarketDataSyncService,
    MarketSessionSyncService,
    RateLimiterService,
    // First real provider as of L1-001 (28_LIVE_DATA_BLUEPRINT.md §9 Phase 1,
    // ADR-003 precedent) — a single one-line DI-registration swap, no
    // interface change, no consumer change. Gated behind MARKET_DATA_MODE so
    // an environment without a configured TWELVE_DATA_API_KEY (or with the
    // flag unset entirely) falls back to SimulatedMarketDataProvider rather
    // than crashing or attempting a keyless real API call. As of L1-008,
    // LiveDataObservabilityService is threaded through for passive
    // provider-health/metrics recording.
    {
      provide: MARKET_DATA_PROVIDER,
      useFactory: (liveDataObservabilityService: LiveDataObservabilityService) =>
        createMarketDataProvider(process.env.TWELVE_DATA_API_KEY, process.env.MARKET_DATA_MODE, moduleLogger, liveDataObservabilityService),
      inject: [LiveDataObservabilityService],
    },
    // Market Sessions & Trading Holidays (L1-002, 28_LIVE_DATA_BLUEPRINT.md
    // §9 Phase 2). The Architecture Team designated the Internal Market
    // Sessions Table as the sole primary source of truth (2026-07-16) —
    // external providers are not queried for runtime lookups — so there is
    // exactly one implementation registered, no mode switch.
    { provide: MARKET_SESSION_PROVIDER, useClass: InternalMarketSessionProvider },
    // Instrument Metadata, Symbol Search & Classification (L1-005,
    // 28_LIVE_DATA_BLUEPRINT.md §9 Phase 5) — a NEW provider interface, no
    // prior abstraction existed for this domain. Reuses the SAME
    // MARKET_DATA_MODE/TWELVE_DATA_API_KEY flags as MARKET_DATA_PROVIDER
    // (Architecture Team decision: Twelve Data only, no new mode flag).
    {
      provide: INSTRUMENT_METADATA_PROVIDER,
      useFactory: (liveDataObservabilityService: LiveDataObservabilityService) =>
        createInstrumentMetadataProvider(process.env.TWELVE_DATA_API_KEY, process.env.MARKET_DATA_MODE, moduleLogger, liveDataObservabilityService),
      inject: [LiveDataObservabilityService],
    },
  ],
  // MarketDataSyncService is additionally exported so later background sync
  // jobs (Calendar/News, COT) can reuse its getTrackedAssetIds() rather than
  // re-querying Watchlist/Favourite/Position for the same asset set.
  exports: [MarketDataService, MarketDataSyncService],
})
export class MarketDataModule {}
