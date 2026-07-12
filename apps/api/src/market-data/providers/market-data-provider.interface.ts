export interface ProviderQuote {
  symbol: string;
  price: number;
  currency: string;
  asOf: Date;
}

export interface ProviderCandle {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ProviderHealthStatus = 'UP' | 'DOWN';

/**
 * Every consumer of market data depends on this interface only (ADR-003) —
 * never on a concrete provider. As of S1-005 the only registered
 * implementation is SimulatedMarketDataProvider; a future real vendor
 * requires only a new implementation and module registration, no change
 * to any consumer.
 */
export interface MarketDataProvider {
  readonly name: string;
  getQuote(symbol: string): Promise<ProviderQuote>;
  getCandles(symbol: string, from: Date, to: Date): Promise<ProviderCandle[]>;
  checkHealth(): Promise<ProviderHealthStatus>;
}

export const MARKET_DATA_PROVIDER = 'MARKET_DATA_PROVIDER';
