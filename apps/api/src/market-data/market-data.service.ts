import { BadRequestException, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@zenith/database';
import { PrismaService } from '../database/prisma.service';
import { AssetsService } from '../assets/assets.service';
import { RateLimiterService } from './rate-limiter.service';
import { withRetry } from './retry.util';
import { ProviderRateLimitedError, ProviderUnavailableError } from './providers/provider-errors';
import { MARKET_DATA_PROVIDER, type MarketDataProvider } from './providers/market-data-provider.interface';

const QUOTE_TTL_MS = 15_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CANDLE_RANGE_MS = 5 * 365 * DAY_MS;

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

@Injectable()
export class MarketDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly assetsService: AssetsService,
    private readonly rateLimiter: RateLimiterService,
    @Inject(MARKET_DATA_PROVIDER) private readonly provider: MarketDataProvider,
  ) {}

  searchAssets(query: string) {
    return this.prisma.asset.findMany({
      where: {
        OR: [{ symbol: { contains: query, mode: 'insensitive' } }, { name: { contains: query, mode: 'insensitive' } }],
      },
      orderBy: { symbol: 'asc' },
      take: 25,
    });
  }

  async getAsset(assetId: string) {
    const asset = await this.assetsService.findOne(assetId);
    const quote = await this.prisma.marketQuote.findUnique({ where: { assetId } });
    return { ...asset, quote };
  }

  async getQuote(assetId: string) {
    const asset = await this.assetsService.findOne(assetId);
    const cached = await this.prisma.marketQuote.findUnique({ where: { assetId } });
    if (cached && Date.now() - cached.fetchedAt.getTime() < QUOTE_TTL_MS) {
      return cached;
    }

    const providerQuote = await this.callProvider(() => this.provider.getQuote(asset.symbol));

    return this.prisma.marketQuote.upsert({
      where: { assetId },
      create: {
        assetId,
        price: new Prisma.Decimal(providerQuote.price),
        currency: providerQuote.currency,
        provider: this.provider.name,
        asOf: providerQuote.asOf,
      },
      update: {
        price: new Prisma.Decimal(providerQuote.price),
        currency: providerQuote.currency,
        provider: this.provider.name,
        asOf: providerQuote.asOf,
      },
    });
  }

  async getCandles(assetId: string, from: Date, to: Date) {
    const asset = await this.assetsService.findOne(assetId);

    if (from.getTime() > to.getTime()) {
      throw new BadRequestException('from must not be after to');
    }
    if (to.getTime() - from.getTime() > MAX_CANDLE_RANGE_MS) {
      throw new BadRequestException('Date range is too large (maximum 5 years)');
    }

    const start = startOfUtcDay(from);
    const end = startOfUtcDay(to);
    const expectedDays = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;

    const existing = await this.prisma.candle.findMany({
      where: { assetId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    });

    if (existing.length >= expectedDays) {
      return existing;
    }

    const providerCandles = await this.callProvider(() => this.provider.getCandles(asset.symbol, start, end));

    await Promise.all(
      providerCandles.map((candle) =>
        this.prisma.candle.upsert({
          where: { assetId_date: { assetId, date: candle.date } },
          create: {
            assetId,
            date: candle.date,
            open: new Prisma.Decimal(candle.open),
            high: new Prisma.Decimal(candle.high),
            low: new Prisma.Decimal(candle.low),
            close: new Prisma.Decimal(candle.close),
            volume: new Prisma.Decimal(candle.volume),
            provider: this.provider.name,
          },
          update: {
            open: new Prisma.Decimal(candle.open),
            high: new Prisma.Decimal(candle.high),
            low: new Prisma.Decimal(candle.low),
            close: new Prisma.Decimal(candle.close),
            volume: new Prisma.Decimal(candle.volume),
            provider: this.provider.name,
          },
        }),
      ),
    );

    return this.prisma.candle.findMany({
      where: { assetId, date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    });
  }

  async checkProviderHealth() {
    const status = await this.provider.checkHealth();
    return { provider: this.provider.name, status, checkedAt: new Date() };
  }

  private async callProvider<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await withRetry(
        async () => {
          this.rateLimiter.acquire();
          return fn();
        },
        {
          retries: 3,
          baseDelayMs: 50,
          isRetryable: (error) =>
            error instanceof ProviderRateLimitedError || error instanceof ProviderUnavailableError,
        },
      );
    } catch (error) {
      // Retries are exhausted at this point — surface a clean, well-typed
      // HTTP error instead of letting the raw provider error propagate as
      // an opaque 500.
      if (error instanceof ProviderRateLimitedError) {
        throw new HttpException(
          'Market data provider rate limit exceeded — please try again shortly',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (error instanceof ProviderUnavailableError) {
        throw new HttpException(
          'Market data provider is temporarily unavailable — please try again shortly',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }
      throw error;
    }
  }
}
