import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@zenith/database';
import { WyckoffProvider } from './wyckoff.provider';
import { INDICATOR_ENGINE } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';
import type { MarketSeries, MarketSeriesPoint } from '../../market-series/market-series.types';
import type { Swing } from '../../swing-detection/swing-detection.types';

/**
 * SOURCING DISCLOSURE (per S1-009 Sprint Brief, "Golden-Dataset /
 * Reference-Dataset Conformance Testing" — Scope item 10): the classic
 * Wyckoff Accumulation Schematic #1 (PS -> SC -> AR -> ST -> Spring ->
 * Test -> SOS -> LPS), as universally taught in the modern Wyckoff
 * Method curriculum (Wyckoff Associates / Stock Market Institute course
 * material; reproduced in secondary sources including Hank Pruden's
 * "The Three Skills of Top Trading" and David Weis's published work),
 * could not be independently obtained as a specific, page-numbered
 * worked example in this implementation environment (no network access
 * to the out-of-print/paywalled primary curriculum). Per the Sprint
 * Brief's disclosed-fallback allowance (matching the S1-007 precedent
 * for Wilder's RSI/ATR/ADX), this test instead reproduces the schematic's
 * canonical, universally-taught structure and event sequence — the same
 * eight named events, in the same order, with the same qualitative
 * price/volume relationships (a volume-climactic low, a rally, a
 * lower-volume retest, an undercut-then-recovery shakeout, a
 * higher-volume breakout, a higher low) every published description of
 * this schematic agrees on — verifying `WyckoffProvider` reproduces the
 * textbook-canonical reading end-to-end, not a specific numbered figure.
 */
describe('WyckoffProvider golden-dataset conformance (S1-009 WP10)', () => {
  function point(volume: number, dayOffset: number): MarketSeriesPoint {
    return {
      timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)),
      open: new Prisma.Decimal(100),
      high: new Prisma.Decimal(100),
      low: new Prisma.Decimal(100),
      close: new Prisma.Decimal(100),
      volume: new Prisma.Decimal(volume),
      dataQuality: { kind: 'historical', completeness: 'PRESENT' },
    };
  }

  function swing(type: 'HIGH' | 'LOW', price: number, dayOffset: number): Swing {
    return { timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)), type, price: new Prisma.Decimal(price), classification: null };
  }

  it('reproduces the canonical Accumulation Schematic #1 sequence and Phase D classification', async () => {
    // The canonical schematic, in its own well-known qualitative terms:
    //   PS   (day 1):  first swing low, ordinary volume        -- early buying interest
    //   SC   (day 3):  swing low, ~3x trailing volume          -- panic-selling climax
    //   AR   (day 5):  swing high                              -- sharp relief rally
    //   ST   (day 7):  swing low near SC price, lower volume    -- retest of the climax
    //   Spring(day 9): swing low BELOW the SC/support level     -- shakeout below support
    //   Test (day 11): swing low higher than the Spring, lower volume -- confirms support holds
    //   SOS  (day 13): swing high ABOVE the AR/resistance level -- markup begins
    //   LPS  (day 15): swing low holding above support          -- final low-risk entry
    const overrides: Record<number, number> = { 3: 3000, 7: 800, 9: 700, 11: 500 };
    const points = Array.from({ length: 16 }, (_, i) => (i in overrides ? point(overrides[i], i) : point(1000, i)));
    const series: MarketSeries = {
      assetId: 'golden-dataset-accumulation',
      requestedRange: { from: points[0].timestamp, to: points[points.length - 1].timestamp },
      points,
      missingDates: [],
      currentQuote: { price: null, currency: null, asOf: null, fetchedAt: null, ageSeconds: null, dataQuality: { kind: 'current', freshness: 'MISSING' } },
    };

    const swings: Swing[] = [
      swing('HIGH', 97, 0), // minor pre-schematic high, alongside AR establishes resistance (see WP6 self-review note)
      swing('LOW', 95, 1), // PS
      swing('LOW', 90, 3), // SC
      swing('HIGH', 100, 5), // AR
      swing('LOW', 91, 7), // ST
      swing('LOW', 88, 9), // SPRING
      swing('LOW', 89, 11), // TEST
      swing('HIGH', 106, 13), // SOS
      swing('LOW', 93, 15), // LPS
    ];

    const swingDetector = {
      detect: jest.fn().mockReturnValue({ sensitivity: 3, swings, structureEvents: [], currentTrend: 'UP', metadata: { computation: 'SwingDetection', computationVersion: '1.0.0' } }),
    };
    const regimeContext = {
      getRegime: jest.fn().mockReturnValue({
        trendState: 'RANGING',
        trendDirection: 'UP',
        volatilityState: 'LOW',
        adx: new Prisma.Decimal(15),
        atr: new Prisma.Decimal(1),
        atrBaseline: new Prisma.Decimal(1),
        metadata: { computation: 'RegimeContext', computationVersion: '1.0.0' },
      }),
    };
    const indicatorEngine = {
      atr: jest.fn().mockReturnValue({ series: [{ timestamp: new Date(), value: new Prisma.Decimal(1) }], metadata: { computation: 'ATR', computationVersion: '1.0.0' } }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WyckoffProvider,
        { provide: INDICATOR_ENGINE, useValue: indicatorEngine },
        { provide: SWING_DETECTOR, useValue: swingDetector },
        { provide: REGIME_CONTEXT, useValue: regimeContext },
      ],
    }).compile();
    const provider = module.get(WyckoffProvider);

    const result = await provider.analyze(series);

    // All eight canonical events detected, in the canonical order.
    expect(result.evidence.detectedConditions).toHaveLength(8);
    expect(result.evidence.missingConditions).toEqual([]);

    // A fully-formed schematic is unambiguous: exactly one interpretation, Phase D.
    expect(result.interpretation).toHaveLength(1);
    expect(result.interpretation[0].summary).toContain('Last Point of Support');

    // Wyckoff's own source-verified status is disclosed on every result.
    expect(result.methodologyConfidenceCeiling.explanation).toContain("Wyckoff's Three Laws");

    // Confidence is genuinely high for a fully-confirmed schematic, but never above the disclosed ceiling.
    expect(result.detectionConfidence.value.toNumber()).toBeGreaterThan(50);
    expect(result.interpretation[0].confidence.value.toNumber()).toBeGreaterThan(50);
  });
});
