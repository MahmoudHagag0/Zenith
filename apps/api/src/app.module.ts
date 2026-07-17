import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { ExchangesModule } from './exchanges/exchanges.module';
import { MarketsModule } from './markets/markets.module';
import { AssetsModule } from './assets/assets.module';
import { WatchlistsModule } from './watchlists/watchlists.module';
import { FavouritesModule } from './favourites/favourites.module';
import { PortfoliosModule } from './portfolios/portfolios.module';
import { PositionsModule } from './positions/positions.module';
import { MarketDataModule } from './market-data/market-data.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AnalysisEngineModule } from './analysis-engine/analysis-engine.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MorningBriefModule } from './morning-brief/morning-brief.module';
import { JournalModule } from './journal/journal.module';
import { AlertsModule } from './alerts/alerts.module';
import { CalendarNewsModule } from './calendar-news/calendar-news.module';
import { CotModule } from './cot/cot.module';
import { WorkspaceModule } from './workspace/workspace.module';
import { ReportsModule } from './reports/reports.module';
import { CorporateActionsModule } from './corporate-actions/corporate-actions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        redact: ['req.headers.authorization'],
      },
    }),
    HealthModule,
    AuthModule,
    ExchangesModule,
    MarketsModule,
    AssetsModule,
    WatchlistsModule,
    FavouritesModule,
    PortfoliosModule,
    PositionsModule,
    MarketDataModule,
    AnalyticsModule,
    AnalysisEngineModule,
    DashboardModule,
    MorningBriefModule,
    JournalModule,
    AlertsModule,
    CalendarNewsModule,
    CotModule,
    WorkspaceModule,
    ReportsModule,
    CorporateActionsModule,
  ],
})
export class AppModule {}
