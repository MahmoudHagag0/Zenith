import { Prisma } from '@zenith/database';
import { detectLiquiditySweeps } from './ict-smc-liquidity-sweep.detector';
import { buildSwingResult, point, swing } from './ict-smc-test-fixtures';
import type { DisplacementLeg } from './ict-smc.types';

const ATR = new Prisma.Decimal(1); // tolerance = 0.25

function candle(dayOffset: number, high: number, close: number) {
  return point(dayOffset, { open: high, high, low: close - 1, close });
}

describe('detectLiquiditySweeps (WP5)', () => {
  it('detects a Liquidity Sweep of a swing high: pierces beyond tolerance, then closes back inside', () => {
    const points = [candle(0, 90, 90), candle(1, 95, 95), candle(2, 100, 100), candle(3, 101, 99.5)];
    const swingHigh = swing('HIGH', 100, 2);
    const swingResult = buildSwingResult([swingHigh], []);

    const sweeps = detectLiquiditySweeps(points, swingResult, ATR, []);

    expect(sweeps).toHaveLength(1);
    expect(sweeps[0].direction).toBe('BEARISH');
    expect(sweeps[0].sweptLevel).toEqual(new Prisma.Decimal(100));
    expect(sweeps[0].timestamp).toEqual(points[3].timestamp);
  });

  it('does not report a sweep for a genuine breakout: pierces beyond tolerance but closes beyond too', () => {
    const points = [candle(0, 90, 90), candle(1, 95, 95), candle(2, 100, 100), candle(3, 101, 100.5)];
    const swingHigh = swing('HIGH', 100, 2);
    const swingResult = buildSwingResult([swingHigh], []);

    expect(detectLiquiditySweeps(points, swingResult, ATR, [])).toEqual([]);
  });

  it('detects a Liquidity Sweep of a swing low: pierces beyond tolerance, then closes back inside', () => {
    const points = [
      point(0, { open: 110, high: 111, low: 109, close: 110 }),
      point(1, { open: 105, high: 106, low: 104, close: 105 }),
      point(2, { open: 100, high: 101, low: 100, close: 100 }),
      point(3, { open: 99.5, high: 100, low: 98.5, close: 100.5 }), // low pierces below 99.75, closes back above 100
    ];
    const swingLow = swing('LOW', 100, 2);
    const swingResult = buildSwingResult([swingLow], []);

    const sweeps = detectLiquiditySweeps(points, swingResult, ATR, []);

    expect(sweeps).toHaveLength(1);
    expect(sweeps[0].direction).toBe('BULLISH');
    expect(sweeps[0].sweptLevel).toEqual(new Prisma.Decimal(100));
  });

  it('links a sweep to a DisplacementLeg that immediately follows within the disclosed bar window', () => {
    const points = [candle(0, 90, 90), candle(1, 95, 95), candle(2, 100, 100), candle(3, 101, 99.5), candle(4, 105, 104), candle(5, 110, 109)];
    const swingHigh = swing('HIGH', 100, 2);
    const swingResult = buildSwingResult([swingHigh], []);
    const leg: DisplacementLeg = { direction: 'BEARISH', structureEventTimestamp: points[5].timestamp, startTimestamp: points[4].timestamp, startIndex: 4, endIndex: 5 };

    const sweeps = detectLiquiditySweeps(points, swingResult, ATR, [leg]);

    expect(sweeps[0].displacementLegTimestamp).toEqual(points[5].timestamp);
  });
});
