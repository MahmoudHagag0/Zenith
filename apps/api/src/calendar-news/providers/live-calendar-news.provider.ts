import { Injectable, Logger } from '@nestjs/common';
import type { CalendarNewsProvider, ProviderCalendarEvent, ProviderNewsItem } from './calendar-news-provider.interface';
import { MarketDataHttpClient } from '../../market-data/providers/http-client';
import type { LiveDataMetricsRecorder } from '../../market-data/providers/live-data-metrics-recorder.interface';
import { ProviderUnavailableError } from '../../market-data/providers/provider-errors';
import { fmpEconomicCalendarResponseSchema, finnhubNewsResponseSchema, marketAuxNewsResponseSchema } from './calendar-news.schemas';
import { dedupeNewsItems, normalizeFinnhubNewsItem, normalizeFmpEvent, normalizeMarketAuxNewsItem } from './calendar-news.normalize';

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
const MARKETAUX_BASE_URL = 'https://api.marketaux.com/v1';

function toDateParam(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Live Calendar/News provider (L1-003, 28_LIVE_DATA_BLUEPRINT.md §9 Phase
 * 3). Implements the existing CalendarNewsProvider interface in full
 * (S1-031 origin, ADR-003 precedent) — no interface change, no consumer
 * change. Reuses MarketDataHttpClient (L1-001) directly by import rather
 * than promoting it to a shared package, following L1-001's own disclosed
 * precedent for reusing the Analysis Engine circuit breaker.
 *
 * Economic Calendar is single-sourced from FMP (Blueprint §3). Financial
 * News uses Finnhub as primary and MarketAux as secondary — fallback +
 * enrichment, per Architecture Team decision (2026-07-16): if Finnhub
 * fails outright, MarketAux's results are used alone (fallback); if
 * Finnhub succeeds, MarketAux is still queried best-effort and its
 * non-duplicate items are merged in for broader coverage (enrichment). A
 * MarketAux failure never fails the overall call once Finnhub has already
 * succeeded.
 */
@Injectable()
export class LiveCalendarNewsProvider implements CalendarNewsProvider {
  readonly name = 'fmp-finnhub-marketaux';
  private readonly logger = new Logger(LiveCalendarNewsProvider.name);
  private readonly fmpClient: MarketDataHttpClient;
  private readonly finnhubClient: MarketDataHttpClient;
  private readonly marketAuxClient: MarketDataHttpClient;

  constructor(
    private readonly fmpApiKey: string,
    private readonly finnhubApiKey: string,
    private readonly marketAuxApiKey: string,
    metrics?: LiveDataMetricsRecorder,
  ) {
    this.fmpClient = new MarketDataHttpClient('fmp-calendar', undefined, 'calendar-news', metrics);
    this.finnhubClient = new MarketDataHttpClient('finnhub-news', undefined, 'calendar-news', metrics);
    this.marketAuxClient = new MarketDataHttpClient('marketaux-news', undefined, 'calendar-news', metrics);
  }

  async getNews(symbol: string): Promise<ProviderNewsItem[]> {
    let finnhubItems: ProviderNewsItem[] = [];
    let finnhubFailed = false;
    try {
      finnhubItems = await this.fetchFinnhubNews(symbol);
    } catch (error) {
      finnhubFailed = true;
      this.logger.warn(`Finnhub news fetch failed for ${symbol}, falling back to MarketAux: ${(error as Error).message}`);
    }

    let marketAuxItems: ProviderNewsItem[] = [];
    try {
      marketAuxItems = await this.fetchMarketAuxNews(symbol);
    } catch (error) {
      if (finnhubFailed) {
        // Both the primary and the secondary/fallback source failed --
        // propagate so the existing per-asset tolerate-and-continue sync
        // behavior (S1-035) applies exactly as it does for any other
        // provider failure.
        throw new ProviderUnavailableError(`Both Finnhub and MarketAux news fetches failed for ${symbol}: ${(error as Error).message}`);
      }
      this.logger.warn(`MarketAux news fetch failed for ${symbol} (best-effort enrichment skipped): ${(error as Error).message}`);
    }

    return dedupeNewsItems([...finnhubItems, ...marketAuxItems]);
  }

  async getUpcomingEvents(_symbol: string): Promise<ProviderCalendarEvent[]> {
    const from = new Date();
    const to = new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
    const url = `${FMP_BASE_URL}/economic_calendar?from=${toDateParam(from)}&to=${toDateParam(to)}&apikey=${this.fmpApiKey}`;
    const raw = await this.fmpClient.fetchJson(url);
    const parsed = fmpEconomicCalendarResponseSchema.parse(raw);
    return parsed.map(normalizeFmpEvent).filter((event): event is ProviderCalendarEvent => event !== null);
  }

  private async fetchFinnhubNews(symbol: string): Promise<ProviderNewsItem[]> {
    const to = new Date();
    const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
    const url =
      `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(symbol)}` +
      `&from=${toDateParam(from)}&to=${toDateParam(to)}&token=${this.finnhubApiKey}`;
    const raw = await this.finnhubClient.fetchJson(url);
    const parsed = finnhubNewsResponseSchema.parse(raw);
    return parsed.map(normalizeFinnhubNewsItem).filter((item): item is ProviderNewsItem => item !== null);
  }

  private async fetchMarketAuxNews(symbol: string): Promise<ProviderNewsItem[]> {
    const url = `${MARKETAUX_BASE_URL}/news/all?symbols=${encodeURIComponent(symbol)}&api_token=${this.marketAuxApiKey}`;
    const raw = await this.marketAuxClient.fetchJson(url);
    const parsed = marketAuxNewsResponseSchema.parse(raw);
    return parsed.data.map(normalizeMarketAuxNewsItem).filter((item): item is ProviderNewsItem => item !== null);
  }
}
