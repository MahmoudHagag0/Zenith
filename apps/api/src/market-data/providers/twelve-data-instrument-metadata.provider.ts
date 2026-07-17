import { Injectable } from '@nestjs/common';
import type {
  InstrumentMetadataProvider,
  ProviderExchangeMetadata,
  ProviderInstrumentMetadata,
  ProviderSymbolSearchResult,
} from './instrument-metadata-provider.interface';
import { MarketDataHttpClient } from './http-client';
import type { LiveDataMetricsRecorder } from './live-data-metrics-recorder.interface';
import { ProviderUnavailableError } from './provider-errors';
import {
  twelveDataExchangeResponseSchema,
  twelveDataInstrumentQuoteSchema,
  twelveDataSymbolSearchResponseSchema,
} from './instrument-metadata.schemas';
import { normalizeExchangeMetadata, normalizeInstrumentMetadata, normalizeSymbolSearchResults } from './instrument-metadata.normalize';

const BASE_URL = 'https://api.twelvedata.com';

/**
 * Live Instrument Metadata provider (L1-005, 28_LIVE_DATA_BLUEPRINT.md §9
 * Phase 5). Implements the new InstrumentMetadataProvider interface in
 * full. Per Architecture Team decision (2026-07-16): Twelve Data only for
 * this domain -- Finnhub is not used here, remaining dedicated to
 * Financial News (L1-003). Reuses MarketDataHttpClient (L1-001) directly
 * by import, following the same precedent already applied in L1-003/L1-004.
 *
 * Results from this provider are informational only -- the consumer
 * (MarketDataService.searchAssets()) never persists them or creates an
 * Asset row from them; the existing Asset Catalog remains authoritative.
 */
@Injectable()
export class TwelveDataInstrumentMetadataProvider implements InstrumentMetadataProvider {
  readonly name = 'twelve-data';
  private readonly httpClient: MarketDataHttpClient;

  constructor(
    private readonly apiKey: string,
    metrics?: LiveDataMetricsRecorder,
  ) {
    this.httpClient = new MarketDataHttpClient('twelve-data-instrument-metadata', undefined, 'instrument-metadata', metrics);
  }

  async searchSymbols(query: string): Promise<ProviderSymbolSearchResult[]> {
    const url = `${BASE_URL}/symbol_search?symbol=${encodeURIComponent(query)}&apikey=${this.apiKey}`;
    const raw = await this.httpClient.fetchJson(url);
    const parsed = twelveDataSymbolSearchResponseSchema.parse(raw);
    return normalizeSymbolSearchResults(parsed);
  }

  async getInstrumentMetadata(symbol: string): Promise<ProviderInstrumentMetadata> {
    const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&apikey=${this.apiKey}`;
    const raw = await this.httpClient.fetchJson(url);
    const parsed = twelveDataInstrumentQuoteSchema.parse(raw);
    return normalizeInstrumentMetadata(parsed);
  }

  async getExchangeMetadata(exchangeCode: string): Promise<ProviderExchangeMetadata> {
    const url = `${BASE_URL}/exchanges?code=${encodeURIComponent(exchangeCode)}&apikey=${this.apiKey}`;
    const raw = await this.httpClient.fetchJson(url);
    const parsed = twelveDataExchangeResponseSchema.parse(raw);
    const match = parsed.find((exchange) => exchange.code === exchangeCode) ?? parsed[0];
    if (!match) {
      throw new ProviderUnavailableError(`Twelve Data returned no exchange data for code ${exchangeCode}`);
    }
    return normalizeExchangeMetadata(match);
  }
}
