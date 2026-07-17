import { Injectable } from '@nestjs/common';
import type { CorporateActionsProvider, ProviderDividendEvent, ProviderSplitEvent } from './corporate-actions-provider.interface';
import { MarketDataHttpClient } from '../../market-data/providers/http-client';
import type { LiveDataMetricsRecorder } from '../../market-data/providers/live-data-metrics-recorder.interface';
import { finnhubDividendResponseSchema, finnhubSplitResponseSchema } from './corporate-actions.schemas';
import { normalizeFinnhubDividend, normalizeFinnhubSplit } from './corporate-actions.normalize';

const BASE_URL = 'https://finnhub.io/api/v1';
// A sufficiently wide default history window -- Corporate Actions
// correctness testing needs real historical splits, which can be decades
// old; disclosed simplification rather than an assumed "recent only" scope.
const HISTORY_START_DATE = '2000-01-01';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Live Corporate Actions provider (L1-006, 28_LIVE_DATA_BLUEPRINT.md §9
 * Phase 6). Implements the new CorporateActionsProvider interface in
 * full. Per Architecture Team decision (2026-07-16): Finnhub is the
 * primary provider for Stock Splits, Reverse Splits, and Dividends --
 * Twelve Data remains scoped to Quotes/Candles/Instrument Metadata only,
 * so this provider does not call Twelve Data at all. Reuses
 * MarketDataHttpClient (L1-001) directly by import, following the same
 * precedent already applied in L1-003/L1-004/L1-005.
 */
@Injectable()
export class FinnhubCorporateActionsProvider implements CorporateActionsProvider {
  readonly name = 'finnhub';
  private readonly splitsClient: MarketDataHttpClient;
  private readonly dividendsClient: MarketDataHttpClient;

  constructor(
    private readonly apiKey: string,
    metrics?: LiveDataMetricsRecorder,
  ) {
    this.splitsClient = new MarketDataHttpClient('finnhub-splits', undefined, 'corporate-actions', metrics);
    this.dividendsClient = new MarketDataHttpClient('finnhub-dividends', undefined, 'corporate-actions', metrics);
  }

  async getSplits(symbol: string): Promise<ProviderSplitEvent[]> {
    const url = `${BASE_URL}/stock/split?symbol=${encodeURIComponent(symbol)}&from=${HISTORY_START_DATE}&to=${today()}&token=${this.apiKey}`;
    const raw = await this.splitsClient.fetchJson(url);
    const parsed = finnhubSplitResponseSchema.parse(raw);
    return parsed.map(normalizeFinnhubSplit).filter((event): event is ProviderSplitEvent => event !== null);
  }

  async getDividends(symbol: string): Promise<ProviderDividendEvent[]> {
    const url = `${BASE_URL}/stock/dividend?symbol=${encodeURIComponent(symbol)}&from=${HISTORY_START_DATE}&to=${today()}&token=${this.apiKey}`;
    const raw = await this.dividendsClient.fetchJson(url);
    const parsed = finnhubDividendResponseSchema.parse(raw);
    return parsed.map(normalizeFinnhubDividend).filter((event): event is ProviderDividendEvent => event !== null);
  }
}
