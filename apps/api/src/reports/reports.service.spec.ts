import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PortfoliosService } from '../portfolios/portfolios.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { JournalService } from '../journal/journal.service';
import { AlertsService } from '../alerts/alerts.service';
import { CalendarNewsService } from '../calendar-news/calendar-news.service';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('ReportsService', () => {
  let service: ReportsService;
  let portfoliosService: { findAll: jest.Mock };
  let analyticsService: { getPortfolioAnalytics: jest.Mock };
  let journalService: { findAll: jest.Mock };
  let alertsService: { findAll: jest.Mock };
  let calendarNewsService: { getNewsForTrackedAssets: jest.Mock };

  beforeEach(async () => {
    portfoliosService = { findAll: jest.fn().mockResolvedValue([{ id: 'portfolio-1' }]) };
    analyticsService = { getPortfolioAnalytics: jest.fn().mockResolvedValue({ portfolioId: 'portfolio-1' }) };
    journalService = { findAll: jest.fn().mockResolvedValue([]) };
    alertsService = { findAll: jest.fn().mockResolvedValue([]) };
    calendarNewsService = { getNewsForTrackedAssets: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PortfoliosService, useValue: portfoliosService },
        { provide: AnalyticsService, useValue: analyticsService },
        { provide: JournalService, useValue: journalService },
        { provide: AlertsService, useValue: alertsService },
        { provide: CalendarNewsService, useValue: calendarNewsService },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
  });

  it('fetches analytics for every one of the user\'s portfolios', async () => {
    const report = await service.getWeeklyReport('user-1');

    expect(analyticsService.getPortfolioAnalytics).toHaveBeenCalledWith('user-1', 'portfolio-1');
    expect(report.portfolios).toEqual([{ portfolioId: 'portfolio-1' }]);
  });

  it('includes only journal entries created within the last week', async () => {
    journalService.findAll.mockResolvedValue([
      { id: 'je-recent', createdAt: new Date(Date.now() - 2 * DAY_MS) },
      { id: 'je-old', createdAt: new Date(Date.now() - 30 * DAY_MS) },
    ]);

    const report = await service.getWeeklyReport('user-1');

    expect(report.journalEntries).toEqual([{ id: 'je-recent', createdAt: expect.any(Date) }]);
  });

  it('includes only alerts triggered within the last week, excluding still-active alerts', async () => {
    alertsService.findAll.mockResolvedValue([
      { id: 'alert-recent', status: 'TRIGGERED', triggeredAt: new Date(Date.now() - 1 * DAY_MS) },
      { id: 'alert-old', status: 'TRIGGERED', triggeredAt: new Date(Date.now() - 30 * DAY_MS) },
      { id: 'alert-active', status: 'ACTIVE', triggeredAt: null },
    ]);

    const report = await service.getWeeklyReport('user-1');

    expect(report.triggeredAlerts.map((a: { id: string }) => a.id)).toEqual(['alert-recent']);
  });

  it('includes only news published within the last week', async () => {
    calendarNewsService.getNewsForTrackedAssets.mockResolvedValue([
      { id: 'news-recent', publishedAt: new Date(Date.now() - 1 * DAY_MS) },
      { id: 'news-old', publishedAt: new Date(Date.now() - 30 * DAY_MS) },
    ]);

    const report = await service.getWeeklyReport('user-1');

    expect(report.notableNews.map((n: { id: string }) => n.id)).toEqual(['news-recent']);
  });
});
