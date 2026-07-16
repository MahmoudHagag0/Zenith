import { Logger, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AssetsModule } from '../assets/assets.module';
import { TrackedAssetsModule } from '../tracked-assets/tracked-assets.module';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { MarketDataSyncService } from './market-data-sync.service';
import { RateLimiterService } from './rate-limiter.service';
import { MARKET_DATA_PROVIDER } from './providers/market-data-provider.interface';
import { createMarketDataProvider } from './providers/market-data-provider.factory';

const moduleLogger = new Logger('MarketDataModule');

@Module({
  imports: [DatabaseModule, AuthModule, AssetsModule, TrackedAssetsModule],
  controllers: [MarketDataController],
  providers: [
    MarketDataService,
    MarketDataSyncService,
    RateLimiterService,
    // First real provider as of L1-001 (28_LIVE_DATA_BLUEPRINT.md §9 Phase 1,
    // ADR-003 precedent) — a single one-line DI-registration swap, no
    // interface change, no consumer change. Gated behind MARKET_DATA_MODE so
    // an environment without a configured TWELVE_DATA_API_KEY (or with the
    // flag unset entirely) falls back to SimulatedMarketDataProvider rather
    // than crashing or attempting a keyless real API call.
    {
      provide: MARKET_DATA_PROVIDER,
      useFactory: () => createMarketDataProvider(process.env.TWELVE_DATA_API_KEY, process.env.MARKET_DATA_MODE, moduleLogger),
    },
  ],
  // MarketDataSyncService is additionally exported so later background sync
  // jobs (Calendar/News, COT) can reuse its getTrackedAssetIds() rather than
  // re-querying Watchlist/Favourite/Position for the same asset set.
  exports: [MarketDataService, MarketDataSyncService],
})
export class MarketDataModule {}
