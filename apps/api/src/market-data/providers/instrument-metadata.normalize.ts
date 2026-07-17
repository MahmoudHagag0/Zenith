import type { ProviderExchangeMetadata, ProviderInstrumentMetadata, ProviderSymbolSearchResult } from './instrument-metadata-provider.interface';
import type { TwelveDataExchange, TwelveDataInstrumentQuote, TwelveDataSymbolSearchResponse } from './instrument-metadata.schemas';

/**
 * Twelve Data → internal DTO mapping (L1-005), following the exact
 * `normalize()` convention established in S1-012 and reused by every
 * prior L1 Sprint. Twelve Data's shape never leaks past this file.
 */
export function normalizeSymbolSearchResults(raw: TwelveDataSymbolSearchResponse): ProviderSymbolSearchResult[] {
  return raw.data.map((result) => ({ symbol: result.symbol, name: result.instrument_name, exchange: result.exchange }));
}

/**
 * `tickSize`/`lotSize` default to sensible placeholder constants -- Twelve
 * Data's `/quote` endpoint (reused here rather than a dedicated
 * reference-data call) does not reliably expose these on its free tier.
 * Disclosed simplification: no consumer uses this method yet (L1-005
 * Sprint Brief Scope), so a placeholder default is preferable to
 * fabricating false precision.
 */
export function normalizeInstrumentMetadata(raw: TwelveDataInstrumentQuote): ProviderInstrumentMetadata {
  return {
    symbol: raw.symbol,
    name: raw.name ?? raw.symbol,
    exchange: raw.exchange ?? 'UNKNOWN',
    currency: raw.currency,
    tickSize: 0.01,
    lotSize: 1,
  };
}

export function normalizeExchangeMetadata(raw: TwelveDataExchange): ProviderExchangeMetadata {
  return {
    exchangeCode: raw.code,
    name: raw.name,
    country: raw.country ?? 'UNKNOWN',
    timezone: raw.timezone ?? 'UTC',
  };
}
