import { Test, TestingModule } from '@nestjs/testing';
import { WorkspaceService } from './workspace.service';
import { AssetsService } from '../assets/assets.service';
import { InstrumentReadingService } from '../dashboard/instrument-reading.service';
import { CalendarNewsService } from '../calendar-news/calendar-news.service';
import { CotService } from '../cot/cot.service';
import { AlertsService } from '../alerts/alerts.service';
import { JournalService } from '../journal/journal.service';

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let assetsService: { findOne: jest.Mock };
  let instrumentReadingService: { getInstrumentReading: jest.Mock };
  let calendarNewsService: { getNewsForAsset: jest.Mock; getUpcomingEventsForAsset: jest.Mock };
  let cotService: { getReportsForAsset: jest.Mock };
  let alertsService: { findByAsset: jest.Mock };
  let journalService: { findByAsset: jest.Mock };

  beforeEach(async () => {
    assetsService = { findOne: jest.fn().mockResolvedValue({ id: 'asset-1', symbol: 'ZEN', name: 'Zenith Demo' }) };
    instrumentReadingService = { getInstrumentReading: jest.fn() };
    calendarNewsService = { getNewsForAsset: jest.fn().mockResolvedValue([]), getUpcomingEventsForAsset: jest.fn().mockResolvedValue([]) };
    cotService = { getReportsForAsset: jest.fn().mockResolvedValue([]) };
    alertsService = { findByAsset: jest.fn().mockResolvedValue([]) };
    journalService = { findByAsset: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        { provide: AssetsService, useValue: assetsService },
        { provide: InstrumentReadingService, useValue: instrumentReadingService },
        { provide: CalendarNewsService, useValue: calendarNewsService },
        { provide: CotService, useValue: cotService },
        { provide: AlertsService, useValue: alertsService },
        { provide: JournalService, useValue: journalService },
      ],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);
  });

  it('assembles a workspace view from every underlying service for the given asset and user', async () => {
    instrumentReadingService.getInstrumentReading.mockResolvedValue({ netDirection: 'BULLISH' });

    const workspace = await service.getWorkspace('user-1', 'asset-1');

    expect(workspace.assetId).toBe('asset-1');
    expect(workspace.symbol).toBe('ZEN');
    expect(workspace.reading).toEqual({ netDirection: 'BULLISH' });
    expect(workspace.readingFailureReason).toBeNull();
    expect(alertsService.findByAsset).toHaveBeenCalledWith('user-1', 'asset-1');
    expect(journalService.findByAsset).toHaveBeenCalledWith('user-1', 'asset-1');
  });

  it('discloses a failed instrument reading instead of aborting the whole workspace', async () => {
    instrumentReadingService.getInstrumentReading.mockRejectedValue(new Error('insufficient data'));

    const workspace = await service.getWorkspace('user-1', 'asset-1');

    expect(workspace.reading).toBeNull();
    expect(workspace.readingFailureReason).toBe('insufficient data');
    expect(workspace.news).toEqual([]);
  });

  it('collapses COT reports to the latest one per category', async () => {
    instrumentReadingService.getInstrumentReading.mockResolvedValue({ netDirection: 'NEUTRAL' });
    cotService.getReportsForAsset.mockResolvedValue([
      { category: 'COMMERCIAL', reportDate: new Date('2026-02-01') },
      { category: 'NON_COMMERCIAL', reportDate: new Date('2026-02-01') },
      { category: 'COMMERCIAL', reportDate: new Date('2026-01-25') },
    ]);

    const workspace = await service.getWorkspace('user-1', 'asset-1');

    expect(workspace.cotReports).toEqual([
      { category: 'COMMERCIAL', reportDate: new Date('2026-02-01') },
      { category: 'NON_COMMERCIAL', reportDate: new Date('2026-02-01') },
    ]);
  });
});
