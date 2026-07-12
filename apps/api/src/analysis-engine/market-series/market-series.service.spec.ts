import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { MarketSeriesService } from './market-series.service';
import { MarketDataService } from '../../market-data/market-data.service';

describe('MarketSeriesService', () => {
  let service: MarketSeriesService;
  let marketDataService: { getCandles: jest.Mock; getQuote: jest.Mock };

  function candle(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'c-1',
      assetId: 'asset-1',
      date: new Date('2026-07-10T00:00:00.000Z'),
      open: new Prisma.Decimal(100),
      high: new Prisma.Decimal(105),
      low: new Prisma.Decimal(99),
      close: new Prisma.Decimal(103),
      volume: new Prisma.Decimal(1000),
      provider: 'simulated',
      createdAt: new Date('2026-07-10T00:00:00.000Z'),
      ...overrides,
    };
  }

  function quote(overrides: Partial<Record<string, unknown>> = {}) {
    return {
      id: 'q-1',
      assetId: 'asset-1',
      price: new Prisma.Decimal(103.5),
      currency: 'USD',
      provider: 'simulated',
      asOf: new Date('2026-07-12T11:59:00.000Z'),
      fetchedAt: new Date('2026-07-12T11:59:00.000Z'),
      updatedAt: new Date('2026-07-12T11:59:00.000Z'),
      ...overrides,
    };
  }

  beforeEach(async () => {
    marketDataService = {
      getCandles: jest.fn().mockResolvedValue([candle()]),
      getQuote: jest.fn().mockResolvedValue(quote()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MarketSeriesService, { provide: MarketDataService, useValue: marketDataService }],
    }).compile();

    service = module.get(MarketSeriesService);
    jest.useFakeTimers().setSystemTime(new Date('2026-07-12T12:00:00.000Z'));
  });

  afterEach(() => jest.useRealTimers());

  it('translates candles into historical points with completeness PRESENT', async () => {
    const series = await service.getSeries(
      'asset-1',
      new Date('2026-07-10T00:00:00.000Z'),
      new Date('2026-07-10T00:00:00.000Z'),
    );
    expect(series.points).toHaveLength(1);
    expect(series.points[0].dataQuality).toEqual({ kind: 'historical', completeness: 'PRESENT' });
    expect(series.points[0].close.toString()).toBe('103');
  });

  it('reports gaps in the requested range as missingDates, not as an inline per-point marker', async () => {
    marketDataService.getCandles.mockResolvedValue([candle({ date: new Date('2026-07-10T00:00:00.000Z') })]);
    const series = await service.getSeries(
      'asset-1',
      new Date('2026-07-10T00:00:00.000Z'),
      new Date('2026-07-12T00:00:00.000Z'),
    );
    expect(series.missingDates).toEqual(['2026-07-11', '2026-07-12']);
    expect(series.points).toHaveLength(1);
  });

  it('never marks a historical point STALE regardless of its age', async () => {
    // A candle from three years ago is old, but "old" does not mean "stale"
    // for historical, completeness-based Data Quality.
    marketDataService.getCandles.mockResolvedValue([candle({ date: new Date('2023-07-10T00:00:00.000Z') })]);
    const series = await service.getSeries(
      'asset-1',
      new Date('2023-07-10T00:00:00.000Z'),
      new Date('2023-07-10T00:00:00.000Z'),
    );
    expect(series.points[0].dataQuality.completeness).toBe('PRESENT');
    expect(series.points[0].dataQuality).not.toHaveProperty('freshness');
  });

  it('marks the current quote FRESH when recently fetched', async () => {
    marketDataService.getQuote.mockResolvedValue(quote({ fetchedAt: new Date('2026-07-12T11:59:00.000Z') }));
    const series = await service.getSeries('asset-1', new Date('2026-07-10T00:00:00.000Z'), new Date('2026-07-10T00:00:00.000Z'));
    expect(series.currentQuote.dataQuality).toEqual({ kind: 'current', freshness: 'FRESH' });
    expect(series.currentQuote.ageSeconds).toBe(60);
  });

  it('marks the current quote STALE when older than the 5-minute threshold, distinct from historical completeness', async () => {
    marketDataService.getQuote.mockResolvedValue(quote({ fetchedAt: new Date('2026-07-12T11:00:00.000Z') }));
    const series = await service.getSeries('asset-1', new Date('2026-07-10T00:00:00.000Z'), new Date('2026-07-10T00:00:00.000Z'));
    expect(series.currentQuote.dataQuality).toEqual({ kind: 'current', freshness: 'STALE' });
  });

  it('marks the current quote MISSING, with all fields null, when no quote exists', async () => {
    marketDataService.getQuote.mockResolvedValue(null);
    const series = await service.getSeries('asset-1', new Date('2026-07-10T00:00:00.000Z'), new Date('2026-07-10T00:00:00.000Z'));
    expect(series.currentQuote).toEqual({
      price: null,
      currency: null,
      asOf: null,
      fetchedAt: null,
      ageSeconds: null,
      dataQuality: { kind: 'current', freshness: 'MISSING' },
    });
  });

  it('degrades to MISSING (never throws) when the quote fetch itself fails', async () => {
    marketDataService.getQuote.mockRejectedValue(new Error('provider unavailable'));
    const series = await service.getSeries('asset-1', new Date('2026-07-10T00:00:00.000Z'), new Date('2026-07-10T00:00:00.000Z'));
    expect(series.currentQuote.dataQuality.freshness).toBe('MISSING');
  });

  it('propagates a genuine getCandles input-validation error rather than swallowing it', async () => {
    marketDataService.getCandles.mockRejectedValue(new Error('from must not be after to'));
    await expect(
      service.getSeries('asset-1', new Date('2026-07-12T00:00:00.000Z'), new Date('2026-07-10T00:00:00.000Z')),
    ).rejects.toThrow('from must not be after to');
  });

  it('sorts points ascending by timestamp regardless of input order', async () => {
    marketDataService.getCandles.mockResolvedValue([
      candle({ date: new Date('2026-07-11T00:00:00.000Z') }),
      candle({ date: new Date('2026-07-09T00:00:00.000Z') }),
      candle({ date: new Date('2026-07-10T00:00:00.000Z') }),
    ]);
    const series = await service.getSeries('asset-1', new Date('2026-07-09T00:00:00.000Z'), new Date('2026-07-11T00:00:00.000Z'));
    expect(series.points.map((p) => p.timestamp.toISOString())).toEqual([
      '2026-07-09T00:00:00.000Z',
      '2026-07-10T00:00:00.000Z',
      '2026-07-11T00:00:00.000Z',
    ]);
  });
});
