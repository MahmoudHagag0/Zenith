import type { MarketSeries } from '../market-series/market-series.types';
import type { RegimeContextParams, RegimeContextResult } from './regime-context.types';

/**
 * Every consumer of the Regime/Context Service depends on this interface
 * only (ADR-005, following the `MARKET_DATA_PROVIDER` precedent of
 * ADR-003) — never on the concrete `RegimeContextService` class.
 */
export interface RegimeContext {
  getRegime(series: MarketSeries, params: RegimeContextParams): RegimeContextResult;
}

export const REGIME_CONTEXT = 'REGIME_CONTEXT';
