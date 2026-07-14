import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@zenith/database';
import { buildComputationMetadata, withDataQuality } from '../common/computation-metadata.util';
import { ComputationCacheService } from '../common/computation-cache.service';
import { ComputationRejectedError } from '../common/computation-rejected.error';
import { ObservabilityService } from '../common/observability.service';
import { INDICATOR_ENGINE, type IndicatorEngine } from '../indicator-engine/indicator-engine.tokens';
import type { MarketSeries } from '../market-series/market-series.types';
import { SWING_DETECTOR, type SwingDetector } from '../swing-detection/swing-detection.tokens';
import type { RegimeContext } from './regime-context.tokens';
import type { RegimeContextParams, RegimeContextResult } from './regime-context.types';

const COMPUTATION_VERSION = '1.0.0';

/**
 * The Regime/Context Service — composes Indicator Engine (ADX, ATR) and
 * Swing Detection (Market Structure trend) output into a single,
 * versioned trend/volatility regime read, consumed by future Analysis
 * Providers (S1-008+) before they compute their own confidence (ADR-005).
 * Point-in-time deterministic by construction: it composes two already
 * point-in-time-safe services over the same `MarketSeries`, adding no
 * lookahead of its own.
 */
@Injectable()
export class RegimeContextService implements RegimeContext {
  constructor(
    @Inject(INDICATOR_ENGINE) private readonly indicatorEngine: IndicatorEngine,
    @Inject(SWING_DETECTOR) private readonly swingDetector: SwingDetector,
    private readonly cache: ComputationCacheService,
    private readonly observability: ObservabilityService,
  ) {}

  getRegime(series: MarketSeries, params: RegimeContextParams): RegimeContextResult {
    const points = series.points;
    const { adxPeriod, atrPeriod, swingSensitivity, adxTrendingThreshold, volatilityMultiplier } = params;
    if (adxTrendingThreshold <= 0 || volatilityMultiplier <= 0) {
      throw new ComputationRejectedError(
        'RegimeContext',
        'adxTrendingThreshold and volatilityMultiplier must both be positive',
      );
    }

    // `missingDateCount` is part of the cache key for the same reason as
    // the Indicator Engine/Swing Detector: a later backfill of previously
    // -missing candles must invalidate a stale cache entry.
    const dataRange = {
      from: points[0]?.timestamp.toISOString() ?? null,
      to: points[points.length - 1]?.timestamp.toISOString() ?? null,
      missingDateCount: series.missingDates.length,
    };
    const key = this.cache.buildKey('RegimeContext', params as unknown as Record<string, unknown>, series.assetId, dataRange);

    return this.observability.measure('RegimeContext', () => {
      const cached = this.cache.get<RegimeContextResult>(key);
      if (cached) return cached;

      const adxResult = this.indicatorEngine.adx(series, { period: adxPeriod });
      const atrResult = this.indicatorEngine.atr(series, { period: atrPeriod });
      const swingResult = this.swingDetector.detect(series, { sensitivity: swingSensitivity });

      if (adxResult.series.length === 0 || atrResult.series.length === 0) {
        throw new ComputationRejectedError('RegimeContext', 'ADX/ATR produced no output for the given input');
      }

      const latestAdx = adxResult.series[adxResult.series.length - 1].value.adx;
      const latestAtr = atrResult.series[atrResult.series.length - 1].value;
      const atrBaseline = atrResult.series
        .reduce((sum, e) => sum.plus(e.value), new Prisma.Decimal(0))
        .div(atrResult.series.length);

      const result: RegimeContextResult = withDataQuality(
        {
          trendState: latestAdx.greaterThan(adxTrendingThreshold) ? 'TRENDING' : 'RANGING',
          trendDirection: swingResult.currentTrend,
          volatilityState: latestAtr.greaterThan(atrBaseline.times(volatilityMultiplier)) ? 'HIGH' : 'LOW',
          adx: latestAdx,
          atr: latestAtr,
          atrBaseline,
          metadata: buildComputationMetadata({
            computation: 'RegimeContext',
            parameters: { adxPeriod, atrPeriod, swingSensitivity, adxTrendingThreshold, volatilityMultiplier },
            formula:
              'trendState = TRENDING if latest ADX > adxTrendingThreshold else RANGING; volatilityState = HIGH if latest ATR > atrBaseline * volatilityMultiplier else LOW; trendDirection passed through from Swing Detection.',
            source: 'Composition of ADR-005 Indicator Engine (ADX, ATR) and Swing Detection outputs; no independent formula of its own.',
            points,
            computationVersion: COMPUTATION_VERSION,
            intermediateValues: { adxSeriesLength: adxResult.series.length, atrSeriesLength: atrResult.series.length },
          }),
        },
        series.missingDates.length,
      );

      this.cache.set(key, result);
      return result;
    });
  }
}
