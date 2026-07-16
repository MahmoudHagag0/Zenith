import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';
import { AssetsModule } from '../assets/assets.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { TrackedAssetsModule } from '../tracked-assets/tracked-assets.module';
import { CalendarNewsController } from './calendar-news.controller';
import { CalendarNewsService } from './calendar-news.service';
import { CalendarNewsSyncService } from './calendar-news-sync.service';
import { CALENDAR_NEWS_PROVIDER } from './providers/calendar-news-provider.interface';
import { SimulatedCalendarNewsProvider } from './providers/simulated-calendar-news.provider';

@Module({
  imports: [DatabaseModule, AuthModule, AssetsModule, MarketDataModule, TrackedAssetsModule],
  controllers: [CalendarNewsController],
  providers: [
    CalendarNewsService,
    CalendarNewsSyncService,
    // Only registered implementation as of S1-031 (mirroring ADR-003) --
    // simulated, not a real news/calendar feed. A future real provider
    // requires only a new class and a change to this one registration.
    { provide: CALENDAR_NEWS_PROVIDER, useClass: SimulatedCalendarNewsProvider },
  ],
  exports: [CalendarNewsService],
})
export class CalendarNewsModule {}
