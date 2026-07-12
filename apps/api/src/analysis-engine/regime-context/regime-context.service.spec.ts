import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { RegimeContextService } from './regime-context.service';
import { ComputationCacheService } from '../common/computation-cache.service';
import { ObservabilityService } from '../common/observability.service';
import { ComputationRejectedError } from '../common/computation-rejected.error';
import { INDICATOR_ENGINE } from '../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR } from '../swing-detection/swing-detection.tokens';
import type { MarketSeries, MarketSeriesPoint } from '../market-series/market-series.types';

function bar(value: number, dayOffset: number): MarketSeriesPoint {
  return {
    timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)),
    open: new Prisma.Decimal(value),
    high: new Prisma.Decimal(value),
    low: new Prisma.Decimal(value),
    close: new Prisma.Decimal(value),
    volume: new Prisma.Decimal(1000),
    dataQuality: { kind: 'historical', completeness: 'PRESENT' },
  };
}

function series(assetId: string, points: MarketSeriesPoint[], missingDates: string[] = []): MarketSeries {
  return {
    assetId,
    requestedRange: { from: points[0].timestamp, to: points[points.length - 1].timestamp },
    points,
    missingDates,
    currentQuote: { price: null, currency: null, asOf: null, fetchedAt: null, ageSeconds: null, dataQuality: { kind: 'current', freshness: 'MISSING' } },
  };
}

function adxSeries(values: number[], points: MarketSeriesPoint[]) {
  return {
    series: values.map((v, i) => ({ timestamp: points[i].timestamp, value: { adx: new Prisma.Decimal(v), plusDI: new Prisma.Decimal(0), minusDI: new Prisma.Decimal(0) } })),
    metadata: {} as never,
  };
}

function atrSeries(values: number[], points: MarketSeriesPoint[]) {
  return {
    series: values.map((v, i) => ({ timestamp: points[i].timestamp, value: new Prisma.Decimal(v) })),
    metadata: {} as never,
  };
}

describe('RegimeContextService', () => {
  let service: RegimeContextService;
  let indicatorEngine: { adx: jest.Mock; atr: jest.Mock };
  let swingDetector: { detect: jest.Mock };
  const points = Array.from({ length: 5 }, (_, i) => bar(10 + i, i));
  const oneSeries = series('asset-1', points);
  const params = { adxPeriod: 14, atrPeriod: 14, swingSensitivity: 2, adxTrendingThreshold: 25, volatilityMultiplier: 1.2 };

  beforeEach(async () => {
    indicatorEngine = {
      adx: jest.fn().mockReturnValue(adxSeries([20, 30], points)),
      atr: jest.fn().mockReturnValue(atrSeries([1, 1, 1, 2], points)),
    };
    swingDetector = { detect: jest.fn().mockReturnValue({ currentTrend: 'UP', swings: [], structureEvents: [] }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegimeContextService,
        ComputationCacheService,
        ObservabilityService,
        { provide: INDICATOR_ENGINE, useValue: indicatorEngine },
        { provide: SWING_DETECTOR, useValue: swingDetector },
      ],
    }).compile();

    service = module.get(RegimeContextService);
  });

  it('classifies TRENDING when the latest ADX exceeds the threshold', () => {
    const result = service.getRegime(oneSeries, params);
    expect(result.trendState).toBe('TRENDING'); // latest ADX = 30 > 25
    expect(result.adx.toNumber()).toBe(30);
  });

  it('classifies RANGING when the latest ADX is at or below the threshold', () => {
    indicatorEngine.adx.mockReturnValue(adxSeries([20, 15], points));
    const result = service.getRegime(oneSeries, params);
    expect(result.trendState).toBe('RANGING');
  });

  it('classifies HIGH volatility when the latest ATR exceeds baseline * multiplier', () => {
    // baseline = avg(1,1,1,2) = 1.25; latest ATR = 2 > 1.25*1.2=1.5
    const result = service.getRegime(oneSeries, params);
    expect(result.volatilityState).toBe('HIGH');
    expect(result.atr.toNumber()).toBe(2);
    expect(result.atrBaseline.toNumber()).toBe(1.25);
  });

  it('classifies LOW volatility when the latest ATR does not exceed baseline * multiplier', () => {
    indicatorEngine.atr.mockReturnValue(atrSeries([2, 2, 2, 2], points));
    const result = service.getRegime(oneSeries, params);
    expect(result.volatilityState).toBe('LOW');
  });

  it("passes trendDirection through from the Swing Detector's currentTrend, unmodified", () => {
    swingDetector.detect.mockReturnValue({ currentTrend: 'DOWN', swings: [], structureEvents: [] });
    const result = service.getRegime(oneSeries, params);
    expect(result.trendDirection).toBe('DOWN');
  });

  it('rejects a non-positive adxTrendingThreshold or volatilityMultiplier', () => {
    expect(() => service.getRegime(oneSeries, { ...params, adxTrendingThreshold: 0 })).toThrow(ComputationRejectedError);
    expect(() => service.getRegime(oneSeries, { ...params, volatilityMultiplier: -1 })).toThrow(ComputationRejectedError);
  });

  it('serves an identical repeated call from cache without recomputing', () => {
    const first = service.getRegime(oneSeries, params);
    const second = service.getRegime(oneSeries, params);
    expect(second).toBe(first);
    expect(indicatorEngine.adx).toHaveBeenCalledTimes(1);
  });

  it('includes computation metadata and computationVersion', () => {
    const result = service.getRegime(oneSeries, params);
    expect(result.metadata.computation).toBe('RegimeContext');
    expect(result.metadata.computationVersion).toBe('1.0.0');
    expect(result.metadata.parameters).toEqual(params);
  });

  it('propagates Data Quality (completeness) from the MarketSeries into computation metadata', () => {
    const complete = service.getRegime(oneSeries, params);
    expect(complete.metadata.dataQuality).toEqual({ completeness: 'COMPLETE', missingDateCount: 0 });

    const withGaps = service.getRegime(series('asset-1', points, ['2026-01-02']), params);
    expect(withGaps.metadata.dataQuality).toEqual({ completeness: 'GAPS_PRESENT', missingDateCount: 1 });
  });
});
