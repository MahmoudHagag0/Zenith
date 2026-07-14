import { Injectable } from '@nestjs/common';
import { Prisma } from '@zenith/database';
import { ComputationCacheService } from '../common/computation-cache.service';
import { ObservabilityService } from '../common/observability.service';
import { withDataQuality } from '../common/computation-metadata.util';
import type { MarketSeries, MarketSeriesPoint } from '../market-series/market-series.types';
import { AdxCalculator } from './calculators/adx.calculator';
import { AtrCalculator } from './calculators/atr.calculator';
import { BollingerBandsCalculator } from './calculators/bollinger-bands.calculator';
import { DonchianChannelCalculator } from './calculators/donchian-channel.calculator';
import { EmaCalculator } from './calculators/ema.calculator';
import { FibonacciCalculator } from './calculators/fibonacci.calculator';
import { MacdCalculator } from './calculators/macd.calculator';
import { RsiCalculator } from './calculators/rsi.calculator';
import { SmaCalculator } from './calculators/sma.calculator';
import type { IndicatorEngine } from './indicator-engine.tokens';
import type {
  AdxParams,
  AdxValue,
  BollingerBandsParams,
  BollingerBandsValue,
  ComputationOutput,
  DonchianChannelParams,
  DonchianChannelValue,
  EmaParams,
  FibonacciParams,
  MacdParams,
  MacdValue,
  RsiParams,
  SmaParams,
  AtrParams,
} from './indicator-engine.types';

/**
 * The Indicator Engine — an internal registry of individual indicator
 * calculators (never one monolithic implementation), consumed only via
 * the `INDICATOR_ENGINE` injection token (ADR-005). Each public method
 * wraps its calculator with the shared output cache (keyed by
 * (indicator, parameters, instrument, data-range)), observability
 * (latency, computation-rejection-rate), and Data Quality propagation
 * from the source `MarketSeries` (completeness — see the Data Quality
 * Model in 22_ANALYSIS_ENGINE_ARCHITECTURE.md).
 */
@Injectable()
export class IndicatorEngineService implements IndicatorEngine {
  private readonly smaCalculator = new SmaCalculator();
  private readonly emaCalculator = new EmaCalculator();
  private readonly rsiCalculator = new RsiCalculator();
  private readonly macdCalculator = new MacdCalculator();
  private readonly bollingerCalculator = new BollingerBandsCalculator();
  private readonly atrCalculator = new AtrCalculator();
  private readonly adxCalculator = new AdxCalculator();
  private readonly donchianCalculator = new DonchianChannelCalculator();
  private readonly fibonacciCalculator = new FibonacciCalculator();

  constructor(
    private readonly cache: ComputationCacheService,
    private readonly observability: ObservabilityService,
  ) {}

  sma(series: MarketSeries, params: SmaParams): ComputationOutput<Prisma.Decimal> {
    return this.runCached('SMA', series, params, (points) => this.smaCalculator.compute(points, params));
  }

  ema(series: MarketSeries, params: EmaParams): ComputationOutput<Prisma.Decimal> {
    return this.runCached('EMA', series, params, (points) => this.emaCalculator.compute(points, params));
  }

  rsi(series: MarketSeries, params: RsiParams): ComputationOutput<Prisma.Decimal> {
    return this.runCached('RSI', series, params, (points) => this.rsiCalculator.compute(points, params));
  }

  macd(series: MarketSeries, params: MacdParams): ComputationOutput<MacdValue> {
    return this.runCached('MACD', series, params, (points) => this.macdCalculator.compute(points, params));
  }

  bollingerBands(series: MarketSeries, params: BollingerBandsParams): ComputationOutput<BollingerBandsValue> {
    return this.runCached('BollingerBands', series, params, (points) => this.bollingerCalculator.compute(points, params));
  }

  atr(series: MarketSeries, params: AtrParams): ComputationOutput<Prisma.Decimal> {
    return this.runCached('ATR', series, params, (points) => this.atrCalculator.compute(points, params));
  }

  adx(series: MarketSeries, params: AdxParams): ComputationOutput<AdxValue> {
    return this.runCached('ADX', series, params, (points) => this.adxCalculator.compute(points, params));
  }

  donchianChannel(series: MarketSeries, params: DonchianChannelParams): ComputationOutput<DonchianChannelValue> {
    return this.runCached('DonchianChannel', series, params, (points) => this.donchianCalculator.compute(points, params));
  }

  fibonacciLevels(params: FibonacciParams) {
    // Not series-scoped (a pure two-anchor ratio computation) —
    // observability latency is still recorded, but no cache entry or
    // Data Quality applies.
    return this.observability.measure('Fibonacci', () => this.fibonacciCalculator.compute(params));
  }

  private runCached<TParams extends object, TValue>(
    computation: string,
    series: MarketSeries,
    params: TParams,
    compute: (points: readonly MarketSeriesPoint[]) => ComputationOutput<TValue>,
  ): ComputationOutput<TValue> {
    const points = series.points;
    // `missingDateCount` is part of the cache key, not just the returned
    // metadata: if the same instrument/range is later requested after
    // previously-missing candles are backfilled, `series.missingDates`
    // shrinks and must invalidate any stale "GAPS_PRESENT" cache entry
    // rather than silently reusing it.
    const dataRange = {
      from: points[0]?.timestamp.toISOString() ?? null,
      to: points[points.length - 1]?.timestamp.toISOString() ?? null,
      missingDateCount: series.missingDates.length,
    };
    const key = this.cache.buildKey(computation, params as Record<string, unknown>, series.assetId, dataRange);

    return this.observability.measure(computation, () => {
      const cached = this.cache.get<ComputationOutput<TValue>>(key);
      if (cached) return cached;
      const result = withDataQuality(compute(points), series.missingDates.length);
      this.cache.set(key, result);
      return result;
    });
  }
}
