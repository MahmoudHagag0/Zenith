import type { MarketSeries } from '../market-series/market-series.types';
import type { SwingDetectionParams, SwingDetectionResult } from './swing-detection.types';

/**
 * Every consumer of the Swing Detector depends on this interface only
 * (ADR-005, following the `MARKET_DATA_PROVIDER` precedent of ADR-003) —
 * never on the concrete `SwingDetectionService` class. Takes the full
 * `MarketSeries` (asset identity for the cache key; Data Quality
 * propagation into the returned metadata).
 */
export interface SwingDetector {
  detect(series: MarketSeries, params: SwingDetectionParams): SwingDetectionResult;
}

export const SWING_DETECTOR = 'SWING_DETECTOR';
