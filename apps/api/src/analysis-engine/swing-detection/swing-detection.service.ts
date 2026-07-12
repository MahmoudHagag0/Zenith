import { Injectable } from '@nestjs/common';
import type { Prisma } from '@zenith/database';
import { buildComputationMetadata, withDataQuality } from '../common/computation-metadata.util';
import { ComputationCacheService } from '../common/computation-cache.service';
import { ComputationRejectedError } from '../common/computation-rejected.error';
import { ObservabilityService } from '../common/observability.service';
import type { MarketSeries, MarketSeriesPoint } from '../market-series/market-series.types';
import type { SwingDetector } from './swing-detection.tokens';
import type {
  Swing,
  SwingDetectionParams,
  SwingDetectionResult,
  StructureEvent,
  TrendDirection,
} from './swing-detection.types';

const COMPUTATION_VERSION = '1.0.0';

function isLocalExtremum(
  points: readonly MarketSeriesPoint[],
  index: number,
  sensitivity: number,
  field: 'high' | 'low',
  comparison: 'greater' | 'less',
): boolean {
  const value = points[index][field];
  for (let k = 1; k <= sensitivity; k++) {
    const left = points[index - k][field];
    const right = points[index + k][field];
    if (comparison === 'greater') {
      if (!value.greaterThan(left) || !value.greaterThan(right)) return false;
    } else {
      if (!value.lessThan(left) || !value.lessThan(right)) return false;
    }
  }
  return true;
}

/**
 * The Swing Detection Infrastructure — a single, parameterized swing/pivot
 * detector shared by every future Analysis Provider that needs Market
 * Structure (ADR-005; ~12 of the ~13 methodology families researched
 * depend on this). Detects swing highs/lows via an N-bar fractal rule
 * (disclosed `sensitivity`, never silently defaulted) and classifies each
 * against its predecessor of the same type (HH/LH/HL/LL), then derives
 * Break of Structure (BOS, trend continuation) and Change of Character
 * (CHoCH, trend reversal) events from that classification sequence.
 *
 * Point-in-time determinism: a swing at index i requires `sensitivity`
 * bars on both sides to confirm, so it is only reported when the input
 * `points` array actually contains those trailing bars — i.e. confirmation
 * is a function of what was knowable at the time, identically in live
 * execution and in a historical replay over a shorter, earlier `points`
 * array. A swing's classification depends only on its predecessor (fixed
 * once determined), so a confirmed swing's classification never changes
 * when later bars are appended — only the newest, not-yet-confirmable
 * swings can differ as more data arrives.
 */
@Injectable()
export class SwingDetectionService implements SwingDetector {
  constructor(
    private readonly cache: ComputationCacheService,
    private readonly observability: ObservabilityService,
  ) {}

  detect(series: MarketSeries, params: SwingDetectionParams): SwingDetectionResult {
    const points = series.points;
    const { sensitivity } = params;
    if (!Number.isInteger(sensitivity) || sensitivity < 1) {
      throw new ComputationRejectedError('SwingDetection', `sensitivity must be a positive integer, received ${sensitivity}`);
    }
    if (points.length < 2 * sensitivity + 1) {
      throw new ComputationRejectedError(
        'SwingDetection',
        `requires at least ${2 * sensitivity + 1} points, received ${points.length}`,
      );
    }

    // `missingDateCount` is part of the cache key for the same reason as
    // the Indicator Engine: a later backfill of previously-missing
    // candles must invalidate a stale cache entry, not silently reuse it.
    const dataRange = {
      from: points[0].timestamp.toISOString(),
      to: points[points.length - 1].timestamp.toISOString(),
      missingDateCount: series.missingDates.length,
    };
    const key = this.cache.buildKey('SwingDetection', { sensitivity }, series.assetId, dataRange);

    return this.observability.measure('SwingDetection', () => {
      const cached = this.cache.get<SwingDetectionResult>(key);
      if (cached) return cached;
      const result = withDataQuality(this.compute(points, sensitivity), series.missingDates.length);
      this.cache.set(key, result);
      return result;
    });
  }

