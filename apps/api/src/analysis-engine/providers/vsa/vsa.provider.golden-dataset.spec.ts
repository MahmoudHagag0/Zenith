import { Test, TestingModule } from '@nestjs/testing';
import { VsaProvider } from './vsa.provider';
import { INDICATOR_ENGINE } from '../../indicator-engine/indicator-engine.tokens';
import { SWING_DETECTOR } from '../../swing-detection/swing-detection.tokens';
import { REGIME_CONTEXT } from '../../regime-context/regime-context.tokens';
import { buildAtrResult, buildBaselineBars, buildRegimeResult, buildSeries, buildSwingResult, candle } from './vsa-test-fixtures';

/**
 * SOURCING DISCLOSURE (per S1-018 Sprint Brief, "Golden-Dataset /
 * Reference-Example Conformance Testing" — Scope item 11): this
 * methodology traces to a single identifiable founder's own primary
 * text (Tom Williams' "Master the Markets"), corroborated by a second
 * identifiable author's own widely-cited text (Anna Coulling's "A
 * Complete Guide to Volume Price Analysis"). Both consistently teach:
 * (1) a narrow-range up bar on conspicuously low volume, occurring
 * during an active advance, shows genuine buyers are no longer
 * participating -- "No Demand," a warning sign for the prevailing
 * up-move; (2) a wide-range bar that spikes to a new high on very heavy
 * volume but closes back down near its own low shows the breakout was
 * not accepted -- an "Upthrust," a warning sign of distribution at the
 * top of a move. These two tests reproduce those widely-taught
 * qualitative instances end-to-end, not a specific numbered figure from
 * either text.
 */
describe('VsaProvider golden-dataset conformance (S1-018 WP11)', () => {
  it('reproduces the canonical No Demand instance: a narrow-range, low-volume up bar during an active advance', async () => {
    const baseline = buildBaselineBars(10, 0, 1000); // an unremarkable, average-volume preceding tape
    const noDemandBar = candle(10, { open: 100, high: 101, low: 99.7, close: 100.8 }, 400); // narrow range, well below average volume, a genuine up bar
    const points = [...baseline, noDemandBar];

    const atrMock = jest.fn().mockReturnValue(buildAtrResult(points, 10));
    const swingMock = jest.fn().mockReturnValue(buildSwingResult([]));
    const regimeMock = jest.fn().mockReturnValue(buildRegimeResult('UP', 'LOW'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VsaProvider,
        { provide: INDICATOR_ENGINE, useValue: { atr: atrMock } },
        { provide: SWING_DETECTOR, useValue: { detect: swingMock } },
        { provide: REGIME_CONTEXT, useValue: { getRegime: regimeMock } },
      ],
    }).compile();
    const provider = module.get(VsaProvider);

    const result = await provider.analyze(buildSeries(points));

    expect(result.interpretation).toHaveLength(1);
    expect(result.interpretation[0].summary).toContain('[SIGNAL:NO_DEMAND]');
    expect(result.interpretation[0].summary).toContain('[DIRECTION:BEARISH]');
    expect(result.interpretation[0].summary).toContain('invalidate');
  });

  it('reproduces the canonical Upthrust instance: a new high on very heavy volume that closes back down near its own low', async () => {
    const baseline = buildBaselineBars(10, 0, 1000); // highs=101, lows=99 -- the prior range this bar spikes beyond
    const upthrustBar = candle(10, { open: 106, high: 118, low: 99, close: 101 }, 3500); // new local high, very heavy volume, closes back down near its own low
    const points = [...baseline, upthrustBar];

    const atrMock = jest.fn().mockReturnValue(buildAtrResult(points, 10));
    const swingMock = jest.fn().mockReturnValue(buildSwingResult([]));
    const regimeMock = jest.fn().mockReturnValue(buildRegimeResult('UP', 'HIGH'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VsaProvider,
        { provide: INDICATOR_ENGINE, useValue: { atr: atrMock } },
        { provide: SWING_DETECTOR, useValue: { detect: swingMock } },
        { provide: REGIME_CONTEXT, useValue: { getRegime: regimeMock } },
      ],
    }).compile();
    const provider = module.get(VsaProvider);

    const result = await provider.analyze(buildSeries(points));

    expect(result.interpretation).toHaveLength(1);
    expect(result.interpretation[0].summary).toContain('[SIGNAL:UPTHRUST]');
    expect(result.interpretation[0].summary).toContain('[CATEGORY:CLIMAX]');
    expect(result.interpretation[0].summary).toContain('[DIRECTION:BEARISH]');
    expect(result.interpretation[0].summary).toContain('invalidate');
    // A climax-type signal corroborated by expanding volatility -- Regime-Adjusted Confidence strengthens, never weakens, this reading.
    expect(result.interpretation[0].regimeAdjustedConfidence.value.greaterThanOrEqualTo(result.interpretation[0].confidence.value)).toBe(true);
  });
});
