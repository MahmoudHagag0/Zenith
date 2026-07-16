import { Injectable } from '@nestjs/common';
import { PortfoliosService } from '../portfolios/portfolios.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { JournalService } from '../journal/journal.service';
import { AlertsService } from '../alerts/alerts.service';
import { CalendarNewsService } from '../calendar-news/calendar-news.service';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Reports (S1-034, Phase 6 -- final phase -- of the post-S1-024 roadmap).
 * A weekly summary composed entirely from already-built, already-tested
 * services: current portfolio analytics (S1-006), journal entries written
 * this week (S1-029), alerts triggered this week (S1-030), and notable
 * news for tracked assets this week (S1-031). No new Prisma query is
 * introduced here -- every underlying service's own existing findAll()
 * is reused as-is, filtered to the reporting window in memory rather than
 * duplicating a date-scoped query each service doesn't already expose.
 */
@Injectable()
export class ReportsService {
  constructor(
    private readonly portfoliosService: PortfoliosService,
    private readonly analyticsService: AnalyticsService,
    private readonly journalService: JournalService,
    private readonly alertsService: AlertsService,
    private readonly calendarNewsService: CalendarNewsService,
  ) {}

  async getWeeklyReport(userId: string) {
    const now = new Date();
    const periodStart = new Date(now.getTime() - WEEK_MS);

    const portfolios = await this.portfoliosService.findAll(userId);
    const portfolioAnalytics = await Promise.all(
      portfolios.map((portfolio) => this.analyticsService.getPortfolioAnalytics(userId, portfolio.id)),
    );

    const [allJournalEntries, allAlerts, allNews] = await Promise.all([
      this.journalService.findAll(userId),
      this.alertsService.findAll(userId),
      this.calendarNewsService.getNewsForTrackedAssets(userId),
    ]);

    const journalEntries = allJournalEntries.filter((entry) => entry.createdAt.getTime() >= periodStart.getTime());
    const triggeredAlerts = allAlerts.filter(
      (alert) => alert.status === 'TRIGGERED' && alert.triggeredAt !== null && alert.triggeredAt.getTime() >= periodStart.getTime(),
    );
    const notableNews = allNews.filter((item) => item.publishedAt.getTime() >= periodStart.getTime());

    return {
      periodStart: periodStart.toISOString(),
      periodEnd: now.toISOString(),
      portfolios: portfolioAnalytics,
      journalEntries,
      triggeredAlerts,
      notableNews,
    };
  }
}
