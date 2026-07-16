import { Injectable, Logger } from '@nestjs/common';
import type { MarketDataProvider, ProviderCandle, ProviderHealthStatus, ProviderQuote } from './market-data-provider.interface';
import { MarketDataHttpClient } from './http-client';
import { ProviderUnavailableError } from './provider-errors';
import { twelveDataErrorSchema, twelveDataQuoteSchema, twelveDataTimeSeriesSchema } from './twelve-data.schemas';
import { normalizeCandles, normalizeQuote } from './twelve-data.normalize';

const BASE_URL = 'https://api.twelvedata.com';

function toTwelveDataDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * First real Live Data provider (L1-001, 28_LIVE_DATA_BLUEPRINT.md §9
 * Phase 1). Implements the existing MarketDataProvider interface in full
 * (ADR-003 precedent) — no interface change, no consumer change. Registered
 * at MARKET_DATA_PROVIDER behind a config toggle in market-data.module.ts;
 * every consumer (MarketDataService, MarketSeriesService, Dashboard,
 * Watchlist, Portfolio) is unaware which implementation is bound.
 */
@Injectable()
export class TwelveDataMarketDataProvider implements MarketDataProvider {
  readonly name = 'twelve-data';
  private readonly logger = new Logger(TwelveDataMarketDataProvider.name);
  private readonly httpClient: MarketDataHttpClient;

  constructor(private readonly apiKey: string) {
    this.httpClient = new MarketDataHttpClient(this.name);
  }

  async getQuote(symbol: string): Promise<ProviderQuote> {
    const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${this.apiKey}`;
    const raw = await this.httpClient.fetchJson(url);
    this.assertNotErrorResponse(raw);
    const parsed = twelveDataQuoteSchema.parse(raw);
    return normalizeQuote(symbol, parsed);
  }

  async getCandles(symbol: string, from: Date, to: Date): Promise<ProviderCandle[]> {
    const url =
      `${BASE_URL}/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day` +
      `&start_date=${toTwelveDataDate(from)}&end_date=${toTwelveDataDate(to)}&apikey=${this.apiKey}`;
    const raw = await this.httpClient.fetchJson(url);
    this.assertNotErrorResponse(raw);
    const parsed = twelveDataTimeSeriesSchema.parse(raw);
    return normalizeCandles(parsed);
  }

  /**
   * Uses Twelve Data's dedicated /api_usage endpoint rather than a full
   * /quote call — a genuine, priced API request every health check would
   * needlessly consume real quota (28_LIVE_DATA_BLUEPRINT.md §8, cost
   * discipline) for a check that only needs to confirm reachability.
   */
  async checkHealth(): Promise<ProviderHealthStatus> {
    try {
      const raw = await this.httpClient.fetchJson(`${BASE_URL}/api_usage?apikey=${this.apiKey}`);
      this.assertNotErrorResponse(raw);
      return 'UP';
    } catch (error) {
      this.logger.warn(`Twelve Data health check failed: ${(error as Error).message}`);
      return 'DOWN';
    }
  }

  /**
   * Twelve Data signals some failures (invalid symbol, exhausted credit
   * quota) as HTTP 200 with an error-shaped JSON body rather than a non-2xx
   * status — MarketDataHttpClient's transport-level checks cannot catch
   * this, so it is checked explicitly against the parsed body here.
   */
  private assertNotErrorResponse(raw: unknown): void {
    const errorCheck = twelveDataErrorSchema.safeParse(raw);
    if (errorCheck.success) {
      throw new ProviderUnavailableError(`Twelve Data error: ${errorCheck.data.message}`);
    }
  }
}