  private compute(points: readonly MarketSeriesPoint[], sensitivity: number): SwingDetectionResult {
    const rawSwings: Array<{ timestamp: Date; type: 'HIGH' | 'LOW'; price: Prisma.Decimal }> = [];
    for (let i = sensitivity; i < points.length - sensitivity; i++) {
      if (isLocalExtremum(points, i, sensitivity, 'high', 'greater')) {
        rawSwings.push({ timestamp: points[i].timestamp, type: 'HIGH', price: points[i].high });
      }
      if (isLocalExtremum(points, i, sensitivity, 'low', 'less')) {
        rawSwings.push({ timestamp: points[i].timestamp, type: 'LOW', price: points[i].low });
      }
    }

    let lastHigh: Swing | null = null;
    let lastLow: Swing | null = null;
    const swings: Swing[] = rawSwings.map((raw) => {
      if (raw.type === 'HIGH') {
        const classification = lastHigh ? (raw.price.greaterThan(lastHigh.price) ? 'HH' : 'LH') : null;
        const swing: Swing = { timestamp: raw.timestamp, type: 'HIGH', price: raw.price, classification };
        lastHigh = swing;
        return swing;
      }
      const classification = lastLow ? (raw.price.greaterThan(lastLow.price) ? 'HL' : 'LL') : null;
      const swing: Swing = { timestamp: raw.timestamp, type: 'LOW', price: raw.price, classification };
      lastLow = swing;
      return swing;
    });

    let trend: TrendDirection = 'UNKNOWN';
    const structureEvents: StructureEvent[] = [];

    for (const swing of swings) {
      const trendBefore = trend;
      if (swing.classification === 'HH') {
        if (trend === 'UNKNOWN') {
          trend = 'UP';
        } else if (trend === 'UP') {
          structureEvents.push({ timestamp: swing.timestamp, type: 'BOS', direction: 'BULLISH', trendBefore, trendAfter: trend, swing });
        } else {
          trend = 'UP';
          structureEvents.push({ timestamp: swing.timestamp, type: 'CHoCH', direction: 'BULLISH', trendBefore, trendAfter: trend, swing });
        }
      } else if (swing.classification === 'LL') {
        if (trend === 'UNKNOWN') {
          trend = 'DOWN';
        } else if (trend === 'DOWN') {
          structureEvents.push({ timestamp: swing.timestamp, type: 'BOS', direction: 'BEARISH', trendBefore, trendAfter: trend, swing });
        } else {
          trend = 'DOWN';
          structureEvents.push({ timestamp: swing.timestamp, type: 'CHoCH', direction: 'BEARISH', trendBefore, trendAfter: trend, swing });
        }
      } else if (swing.classification === 'HL') {
        if (trend === 'UNKNOWN') trend = 'UP';
        // trend UP or DOWN: expected/inconclusive shape alone, no event.
      } else if (swing.classification === 'LH') {
        if (trend === 'UNKNOWN') trend = 'DOWN';
        // trend UP or DOWN: expected/inconclusive shape alone, no event.
      }
      // classification === null (first swing of its type): no trend/event action.
    }

    return {
      sensitivity,
      swings,
      structureEvents,
      currentTrend: trend,
      metadata: buildComputationMetadata({
        computation: 'SwingDetection',
        parameters: { sensitivity },
        formula:
          'N-bar fractal swing high/low detection (disclosed sensitivity); HH/LH/HL/LL classification against the prior same-type swing; BOS on trend-consistent HH/LL, CHoCH on trend-inconsistent HH/LL.',
        source: 'Derived from Dow Theory swing-sequencing and modern Market Structure vocabulary (no single canonical source — see 22_ANALYSIS_ENGINE_ARCHITECTURE.md research).',
        points,
        computationVersion: COMPUTATION_VERSION,
      }),
    };
  }
}
