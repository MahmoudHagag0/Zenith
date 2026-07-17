import { Test, TestingModule } from '@nestjs/testing';
import { MacroDataService } from './macro-data.service';
import { PrismaService } from '../database/prisma.service';
import { MACRO_DATA_PROVIDER } from './providers/macro-data-provider.interface';
import { TRACKED_MACRO_SERIES } from './tracked-macro-series';

describe('MacroDataService', () => {
  let service: MacroDataService;
  let prisma: {
    macroSeriesValue: { findFirst: jest.Mock; upsert: jest.Mock };
  };
  let provider: { getLatestSeriesValue: jest.Mock; name: string };

  beforeEach(async () => {
    prisma = {
      macroSeriesValue: { findFirst: jest.fn(), upsert: jest.fn() },
    };
    provider = { getLatestSeriesValue: jest.fn(), name: 'fred' };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MacroDataService,
        { provide: PrismaService, useValue: prisma },
        { provide: MACRO_DATA_PROVIDER, useValue: provider },
      ],
    }).compile();

    service = module.get<MacroDataService>(MacroDataService);
  });

  describe('getLatestValues', () => {
    it('returns the latest stored observation for each tracked series, filtering out series with no data yet', async () => {
      prisma.macroSeriesValue.findFirst.mockImplementation(({ where }: { where: { seriesId: string } }) =>
        where.seriesId === TRACKED_MACRO_SERIES[0] ? Promise.resolve({ seriesId: TRACKED_MACRO_SERIES[0], value: 5.33 }) : Promise.resolve(null),
      );

      const result = await service.getLatestValues();

      expect(result).toEqual([{ seriesId: TRACKED_MACRO_SERIES[0], value: 5.33 }]);
      expect(prisma.macroSeriesValue.findFirst).toHaveBeenCalledTimes(TRACKED_MACRO_SERIES.length);
    });
  });

  describe('syncSeries', () => {
    it('fetches and upserts a fresh observation when the cache has nothing recent', async () => {
      prisma.macroSeriesValue.findFirst.mockResolvedValue(null);
      provider.getLatestSeriesValue.mockResolvedValue({
        seriesId: 'FEDFUNDS',
        observationDate: new Date('2026-06-01'),
        value: 5.33,
        raw: { a: 1 },
      });

      await service.syncSeries('FEDFUNDS');

      expect(provider.getLatestSeriesValue).toHaveBeenCalledWith('FEDFUNDS');
      expect(prisma.macroSeriesValue.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { seriesId_observationDate: { seriesId: 'FEDFUNDS', observationDate: new Date('2026-06-01') } },
          create: expect.objectContaining({ seriesId: 'FEDFUNDS', value: 5.33, provider: 'fred' }),
        }),
      );
    });

    it('does not refetch when the cache was refreshed within the last 24h', async () => {
      prisma.macroSeriesValue.findFirst.mockResolvedValue({ retrievedAt: new Date() });

      await service.syncSeries('FEDFUNDS');

      expect(provider.getLatestSeriesValue).not.toHaveBeenCalled();
    });

    it('refetches when the cache has aged past the 24h freshness window', async () => {
      prisma.macroSeriesValue.findFirst.mockResolvedValue({ retrievedAt: new Date(Date.now() - 48 * 60 * 60 * 1000) });
      provider.getLatestSeriesValue.mockResolvedValue(null);

      await service.syncSeries('FEDFUNDS');

      expect(provider.getLatestSeriesValue).toHaveBeenCalledWith('FEDFUNDS');
    });

    it('does not upsert when the provider returns no observation', async () => {
      prisma.macroSeriesValue.findFirst.mockResolvedValue(null);
      provider.getLatestSeriesValue.mockResolvedValue(null);

      await service.syncSeries('FEDFUNDS');

      expect(prisma.macroSeriesValue.upsert).not.toHaveBeenCalled();
    });

    it('re-processing the same series twice upserts against the same natural key rather than creating a duplicate', async () => {
      prisma.macroSeriesValue.findFirst.mockResolvedValue(null);
      const observation = { seriesId: 'FEDFUNDS', observationDate: new Date('2026-06-01'), value: 5.33, raw: {} };
      provider.getLatestSeriesValue.mockResolvedValue(observation);

      await service.syncSeries('FEDFUNDS');
      await service.syncSeries('FEDFUNDS');

      expect(prisma.macroSeriesValue.upsert).toHaveBeenCalledTimes(2);
      const [firstCall, secondCall] = prisma.macroSeriesValue.upsert.mock.calls;
      expect(firstCall[0].where).toEqual(secondCall[0].where);
    });

    it('only ever touches the macroSeriesValue Prisma model', async () => {
      prisma.macroSeriesValue.findFirst.mockResolvedValue(null);
      provider.getLatestSeriesValue.mockResolvedValue({
        seriesId: 'FEDFUNDS',
        observationDate: new Date('2026-06-01'),
        value: 5.33,
        raw: {},
      });

      await service.syncSeries('FEDFUNDS');

      expect(Object.keys(prisma)).toEqual(['macroSeriesValue']);
    });
  });
});
