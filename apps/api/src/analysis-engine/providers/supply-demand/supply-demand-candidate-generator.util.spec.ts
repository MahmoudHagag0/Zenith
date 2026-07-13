import { generateZoneCandidates } from './supply-demand-candidate-generator.util';
import { buildAtrSeries, buildSeries, candle } from './supply-demand-test-fixtures';

describe('generateZoneCandidates', () => {
  it('detects a DEMAND zone from a tight base preceded by a drop candle, followed by a strong upward departure', () => {
    const points = [
      candle(0, { open: 110, high: 111, low: 104, close: 105 }), // preceding: DROP (bearish)
      candle(1, { open: 105, high: 106, low: 104, close: 104.5 }), // base: tight, indecisive
      candle(2, { open: 104.5, high: 112.5, low: 104, close: 112 }), // departure: strong upward
    ];
    const series = buildSeries(points);
    const atrSeries = buildAtrSeries(points, 2);

    const candidates = generateZoneCandidates(series, atrSeries);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].type).toBe('DEMAND');
    expect(candidates[0].origin).toBe('DROP_BASE_RALLY');
    expect(candidates[0].boundaries.proximal.toNumber()).toBe(106);
    expect(candidates[0].boundaries.distal.toNumber()).toBe(104);
  });

  it('detects a SUPPLY zone from a tight base preceded by a rally candle, followed by a strong downward departure', () => {
    const points = [
      candle(0, { open: 100, high: 105.5, low: 99.5, close: 105 }), // preceding: RALLY (bullish)
      candle(1, { open: 105, high: 106, low: 104.8, close: 105.4 }), // base: tight, indecisive
      candle(2, { open: 105.4, high: 106, low: 97, close: 98 }), // departure: strong downward
    ];
    const series = buildSeries(points);
    const atrSeries = buildAtrSeries(points, 2);

    const candidates = generateZoneCandidates(series, atrSeries);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].type).toBe('SUPPLY');
    expect(candidates[0].origin).toBe('RALLY_BASE_DROP');
    expect(candidates[0].boundaries.proximal.toNumber()).toBe(104.8);
    expect(candidates[0].boundaries.distal.toNumber()).toBe(106);
  });

  it('discards a base whose combined range is too loose (beyond the disclosed ATR-relative bound)', () => {
    const points = [
      candle(0, { open: 110, high: 111, low: 104, close: 105 }),
      candle(1, { open: 105, high: 110, low: 100, close: 104.5 }), // loose base: range 10, atr 1 -> ratio 10 (>3)
      candle(2, { open: 104.5, high: 112.5, low: 104, close: 112 }),
    ];
    const series = buildSeries(points);
    const atrSeries = buildAtrSeries(points, 1);

    expect(generateZoneCandidates(series, atrSeries)).toEqual([]);
  });

  it('discards a base whose following departure candle is too weak to qualify as impulsive', () => {
    const points = [
      candle(0, { open: 110, high: 111, low: 104, close: 105 }),
      candle(1, { open: 105, high: 106, low: 104, close: 104.5 }),
      candle(2, { open: 104.5, high: 105.5, low: 104, close: 105 }), // weak departure: body 0.5, atr 2 -> ratio 0.25 (<1.5)
    ];
    const series = buildSeries(points);
    const atrSeries = buildAtrSeries(points, 2);

    expect(generateZoneCandidates(series, atrSeries)).toEqual([]);
  });

  it('discards a candidate window whose own candles are not indecisive (a large body relative to range)', () => {
    const points = [
      candle(0, { open: 110, high: 111, low: 104, close: 105 }),
      candle(1, { open: 100, high: 106, low: 99.5, close: 105.5 }), // decisive candle: body 5.5, range 6.5 -> ratio 0.85 (>0.35)
      candle(2, { open: 105.5, high: 112.5, low: 105, close: 112 }),
    ];
    const series = buildSeries(points);
    const atrSeries = buildAtrSeries(points, 2);

    expect(generateZoneCandidates(series, atrSeries)).toEqual([]);
  });
});
