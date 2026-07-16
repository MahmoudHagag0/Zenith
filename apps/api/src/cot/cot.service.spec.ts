import { Test, TestingModule } from '@nestjs/testing';
import { CotService } from './cot.service';
import { PrismaService } from '../database/prisma.service';
import { AssetsService } from '../assets/assets.service';
import { COT_PROVIDER } from './providers/cot-provider.interface';

describe('CotService', () => {
  let service: CotService;
  let prisma: {
    cotReport: { findMany: jest.Mock; findFirst: jest.Mock; upsert: jest.Mock };
  };
  let assetsService: { findOne: jest.Mock };
  let provider: { getLatestReports: jest.Mock; name: string };

  beforeEach(async () => {
    prisma = {
      cotReport: { findMany: jest.fn(), findFirst: jest.fn(), upsert: jest.fn() },
    };
    assetsService = { findOne: jest.fn() };
    provider = { getLatestReports: jest.fn(), name: 'simulated' };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CotService,
        { provide: PrismaService, useValue: prisma },
        { provide: AssetsService, useValue: assetsService },
        { provide: COT_PROVIDER, useValue: provider },
      ],
    }).compile();

    service = module.get<CotService>(CotService);
  });

  it('fetches fresh reports from the provider when the cache has no recent report', async () => {
    assetsService.findOne.mockResolvedValue({ id: 'asset-1', symbol: 'ZEN' });
    prisma.cotReport.findFirst.mockResolvedValue(null);
    provider.getLatestReports.mockResolvedValue([
      { reportDate: new Date('2026-01-06'), category: 'COMMERCIAL', longPositions: 100, shortPositions: 40 },
    ]);
    prisma.cotReport.findMany.mockResolvedValue([{ id: 'report-1' }]);

    const result = await service.getReportsForAsset('asset-1');

    expect(provider.getLatestReports).toHaveBeenCalledWith('ZEN');
    expect(prisma.cotReport.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ netPosition: 60 }) }),
    );
    expect(result).toEqual([{ id: 'report-1' }]);
  });

  it('does not refetch when the latest cached report is within the freshness window', async () => {
    assetsService.findOne.mockResolvedValue({ id: 'asset-1', symbol: 'ZEN' });
    prisma.cotReport.findFirst.mockResolvedValue({ reportDate: new Date() });
    prisma.cotReport.findMany.mockResolvedValue([{ id: 'report-1' }]);

    await service.getReportsForAsset('asset-1');

    expect(provider.getLatestReports).not.toHaveBeenCalled();
  });

  it('refetches when the latest cached report has aged past the freshness window', async () => {
    assetsService.findOne.mockResolvedValue({ id: 'asset-1', symbol: 'ZEN' });
    prisma.cotReport.findFirst.mockResolvedValue({ reportDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) });
    provider.getLatestReports.mockResolvedValue([]);
    prisma.cotReport.findMany.mockResolvedValue([]);

    await service.getReportsForAsset('asset-1');

    expect(provider.getLatestReports).toHaveBeenCalledWith('ZEN');
  });

  it('computes netPosition as longPositions minus shortPositions', async () => {
    assetsService.findOne.mockResolvedValue({ id: 'asset-1', symbol: 'ZEN' });
    prisma.cotReport.findFirst.mockResolvedValue(null);
    provider.getLatestReports.mockResolvedValue([
      { reportDate: new Date('2026-01-06'), category: 'NON_COMMERCIAL', longPositions: 50, shortPositions: 80 },
    ]);
    prisma.cotReport.findMany.mockResolvedValue([]);

    await service.getReportsForAsset('asset-1');

    expect(prisma.cotReport.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ netPosition: -30 }) }),
    );
  });
});
