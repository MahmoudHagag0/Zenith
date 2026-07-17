import type { MarketDataProvider } from './market-data-provider.interface';
import type { LiveDataMetricsRecorder } from './live-data-metrics-recorder.interface';
import { SimulatedMarketDataProvider } from './simulated-market-data.provider';
import { TwelveDataMarketDataProvider } from './twelve-data-market-data.provider';

export interface MarketDataProviderFactoryLogger {
  warn(message: string): void;
}

/**
 * Selects which MarketDataProvider implementation is bound at the
 * MARKET_DATA_PROVIDER token (28_LIVE_DATA_BLUEPRINT.md §9 Phase 1). Kept as
 * a plain, directly-testable function rather than inline in the module's
 * `useFactory` so the fallback logic can be unit tested without booting
 * Nest's DI container — the same "pure function extracted from wiring"
 * convention already used elsewhere in this codebase (e.g.
 * narrative-composer.util.ts).
 */
export function createMarketDataProvider(
  apiKey: string | undefined,
  mode: string | undefined,
  logger: MarketDataProviderFactoryLogger,
  metrics?: LiveDataMetricsRecorder,
): MarketDataProvider {
  if (mode === 'live') {
    if (apiKey) {
      return new TwelveDataMarketDataProvider(apiKey, metrics);
    }
    logger.warn('MARKET_DATA_MODE=live but TWELVE_DATA_API_KEY is not set — falling back to SimulatedMarketDataProvider');
  }
  return new SimulatedMarketDataProvider();
}
