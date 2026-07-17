export interface ProviderSymbolSearchResult {
  symbol: string;
  name: string;
  exchange: string;
}

export interface ProviderInstrumentMetadata {
  symbol: string;
  name: string;
  exchange: string;
  currency: string;
  tickSize: number;
  lotSize: number;
}

export interface ProviderExchangeMetadata {
  exchangeCode: string;
  name: string;
  country: string;
  timezone: string;
}

/**
 * A NEW provider interface (L1-005, 28_LIVE_DATA_BLUEPRINT.md §4.1: "NEW
 * interfaces required... InstrumentMetadataProvider (metadata + symbol
 * search + classification)") -- unlike MarketDataProvider/
 * CalendarNewsProvider/CotProvider, no prior Foundation abstraction covers
 * this domain, so this Sprint introduces it fresh, following the exact
 * same shape convention (name + async methods returning small DTOs) and
 * the same interface + injection-token + Simulated-implementation pattern
 * (ADR-003).
 *
 * Per Architecture Team decision (L1-005, 2026-07-16): live search
 * results from this provider are informational only and are never
 * persisted or used to create/mutate an `Asset` row -- the existing
 * Asset Catalog (S1-003) remains the single source of truth, and catalog
 * management remains an intentional administrative operation.
 */
export interface InstrumentMetadataProvider {
  readonly name: string;
  searchSymbols(query: string): Promise<ProviderSymbolSearchResult[]>;
  getInstrumentMetadata(symbol: string): Promise<ProviderInstrumentMetadata>;
  getExchangeMetadata(exchangeCode: string): Promise<ProviderExchangeMetadata>;
}

export const INSTRUMENT_METADATA_PROVIDER = 'INSTRUMENT_METADATA_PROVIDER';
