import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AssetsModule } from '../assets/assets.module';
import { TrackedAssetsModule } from '../tracked-assets/tracked-assets.module';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { MarketDataSyncService } from './market-data-sync.service';
import { RateLimiterService } from './rate-limiter.service';
import { MARKET_DATA_PROVIDER } from './providers/market-data-provider.interface';
import { SimulatedMarketDataProvider } from './providers/simulated-market-data.provider';

@Module({
  imports: [DatabaseModule, AuthModule, AssetsModule, TrackedAssetsModule],
  controllers: [MarketDataController],
  providers: [
    MarketDataService,
    MarketDataSyncService,
    RateLimiterService,
    // Only registered implementation as of S1-005 (ADR-003/DEC-2026-006) —
    // simulated, not real market data. A future real provider requires only
    // a new class and a change to this one registration.
    { provide: MARKET_DATA_PROVIDER, useClass: SimulatedMarketDataProvider },
  ],
  // MarketDataSyncService is additionally exported so later background sync
  // jobs (Calendar/News, COT) can reuse its getTrackedAssetIds() rather than
  // re-querying Watchlist/Favourite/Position for the same asset set.
  exports: [MarketDataService, MarketDataSyncService],
})
export class MarketDataModule {}
