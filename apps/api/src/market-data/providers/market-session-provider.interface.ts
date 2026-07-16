import type { ProviderHealthStatus } from './market-data-provider.interface';

export type MarketStatus = 'OPEN' | 'CLOSED' | 'UNKNOWN';

/**
 * Bundles exchange sessions AND trading holidays into a single interface,
 * per 28_LIVE_DATA_BLUEPRINT.md §4.1 ("NEW interfaces required...
 * MarketSessionProvider (sessions + holidays)"). Same Provider Abstraction
 * pattern as MarketDataProvider/CalendarNewsProvider/CotProvider (ADR-003):
 * consumers depend on this interface only, never a concrete implementation.
 *
 * 'UNKNOWN' is a real, first-class outcome, not an error -- returned
 * whenever the exchange code has no entry in the resolved data source.
 * Callers (MarketDataSyncService) treat 'UNKNOWN' as fail-open (assume
 * open, keep polling) per the L1-002 Sprint Brief's fail-open design
 * principle, so a coverage gap degrades to the pre-L1-002 always-poll
 * behavior rather than silently starving Dashboard of fresh quotes.
 */
export interface MarketSessionProvider {
  readonly name: string;
  getMarketStatus(exchangeCode: string, at?: Date): Promise<MarketStatus>;
  checkHealth(): Promise<ProviderHealthStatus>;
}

export const MARKET_SESSION_PROVIDER = 'MARKET_SESSION_PROVIDER';
