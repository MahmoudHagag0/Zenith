import { scoreContinuationPace, scoreMomentum } from './price-action-momentum.util';
import { buildAtrSeries, candle } from './price-action-test-fixtures';

describe('scoreMomentum', () => {
  const breakoutPoint = candle(1, { open: 100, high: 105, low: 99, close: 104 });

  it('returns 0 for a non-directional state', () => {
    const latest = candle(2, { open: 104, high: 110, low: 103, close: 109 });
    expect(scoreMomentum('APPROACHING_LEVEL', null, latest, buildAtrSeries([breakoutPoint, latest], 1))).toBe(0);
  });

  it('returns 0 when no breakout point exists', () => {
    const latest = candle(2, { open: 104, high: 110, low: 103, close: 109 });
    expect(scoreMomentum('BREAKOUT_UNCONFIRMED', null, latest, buildAtrSeries([latest], 1))).toBe(0);
  });

  it('returns 0 when no ATR value is available', () => {
    const latest = candle(2, { open: 104, high: 110, low: 103, close: 109 });
    expect(scoreMomentum('BREAKOUT_UNCONFIRMED', breakoutPoint, latest, [])).toBe(0);
  });

  it('scales the ATR-relative net move to a 0-100 score, capped at 100', () => {
    const latest = candle(2, { open: 104, high: 111, low: 103, close: 110 });
    const atrSeries = buildAtrSeries([breakoutPoint, latest], 1);
    // netMove = |110-104| = 6; atrRelative = 6; capped at MOMENTUM_FULL_SCORE_ATR_MULTIPLE=2 -> 6/2*100 = 300, capped at 100.
    expect(scoreMomentum('BREAKOUT_UNCONFIRMED', breakoutPoint, latest, atrSeries)).toBe(100);
  });

  it('computes a proportional score below the cap', () => {
    const latest = candle(2, { open: 104, high: 111, low: 103, close: 110 });
    const atrSeries = buildAtrSeries([breakoutPoint, latest], 10);
    // netMove = 6; atr = 10; atrRelative = 0.6; score = 0.6/2*100 = 30.
    expect(scoreMomentum('BREAKOUT_UNCONFIRMED', breakoutPoint, latest, atrSeries)).toBeCloseTo(30, 5);
  });
});

describe('scoreContinuationPace', () => {
  it('returns null for a non-directional state regardless of point count', () => {
    const points = Array.from({ length: 6 }, (_, i) => candle(i, { open: 100, high: 102, low: 98, close: 101 }));
    expect(scoreContinuationPace('APPROACHING_LEVEL', points)).toBeNull();
  });

  it('returns null when fewer than the minimum post-breakout points exist', () => {
    const points = [candle(1, { open: 100, high: 102, low: 98, close: 101 }), candle(2, { open: 101, high: 103, low: 99, close: 102 })];
    expect(scoreContinuationPace('BREAKOUT_UNCONFIRMED', points)).toBeNull();
  });

  it('reads CONTINUATION when later bars have genuinely larger bodies than earlier ones', () => {
    const points = [
      candle(1, { open: 100, high: 101, low: 99.5, close: 100.5 }),
      candle(2, { open: 100.5, high: 101.5, low: 100, close: 101 }),
      candle(3, { open: 101, high: 106, low: 100.5, close: 105 }),
      candle(4, { open: 105, high: 111, low: 104.5, close: 110 }),
    ];
    expect(scoreContinuationPace('BREAKOUT_UNCONFIRMED', points)).toBe('CONTINUATION');
  });

  it('reads EXHAUSTION when later bars have genuinely smaller bodies than earlier ones', () => {
    const points = [
      candle(1, { open: 100, high: 106, low: 99.5, close: 105 }),
      candle(2, { open: 105, high: 111, low: 104.5, close: 110 }),
      candle(3, { open: 110, high: 111, low: 109.5, close: 110.5 }),
      candle(4, { open: 110.5, high: 111.5, low: 110, close: 111 }),
    ];
    expect(scoreContinuationPace('BREAKOUT_UNCONFIRMED', points)).toBe('EXHAUSTION');
  });

  it('reads NEUTRAL_PACE when the body-size ratio is within the disclosed margin', () => {
    const points = [
      candle(1, { open: 100, high: 105, low: 99.5, close: 104 }),
      candle(2, { open: 104, high: 109, low: 103.5, close: 108 }),
      candle(3, { open: 108, high: 113, low: 107.5, close: 112 }),
      candle(4, { open: 112, high: 117, low: 111.5, close: 116 }),
    ];
    expect(scoreContinuationPace('BREAKOUT_UNCONFIRMED', points)).toBe('NEUTRAL_PACE');
  });
});
