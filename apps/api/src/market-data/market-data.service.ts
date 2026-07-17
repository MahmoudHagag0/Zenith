import { BadRequestException, HttpException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@zenith/database';
import { PrismaService } from '../database/prisma.service';
import { AssetsService } from '../assets/assets.service';
import { RateLimiterService } from './rate-limiter.service';
import { withRetry } from './retry.util';
import { ProviderRateLimitedError, ProviderUnavailableError } from './providers/provider-errors';
import { MARKET_DATA_PROVIDER, type MarketDataProvider } from './providers/market-data-provider.interface';
import { MARKET_SESSION_PROVIDER, type MarketSessionProvider } from './providers/market-session-provider.interface';
import { INSTRUMENT_METADATA_PROVIDER, type InstrumentMetadataProvider } from './providers/instrument-metadata-provider.interface';

/** Discriminated result of MarketDataService.searchAssets() -- CATALOG entries are real, addable Asset rows; LIVE entries are informational-only results from InstrumentMetadataProvider (L1-005) and are never persisted. */
export interface AssetSearchResult {
  readonly source: 'CATALOG' | 'LIVE';
  readonly id?: string;
  readonly marketId?: string;
  readonly symbol: string;
  readonly name: string;
  readonly exchange?: string;
}

const QUOTE_TTL_MS = 15_000;
const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CANDLE_RANGE_MS = 5 * 365 * DAY_MS;

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly assetsService: AssetsService,
    private readonly rateLimiter: RateLimiterService,
    @Inject(MARKET_DATA_PROVIDER) private readonly provider: MarketDataProvider,
    @Inject(MARKET_SESSION_PROVIDER) private readonly marketSessionProvider: MarketSessionProvider,
    @Inject(INSTRUMENT_METADATA_PROVIDER) private readonly instrumentMetadataProvider: InstrumentMetadataProvider,
  ) {}

  /**
   * Search the trading catalog first (existing behavior, unchanged); only
   * when the catalog has no match does this fall back to
   * InstrumentMetadataProvider for a live, informational-only preview
   * (L1-002 Sprint Brief architecture decision, 2026-07-16). Live results
   * are never persisted and never create or mutate an Asset row -- the
   * existing Asset Catalog (S1-003) remains the single source of truth;
   * catalog management remains an intentional administrative operation.
   * A live-provider failure degrades to the catalog-only result (empty),
   * never breaking the search itself.
   */
  async searchAssets(query: string): Promise<AssetSearchResult[]> {
    const catalogMatches = await this.prisma.asset.findMany({
      where: {
        OR: [{ symbol: { contains: query, mode: 'insensitive' } }, { name: { contains: query, mode: 'insensitive' } }],
      },
      orderBy: { symbol: 'asc' },
      take: 25,
    });

    if (catalogMatches.length > 0) {
      return catalogMatches.map((asset) => ({
        source: 'CATALOG' as const,
        id: asset.id,
        marketId: asset.marketId,
        symbol: asset.symbol,
        name: asset.name,
      }));
    }

    const liveMatches = await this.instrumentMetadataProvider.searchSymbols(query).catch((error: unknown) => {
      this.logger.warn(`Live symbol search failed for query "${query}": ${(error as Error).message}`);
      return [];
    });
    return liveMatches.map((match) => ({ source: 'LIVE' as const, symbol: match.symbol, name: match.name, exchange: match.exchange }));
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

    // `fetchedAt` uses `@default(now())`, which Prisma applies only on
    // INSERT, not UPDATE — it must be set explicitly here on every refetch,
    // or the TTL check above would compare against the row's original
    // creation time forever, making every quote appear permanently stale
    // after the first TTL window and defeating the cache entirely.
    const fetchedAt = new Date();
    return this.prisma.marketQuote.upsert({
      where: { assetId },
      create: {
        assetId,
        price: new Prisma.Decimal(providerQuote.price),
        currency: providerQuote.currency,
        provider: this.provider.name,
        asOf: providerQuote.asOf,
        fetchedAt,
      },
      update: {
        price: new Prisma.Decimal(providerQuote.price),
        currency: providerQuote.currency,
        provider: this.provider.name,
        asOf: providerQuote.asOf,
        fetchedAt,
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

  /**
   * Surfaces the L1-002 Market Sessions Table result for one asset's
   * exchange, for Dashboard/Watchlist "market closed" UI state
   * (28_LIVE_DATA_BLUEPRINT.md §9 Phase 2). A distinct, minimal read-only
   * lookup -- deliberately not folded into getQuote()/getAsset(), which
   * predate this Sprint and are unrelated to session/holiday data.
   */
  async getMarketStatus(assetId: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: assetId },
      select: { market: { select: { exchange: { select: { code: true } } } } },
    });
    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    const exchangeCode = asset.market.exchange.code;
    const status = await this.marketSessionProvider.getMarketStatus(exchangeCode);
    return { assetId, exchangeCode, status };
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
