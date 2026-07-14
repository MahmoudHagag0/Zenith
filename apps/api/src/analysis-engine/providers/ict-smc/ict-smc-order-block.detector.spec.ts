import { Prisma } from '@zenith/database';
import { detectOrderBlocks } from './ict-smc-order-block.detector';
import { point } from './ict-smc-test-fixtures';
import type { DisplacementLeg } from './ict-smc.types';

function leg(direction: 'BULLISH' | 'BEARISH', startIndex: number, endIndex: number, points: ReturnType<typeof point>[]): DisplacementLeg {
  return {
    direction,
    structureEventTimestamp: points[endIndex].timestamp,
    startTimestamp: points[startIndex].timestamp,
    startIndex,
    endIndex,
  };
}

describe('detectOrderBlocks (WP3)', () => {
  it('detects a Bullish Order Block: the bearish candle at the leg start', () => {
    const points = [
      point(0, { open: 100, high: 101, low: 99, close: 100.5 }),
      point(1, { open: 105, high: 106, low: 99, close: 100 }), // bearish -- this is the origin
      point(2, { open: 100, high: 108, low: 100, close: 107 }),
      point(3, { open: 107, high: 112, low: 106, close: 111 }),
      point(4, { open: 111, high: 115, low: 110, close: 114 }),
    ];
    const legs = [leg('BULLISH', 1, 4, points)];

    const orderBlocks = detectOrderBlocks(points, legs);

    expect(orderBlocks).toHaveLength(1);
    expect(orderBlocks[0].direction).toBe('BULLISH');
    expect(orderBlocks[0].timestamp).toEqual(points[1].timestamp);
    expect(orderBlocks[0].high).toEqual(new Prisma.Decimal(106));
    expect(orderBlocks[0].low).toEqual(new Prisma.Decimal(99));
    expect(orderBlocks[0].displacementLegTimestamp).toEqual(points[4].timestamp);
  });

  it('detects a Bearish Order Block: the bullish candle at the leg start', () => {
    const points = [
      point(0, { open: 100, high: 101, low: 99, close: 100.5 }),
      point(1, { open: 100, high: 106, low: 99, close: 105 }), // bullish -- the origin
      point(2, { open: 105, high: 105, low: 97, close: 98 }),
      point(3, { open: 98, high: 98, low: 92, close: 93 }),
      point(4, { open: 93, high: 93, low: 88, close: 89 }),
    ];
    const legs = [leg('BEARISH', 1, 4, points)];

    const orderBlocks = detectOrderBlocks(points, legs);

    expect(orderBlocks).toHaveLength(1);
    expect(orderBlocks[0].direction).toBe('BEARISH');
    expect(orderBlocks[0].timestamp).toEqual(points[1].timestamp);
  });

  it('looks back within the disclosed window when the candle at the leg start is not itself opposing', () => {
    const points = [
      point(0, { open: 100, high: 101, low: 99, close: 100.5 }),
      point(1, { open: 105, high: 106, low: 99, close: 100 }), // bearish -- the true origin, two bars before leg start
      point(2, { open: 100, high: 104, low: 99, close: 103 }), // bullish -- not opposing, skipped
      point(3, { open: 103, high: 112, low: 102, close: 111 }), // leg start (bullish leg) -- itself bullish, not opposing
      point(4, { open: 111, high: 115, low: 110, close: 114 }),
    ];
    const legs = [leg('BULLISH', 3, 4, points)];

    const orderBlocks = detectOrderBlocks(points, legs);

    expect(orderBlocks).toHaveLength(1);
    expect(orderBlocks[0].timestamp).toEqual(points[1].timestamp);
  });

  it('produces no Order Block when no opposing candle exists within the lookback window', () => {
    const points = Array.from({ length: 8 }, (_, i) => point(i, { open: 100 + i, high: 101 + i, low: 99 + i, close: 100.5 + i })); // every candle bullish
    const legs = [leg('BULLISH', 7, 7, points)];

    expect(detectOrderBlocks(points, legs)).toEqual([]);
  });
});
