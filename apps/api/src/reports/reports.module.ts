import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PortfoliosModule } from '../portfolios/portfolios.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { JournalModule } from '../journal/journal.module';
import { AlertsModule } from '../alerts/alerts.module';
import { CalendarNewsModule } from '../calendar-news/calendar-news.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [AuthModule, PortfoliosModule, AnalyticsModule, JournalModule, AlertsModule, CalendarNewsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
