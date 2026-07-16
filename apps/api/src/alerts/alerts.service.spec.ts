import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AlertsService } from './alerts.service';
import { PrismaService } from '../database/prisma.service';
import { AssetsService } from '../assets/assets.service';
import { InstrumentReadingService } from '../dashboard/instrument-reading.service';
import { MarketDataService } from '../market-data/market-data.service';

describe('AlertsService', () => {
  let service: AlertsService;
  let prisma: {
    alert: { findUnique: jest.Mock; findMany: jest.Mock; create: jest.Mock; update: jest.Mock; delete: jest.Mock };
  };
  let assetsService: { findOne: jest.Mock };
  let instrumentReadingService: { getInstrumentReading: jest.Mock };
  let marketDataService: { getQuote: jest.Mock };

  beforeEach(async () => {
    prisma = {
      alert: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    assetsService = { findOne: jest.fn() };
    instrumentReadingService = { getInstrumentReading: jest.fn() };
    marketDataService = { getQuote: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AssetsService, useValue: assetsService },
        { provide: InstrumentReadingService, useValue: instrumentReadingService },
        { provide: MarketDataService, useValue: marketDataService },
      ],
    }).compile();

    service = module.get<AlertsService>(AlertsService);
  });

  it('creates an alert owned by the requesting user after verifying the asset exists', async () => {
    assetsService.findOne.mockResolvedValue({ id: 'asset-1' });
    prisma.alert.create.mockResolvedValue({ id: 'alert-1', userId: 'user-1', assetId: 'asset-1', conditionType: 'DIRECTION_BULLISH' });

    const alert = await service.create('user-1', { assetId: 'asset-1', conditionType: 'DIRECTION_BULLISH' } as never);

    expect(alert.userId).toBe('user-1');
    expect(assetsService.findOne).toHaveBeenCalledWith('asset-1');
  });

  it('returns 404 (not 403) when removing an alert owned by another user', async () => {
    prisma.alert.findUnique.mockResolvedValue({ id: 'alert-1', userId: 'someone-else' });

    await expect(service.remove('user-1', 'alert-1')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.alert.delete).not.toHaveBeenCalled();
  });

  it('returns 404 when removing an alert that does not exist', async () => {
    prisma.alert.findUnique.mockResolvedValue(null);

    await expect(service.remove('user-1', 'missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('triggers a DIRECTION_BULLISH alert when the instrument reading turns BULLISH', async () => {
    prisma.alert.findMany.mockResolvedValue([
      { id: 'alert-1', assetId: 'asset-1', conditionType: 'DIRECTION_BULLISH', targetPrice: null, status: 'ACTIVE' },
    ]);
    instrumentReadingService.getInstrumentReading.mockResolvedValue({ netDirection: 'BULLISH' });

    const result = await service.evaluateActiveAlerts();

    expect(result).toEqual({ evaluated: 1, triggered: 1 });
    expect(prisma.alert.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'alert-1' }, data: expect.objectContaining({ status: 'TRIGGERED' }) }),
    );
  });

  it('does not trigger a DIRECTION_BULLISH alert when the reading is NEUTRAL', async () => {
    prisma.alert.findMany.mockResolvedValue([
      { id: 'alert-1', assetId: 'asset-1', conditionType: 'DIRECTION_BULLISH', targetPrice: null, status: 'ACTIVE' },
    ]);
    instrumentReadingService.getInstrumentReading.mockResolvedValue({ netDirection: 'NEUTRAL' });

    const result = await service.evaluateActiveAlerts();

    expect(result).toEqual({ evaluated: 1, triggered: 0 });
    expect(prisma.alert.update).not.toHaveBeenCalled();
  });

  it('triggers a PRICE_ABOVE alert when the cached quote exceeds the target', async () => {
    prisma.alert.findMany.mockResolvedValue([
      { id: 'alert-1', assetId: 'asset-1', conditionType: 'PRICE_ABOVE', targetPrice: { toString: () => '100' }, status: 'ACTIVE' },
    ]);
    marketDataService.getQuote.mockResolvedValue({ price: { toString: () => '150' } });

    const result = await service.evaluateActiveAlerts();

    expect(result).toEqual({ evaluated: 1, triggered: 1 });
  });

  it('fetches the instrument reading/quote at most once per asset even with multiple alerts on it', async () => {
    prisma.alert.findMany.mockResolvedValue([
      { id: 'alert-1', assetId: 'asset-1', conditionType: 'DIRECTION_BULLISH', targetPrice: null, status: 'ACTIVE' },
      { id: 'alert-2', assetId: 'asset-1', conditionType: 'DIRECTION_BEARISH', targetPrice: null, status: 'ACTIVE' },
    ]);
    instrumentReadingService.getInstrumentReading.mockResolvedValue({ netDirection: 'BULLISH' });

    await service.evaluateActiveAlerts();

    expect(instrumentReadingService.getInstrumentReading).toHaveBeenCalledTimes(1);
  });

  it('continues evaluating other assets when one asset fails to compute a reading', async () => {
    prisma.alert.findMany.mockResolvedValue([
      { id: 'alert-1', assetId: 'asset-1', conditionType: 'DIRECTION_BULLISH', targetPrice: null, status: 'ACTIVE' },
      { id: 'alert-2', assetId: 'asset-2', conditionType: 'DIRECTION_BULLISH', targetPrice: null, status: 'ACTIVE' },
    ]);
    instrumentReadingService.getInstrumentReading
      .mockRejectedValueOnce(new Error('db timeout'))
      .mockResolvedValueOnce({ netDirection: 'BULLISH' });

    const result = await service.evaluateActiveAlerts();

    expect(result).toEqual({ evaluated: 2, triggered: 1 });
  });
});
