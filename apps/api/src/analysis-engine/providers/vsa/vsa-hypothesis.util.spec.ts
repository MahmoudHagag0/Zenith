import { Prisma } from '@zenith/database';
import { selectHypotheses } from './vsa-hypothesis.util';
import type { ClassifiedBar, VsaSignal } from './vsa.types';
import { candle, swing } from './vsa-test-fixtures';

function buildBar(index: number, overrides: Partial<ClassifiedBar> = {}): ClassifiedBar {
  return {
    point: candle(index, { open: 100, high: 105, low: 95, close: 102 }),
    index,
    atr: new Prisma.Decimal(10),
    spread: 'AVERAGE',
    spreadAtrRatio: 1,
    volume: 'AVERAGE',
    volumeRatio: 1,
    closePosition: 'MID',
    closePositionRatio: 0.5,
    direction: 'UP',
    ...overrides,
  };
}

describe('selectHypotheses (S1-018 Sprint Brief, Scope items 4, 6)', () => {
  it('returns exactly two hypotheses, the more recent bar primary, given two qualifying signals at different points in the scan window', () => {
    const older: VsaSignal = { type: 'NO_SUPPLY', bar: buildBar(10) };
    const newer: VsaSignal = { type: 'NO_DEMAND', bar: buildBar(20) };

    const hypotheses = selectHypotheses([older, newer], []);

    expect(hypotheses).toHaveLength(2);
    expect(hypotheses[0].signal).toBe(newer);
    expect(hypotheses[1].signal).toBe(older);
  });

  it('returns exactly one hypothesis given only one qualifying signal', () => {
    const only: VsaSignal = { type: 'NO_SUPPLY', bar: buildBar(10) };
    const hypotheses = selectHypotheses([only], []);
    expect(hypotheses).toHaveLength(1);
    expect(hypotheses[0].signal).toBe(only);
  });

  it('bounds at two even when more than two signals qualify, keeping only the two most recent', () => {
    const signals: VsaSignal[] = [
      { type: 'NO_SUPPLY', bar: buildBar(5) },
      { type: 'NO_DEMAND', bar: buildBar(10) },
      { type: 'UPTHRUST', bar: buildBar(15) },
    ];
    const hypotheses = selectHypotheses(signals, []);
    expect(hypotheses).toHaveLength(2);
    expect(hypotheses[0].signal.bar.index).toBe(15);
    expect(hypotheses[1].signal.bar.index).toBe(10);
  });

  it('discloses a specific, non-empty invalidation description for every signal type', () => {
    const types: VsaSignal['type'][] = ['NO_DEMAND', 'NO_SUPPLY', 'UPTHRUST', 'SHAKEOUT', 'STOPPING_VOLUME'];
    for (const type of types) {
      const [hypothesis] = selectHypotheses([{ type, bar: buildBar(1) }], []);
      expect(hypothesis.invalidation.description.length).toBeGreaterThan(0);
    }
  });

  describe('swing proximity', () => {
    it('reads swingProximate=true when the bar\'s own high/low is within the disclosed ATR-relative tolerance of a swing', () => {
      const bar = buildBar(10, { point: candle(10, { open: 100, high: 105, low: 95, close: 102 }), atr: new Prisma.Decimal(10) });
      const signal: VsaSignal = { type: 'NO_SUPPLY', bar };
      const nearSwing = swing('HIGH', 106, 9); // distance to bar.high (105) = 1, well within 0.5x ATR (5)

      const [hypothesis] = selectHypotheses([signal], [nearSwing]);
      expect(hypothesis.swingProximate).toBe(true);
    });

    it('reads swingProximate=false when no swing is within tolerance', () => {
      const bar = buildBar(10, { point: candle(10, { open: 100, high: 105, low: 95, close: 102 }), atr: new Prisma.Decimal(10) });
      const signal: VsaSignal = { type: 'NO_SUPPLY', bar };
      const farSwing = swing('HIGH', 500, 9);

      const [hypothesis] = selectHypotheses([signal], [farSwing]);
      expect(hypothesis.swingProximate).toBe(false);
    });
  });
});
