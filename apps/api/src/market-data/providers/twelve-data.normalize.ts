import type { ProviderCandle, ProviderQuote } from './market-data-provider.interface';
import type { TwelveDataQuote, TwelveDataTimeSeries } from './twelve-data.schemas';

/**
 * Twelve Data → internal ProviderQuote/ProviderCandle mapping
 * (28_LIVE_DATA_BLUEPRINT.md §4.3 — "each vendor implementation maps its
 * raw response into Zenith's existing internal DTOs via a pure
 * normalize() function", the same convention the Analysis Engine
 * established in S1-012). Twelve Data's shape never leaks past this file.
 */
export function normalizeQuote(symbol: string, raw: TwelveDataQuote): ProviderQuote {
  const price = Number.parseFloat(raw.close);
  const asOf = raw.timestamp !== undefined ? new Date(raw.timestamp * 1000) : raw.datetime ? new Date(raw.datetime) : new Date();
  return { symbol, price, currency: raw.currency, asOf };
}

/** Twelve Data returns `values` most-recent-first; ascending order here matches SimulatedMarketDataProvider's own ordering for interface consistency across providers. */
export function normalizeCandles(raw: TwelveDataTimeSeries): ProviderCandle[] {
  return raw.values
    .map((value) => ({
      date: new Date(value.datetime),
      open: Number.parseFloat(value.open),
      high: Number.parseFloat(value.high),
      low: Number.parseFloat(value.low),
      close: Number.parseFloat(value.close),
      volume: Number.parseFloat(value.volume),
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}
