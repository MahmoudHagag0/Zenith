import { BadRequestException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { MarketDataService } from './market-data.service';
import { PrismaService } from '../database/prisma.service';
import { AssetsService } from '../assets/assets.service';
import { RateLimiterService } from './rate-limiter.service';
import { ProviderRateLimitedError, ProviderUnavailableError } from './providers/provider-errors';
import { MARKET_DATA_PROVIDER, type MarketDataProvider } from './providers/market-data-provider.interface';

describe('MarketDataService', () => {
  let service: MarketDataService;
  let prisma: {
    asset: { findMany: jest.Mock };
    marketQuote: { findUnique: jest.Mock; upsert: jest.Mock };
    candle: { findMany: jest.Mock; upsert: jest.Mock };
  };
  let assetsService: { findOne: jest.Mock };
  let rateLimiter: { acquire: jest.Mock };
  let provider: jest.Mocked<MarketDataProvider>;

  const ASSET = { id: 'asset-1', symbol: 'AAPL', name: 'Apple Inc.' };

  beforeEach(async () => {
    prisma = {
      asset: { findMany: jest.fn() },
      marketQuote: { findUnique: jest.fn(), upsert: jest.fn() },
      candle: { findMany: jest.fn(), upsert: jest.fn() },
    };
    assetsService = { findOne: jest.fn().mockResolvedValue(ASSET) };
    rateLimiter = { acquire: jest.fn() };
    provider = {
      name: 'test-provider',
      getQuote: jest.fn(),
      getCandles: jest.fn(),
      checkHealth: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketDataService,
        { provide: PrismaService, useValue: prisma },
        { provide: AssetsService, useValue: assetsService },
        { provide: RateLimiterService, useValue: rateLimiter },
        { provide: MARKET_DATA_PROVIDER, useValue: provider },
      ],
    }).compile();

    service = module.get<MarketDataService>(MarketDataService);
  });

  describe('getQuote', () => {
    it('returns the cached quote without calling the provider when fresh', async () => {
      prisma.marketQuote.findUnique.mockResolvedValue({
        assetId: 'asset-1',
        price: new Prisma.Decimal(150),
        fetchedAt: new Date(),
      });

      const quote = await service.getQuote('asset-1');

      expect(quote.price.toString()).toBe('150');
      expect(provider.getQuote).not.toHaveBeenCalled();
    });

    it('calls the provider and upserts the cache when there is no cached quote', async () => {
      prisma.marketQuote.findUnique.mockResolvedValue(null);
      provider.getQuote.mockResolvedValue({ symbol: 'AAPL', price: 200, currency: 'USD', asOf: new Date() });
      prisma.marketQuote.upsert.mockImplementation(({ create }) => create);

      const quote = await service.getQuote('asset-1');

      expect(provider.getQuote).toHaveBeenCalledWith('AAPL');
      expect(quote.price.toString()).toBe('200');
    });

    it('calls the provider again when the cached quote has expired', async () => {
      prisma.marketQuote.findUnique.mockResolvedValue({
        assetId: 'asset-1',
        price: new Prisma.Decimal(100),
        fetchedAt: new Date(Date.now() - 60_000),
      });
      provider.getQuote.mockResolvedValue({ symbol: 'AAPL', price: 210, currency: 'USD', asOf: new Date() });
      prisma.marketQuote.upsert.mockImplementation(({ create }) => create);

      const quote = await service.getQuote('asset-1');

      expect(provider.getQuote).toHaveBeenCalled();
      expect(quote.price.toString()).toBe('210');
    });

    it('refreshes fetchedAt on an update (not just on first insert), so the cache does not become permanently stale', async () => {
      // Regression test: @default(now()) on `fetchedAt` only fires on INSERT.
      // If the upsert's `update` branch omits `fetchedAt`, every quote past
      // its first TTL window would compare against its original creation
      // time forever, making the cache permanently appear expired.
      prisma.marketQuote.findUnique.mockResolvedValue({
        assetId: 'asset-1',
        price: new Prisma.Decimal(100),
        fetchedAt: new Date(Date.now() - 60_000),
      });
      provider.getQuote.mockResolvedValue({ symbol: 'AAPL', price: 210, currency: 'USD', asOf: new Date() });
      prisma.marketQuote.upsert.mockImplementation(({ update }) => update);

      const quote = await service.getQuote('asset-1');

      expect(prisma.marketQuote.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ fetchedAt: expect.any(Date) }),
          update: expect.objectContaining({ fetchedAt: expect.any(Date) }),
        }),
      );
      const ageMs = Date.now() - (quote.fetchedAt as Date).getTime();
      expect(ageMs).toBeLessThan(1000);
    });

    it('propagates NotFoundException for a non-existent asset without calling the provider', async () => {
      assetsService.findOne.mockRejectedValue(new NotFoundException('Asset not found'));

      await expect(service.getQuote('missing')).rejects.toBeInstanceOf(NotFoundException);
      expect(provider.getQuote).not.toHaveBeenCalled();
    });

    it('retries and recovers from a transient provider failure', async () => {
      prisma.marketQuote.findUnique.mockResolvedValue(null);
      provider.getQuote
        .mockRejectedValueOnce(new ProviderUnavailableError())
        .mockResolvedValue({ symbol: 'AAPL', price: 175, currency: 'USD', asOf: new Date() });
      prisma.marketQuote.upsert.mockImplementation(({ create }) => create);

      const quote = await service.getQuote('asset-1');

      expect(provider.getQuote).toHaveBeenCalledTimes(2);
      expect(quote.price.toString()).toBe('175');
    });

    it('retries after a simulated rate-limit rejection and eventually succeeds', async () => {
      prisma.marketQuote.findUnique.mockResolvedValue(null);
      rateLimiter.acquire
        .mockImplementationOnce(() => {
          throw new ProviderRateLimitedError();
        })
        .mockImplementation(() => undefined);
      provider.getQuote.mockResolvedValue({ symbol: 'AAPL', price: 180, currency: 'USD', asOf: new Date() });
      prisma.marketQuote.upsert.mockImplementation(({ create }) => create);

      const quote = await service.getQuote('asset-1');

      expect(rateLimiter.acquire).toHaveBeenCalledTimes(2);
      expect(provider.getQuote).toHaveBeenCalledTimes(1);
      expect(quote.price.toString()).toBe('180');
    });

    it('surfaces a clean 429, not a raw 500, once rate-limit retries are exhausted', async () => {
      prisma.marketQuote.findUnique.mockResolvedValue(null);
      rateLimiter.acquire.mockImplementation(() => {
        throw new ProviderRateLimitedError();
      });

      const error: unknown = await service.getQuote('asset-1').catch((e) => e);

      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    });

    it('surfaces a clean 503, not a raw 500, once provider-unavailable retries are exhausted', async () => {
      prisma.marketQuote.findUnique.mockResolvedValue(null);
      provider.getQuote.mockRejectedValue(new ProviderUnavailableError());

      const error: unknown = await service.getQuote('asset-1').catch((e) => e);

      expect(error).toBeInstanceOf(HttpException);
      expect((error as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    });
  });

  describe('getCandles', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-01-03T00:00:00.000Z');

    it('returns cached candles without calling the provider when the full range is cached', async () => {
      prisma.candle.findMany.mockResolvedValue([
        { date: new Date('2026-01-01T00:00:00.000Z') },
        { date: new Date('2026-01-02T00:00:00.000Z') },
        { date: new Date('2026-01-03T00:00:00.000Z') },
      ]);

      const candles = await service.getCandles('asset-1', from, to);

      expect(candles).toHaveLength(3);
      expect(provider.getCandles).not.toHaveBeenCalled();
    });

    it('calls the provider and persists candles when the range is only partially cached', async () => {
      prisma.candle.findMany
        .mockResolvedValueOnce([{ date: new Date('2026-01-01T00:00:00.000Z') }])
        .mockResolvedValueOnce([
          { date: new Date('2026-01-01T00:00:00.000Z') },
          { date: new Date('2026-01-02T00:00:00.000Z') },
          { date: new Date('2026-01-03T00:00:00.000Z') },
        ]);
      provider.getCandles.mockResolvedValue([
        { date: new Date('2026-01-01T00:00:00.000Z'), open: 1, high: 2, low: 0.5, close: 1.5, volume: 100 },
        { date: new Date('2026-01-02T00:00:00.000Z'), open: 1, high: 2, low: 0.5, close: 1.5, volume: 100 },
        { date: new Date('2026-01-03T00:00:00.000Z'), open: 1, high: 2, low: 0.5, close: 1.5, volume: 100 },
      ]);
      prisma.candle.upsert.mockResolvedValue({});

      const candles = await service.getCandles('asset-1', from, to);

      expect(provider.getCandles).toHaveBeenCalledWith('AAPL', from, to);
      expect(prisma.candle.upsert).toHaveBeenCalledTimes(3);
      expect(candles).toHaveLength(3);
    });

    it('rejects an inverted date range without calling the provider', async () => {
      await expect(service.getCandles('asset-1', to, from)).rejects.toBeInstanceOf(BadRequestException);
      expect(provider.getCandles).not.toHaveBeenCalled();
    });

    it('rejects a date range spanning more than 5 years', async () => {
      const farFuture = new Date('2032-01-01T00:00:00.000Z');

      await expect(service.getCandles('asset-1', from, farFuture)).rejects.toBeInstanceOf(BadRequestException);
      expect(provider.getCandles).not.toHaveBeenCalled();
    });
  });

  describe('checkProviderHealth', () => {
    it('reports the provider name and health status', async () => {
      provider.checkHealth.mockResolvedValue('UP');

      const result = await service.checkProviderHealth();

      expect(result).toMatchObject({ provider: 'test-provider', status: 'UP' });
    });
  });
});
