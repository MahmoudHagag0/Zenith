import type { Prisma } from '@zenith/database';
import type { MarketSeries } from '../market-series/market-series.types';
import type {
  AdxParams,
  AdxValue,
  BollingerBandsParams,
  BollingerBandsValue,
  ComputationOutput,
  DonchianChannelParams,
  DonchianChannelValue,
  EmaParams,
  FibonacciLevel,
  FibonacciParams,
  MacdParams,
  MacdValue,
  RsiParams,
  SmaParams,
  AtrParams,
} from './indicator-engine.types';
import type { ComputationMetadata } from '../common/computation-metadata.util';

/**
 * Every consumer of the Indicator Engine depends on this interface only
 * (ADR-005, following the `MARKET_DATA_PROVIDER` precedent of ADR-003) —
 * never on the concrete `IndicatorEngineService` class. Each method takes
 * the full `MarketSeries` (not a bare `points` array): it supplies the
 * asset identity for the cache key and the Data Quality (completeness)
 * information that propagates into the returned computation metadata,
 * per 22_ANALYSIS_ENGINE_ARCHITECTURE.md's Data Quality Model.
 */
export interface IndicatorEngine {
  sma(series: MarketSeries, params: SmaParams): ComputationOutput<Prisma.Decimal>;
  ema(series: MarketSeries, params: EmaParams): ComputationOutput<Prisma.Decimal>;
  rsi(series: MarketSeries, params: RsiParams): ComputationOutput<Prisma.Decimal>;
  macd(series: MarketSeries, params: MacdParams): ComputationOutput<MacdValue>;
  bollingerBands(series: MarketSeries, params: BollingerBandsParams): ComputationOutput<BollingerBandsValue>;
  atr(series: MarketSeries, params: AtrParams): ComputationOutput<Prisma.Decimal>;
  adx(series: MarketSeries, params: AdxParams): ComputationOutput<AdxValue>;
  donchianChannel(series: MarketSeries, params: DonchianChannelParams): ComputationOutput<DonchianChannelValue>;
  /** Not series-scoped — a pure ratio computation from two anchor prices; carries no Data Quality or cache entry. */
  fibonacciLevels(params: FibonacciParams): { levels: readonly FibonacciLevel[]; metadata: ComputationMetadata };
}

export const INDICATOR_ENGINE = 'INDICATOR_ENGINE';
