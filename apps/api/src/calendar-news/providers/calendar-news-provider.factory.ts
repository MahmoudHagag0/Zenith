import type { CalendarNewsProvider } from './calendar-news-provider.interface';
import type { LiveDataMetricsRecorder } from '../../market-data/providers/live-data-metrics-recorder.interface';
import { SimulatedCalendarNewsProvider } from './simulated-calendar-news.provider';
import { LiveCalendarNewsProvider } from './live-calendar-news.provider';

export interface CalendarNewsProviderFactoryLogger {
  warn(message: string): void;
}

/**
 * Selects which CalendarNewsProvider implementation is bound at the
 * CALENDAR_NEWS_PROVIDER token (28_LIVE_DATA_BLUEPRINT.md §9 Phase 3),
 * mirroring L1-001's `createMarketDataProvider()` exactly: a plain,
 * directly-testable function so the fallback logic can be unit tested
 * without booting Nest's DI container. All three credentials are required
 * for live mode (FMP for Calendar; Finnhub + MarketAux for News, per the
 * Architecture Team's "implement both providers from day one" decision) --
 * a partial credential set falls back to Simulated with a logged warning
 * rather than attempting a partially-live, partially-keyless call.
 */
export function createCalendarNewsProvider(
  fmpApiKey: string | undefined,
  finnhubApiKey: string | undefined,
  marketAuxApiKey: string | undefined,
  mode: string | undefined,
  logger: CalendarNewsProviderFactoryLogger,
  metrics?: LiveDataMetricsRecorder,
): CalendarNewsProvider {
  if (mode === 'live') {
    if (fmpApiKey && finnhubApiKey && marketAuxApiKey) {
      return new LiveCalendarNewsProvider(fmpApiKey, finnhubApiKey, marketAuxApiKey, metrics);
    }
    logger.warn(
      'CALENDAR_NEWS_MODE=live but one or more of FMP_API_KEY/FINNHUB_API_KEY/MARKETAUX_API_KEY is not set — falling back to SimulatedCalendarNewsProvider',
    );
  }
  return new SimulatedCalendarNewsProvider();
}
