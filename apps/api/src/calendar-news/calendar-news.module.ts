import { Logger, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AssetsModule } from '../assets/assets.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { TrackedAssetsModule } from '../tracked-assets/tracked-assets.module';
import { MonitoringModule } from '../monitoring/monitoring.module';
import { LiveDataObservabilityService } from '../monitoring/live-data-observability.service';
import { CalendarNewsController } from './calendar-news.controller';
import { CalendarNewsService } from './calendar-news.service';
import { CalendarNewsSyncService } from './calendar-news-sync.service';
import { CALENDAR_NEWS_PROVIDER } from './providers/calendar-news-provider.interface';
import { createCalendarNewsProvider } from './providers/calendar-news-provider.factory';

const moduleLogger = new Logger('CalendarNewsModule');

@Module({
  imports: [DatabaseModule, AuthModule, AssetsModule, MarketDataModule, TrackedAssetsModule, MonitoringModule],
  controllers: [CalendarNewsController],
  providers: [
    CalendarNewsService,
    CalendarNewsSyncService,
    // First real provider as of L1-003 (28_LIVE_DATA_BLUEPRINT.md §9 Phase
    // 3, ADR-003 precedent) — a single one-line DI-registration swap, no
    // interface change, no consumer change. Gated behind CALENDAR_NEWS_MODE
    // so an environment missing any of the three required credentials
    // falls back to SimulatedCalendarNewsProvider rather than attempting a
    // partially-live call. As of L1-008, LiveDataObservabilityService is
    // threaded through for passive provider-health/metrics recording.
    {
      provide: CALENDAR_NEWS_PROVIDER,
      useFactory: (liveDataObservabilityService: LiveDataObservabilityService) =>
        createCalendarNewsProvider(
          process.env.FMP_API_KEY,
          process.env.FINNHUB_API_KEY,
          process.env.MARKETAUX_API_KEY,
          process.env.CALENDAR_NEWS_MODE,
          moduleLogger,
          liveDataObservabilityService,
        ),
      inject: [LiveDataObservabilityService],
    },
  ],
  exports: [CalendarNewsService],
})
export class CalendarNewsModule {}
