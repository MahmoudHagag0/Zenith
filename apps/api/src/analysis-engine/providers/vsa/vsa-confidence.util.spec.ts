import { Prisma } from '@zenith/database';
import {
  METHODOLOGY_CONFIDENCE_CEILING,
  buildDetectionConfidence,
  buildInterpretationConfidence,
  buildMethodologyConfidenceCeiling,
  buildRegimeAdjustedConfidence,
} from './vsa-confidence.util';
import type { ClassifiedBar, VsaHypothesis } from './vsa.types';
import { buildRegimeResult, candle } from './vsa-test-fixtures';

function buildHypothesis(type: VsaHypothesis['signal']['type'], swingProximate: boolean, barOverrides: Partial<ClassifiedBar> = {}): VsaHypothesis {
  const bar: ClassifiedBar = {
    point: candle(10, { open: 100, high: 120, low: 90, close: 95 }),
    index: 10,
    atr: new Prisma.Decimal(10),
    spread: 'WIDE',
    spreadAtrRatio: 3,
    volume: 'ULTRA_HIGH',
    volumeRatio: 3,
    closePosition: 'NEAR_LOW',
    closePositionRatio: 0.2,
    direction: 'DOWN',
    ...barOverrides,
  };
  return {
    signal: { type, bar },
    invalidation: { description: 'test invalidation' },
    swingProximate,
  };
}

describe('vsa-confidence.util (S1-018 Sprint Brief, Scope item 5)', () => {
  it('Detection Confidence reflects this bar\'s own volume/spread anomaly magnitude', () => {
    const hypothesis = buildHypothesis('UPTHRUST', false);
    const confidence = buildDetectionConfidence(hypothesis);
    expect(confidence.kind).toBe('DETECTION');
    expect(confidence.value.toNumber()).toBeGreaterThan(0);
  });

  it('Interpretation Confidence scores strictly higher when the signal is swing-proximate than when it is not', () => {
    // A moderate anomaly magnitude, well below the Methodology Confidence Ceiling, so the swing-proximity multiplier's own effect is observable rather than clipped by the ceiling.
    const proximate = buildHypothesis('UPTHRUST', true, { volumeRatio: 1.5, spreadAtrRatio: 1.5 });
    const notProximate = buildHypothesis('UPTHRUST', false, { volumeRatio: 1.5, spreadAtrRatio: 1.5 });
    expect(buildInterpretationConfidence(proximate).value.toNumber()).toBeGreaterThan(buildInterpretationConfidence(notProximate).value.toNumber());
  });

  describe('Regime-Adjusted Confidence', () => {
    it('scores a climax-type signal (Upthrust/Shakeout/Stopping Volume) higher when volatilityState reads HIGH than LOW', () => {
      const hypothesis = buildHypothesis('UPTHRUST', false);
      const high = buildRegimeAdjustedConfidence(hypothesis, buildRegimeResult('UNKNOWN', 'HIGH'));
      const low = buildRegimeAdjustedConfidence(hypothesis, buildRegimeResult('UNKNOWN', 'LOW'));
      expect(high.value.toNumber()).toBeGreaterThan(low.value.toNumber());
    });

    it('scores a quiet-type signal (No Demand/No Supply) higher when volatilityState reads LOW than HIGH', () => {
      const hypothesis = buildHypothesis('NO_SUPPLY', false, { spread: 'NARROW', spreadAtrRatio: 0.3, volume: 'LOW', volumeRatio: 0.3 });
      const low = buildRegimeAdjustedConfidence(hypothesis, buildRegimeResult('UNKNOWN', 'LOW'));
      const high = buildRegimeAdjustedConfidence(hypothesis, buildRegimeResult('UNKNOWN', 'HIGH'));
      expect(low.value.toNumber()).toBeGreaterThan(high.value.toNumber());
    });
  });

  it('Methodology Confidence Ceiling for VSA is distinct from every prior registered Provider\'s own ceiling', () => {
    const ceiling = buildMethodologyConfidenceCeiling();
    expect(ceiling.kind).toBe('METHODOLOGY_CEILING');
    expect(ceiling.value.toNumber()).toBe(METHODOLOGY_CONFIDENCE_CEILING);
    expect([60, 65, 68, 70, 72, 75, 80, 85]).not.toContain(METHODOLOGY_CONFIDENCE_CEILING);
  });

  it('never reports a confidence above the Methodology Confidence Ceiling', () => {
    const hypothesis = buildHypothesis('UPTHRUST', true, { volumeRatio: 100, spreadAtrRatio: 100 });
    expect(buildDetectionConfidence(hypothesis).value.toNumber()).toBeLessThanOrEqual(METHODOLOGY_CONFIDENCE_CEILING);
    expect(buildInterpretationConfidence(hypothesis).value.toNumber()).toBeLessThanOrEqual(METHODOLOGY_CONFIDENCE_CEILING);
    expect(buildRegimeAdjustedConfidence(hypothesis, buildRegimeResult('UNKNOWN', 'HIGH')).value.toNumber()).toBeLessThanOrEqual(METHODOLOGY_CONFIDENCE_CEILING);
  });
});
