import { Prisma } from '@zenith/database';
import { detectFairValueGaps } from './ict-smc-fvg.detector';
import { point } from './ict-smc-test-fixtures';
import type { DisplacementLeg } from './ict-smc.types';

const ATR = new Prisma.Decimal(1);

function hl(dayOffset: number, high: number, low: number) {
  return point(dayOffset, { open: (high + low) / 2, high, low, close: (high + low) / 2 });
}

describe('detectFairValueGaps (WP4)', () => {
  it('detects a Bullish FVG when candle 1 high is below candle 3 low, above the ATR-relative minimum', () => {
    const points = [hl(0, 100, 100), hl(1, 100, 100), hl(2, 130, 130)];

    const gaps = detectFairValueGaps(points, ATR, []);

    expect(gaps).toHaveLength(1);
    expect(gaps[0].direction).toBe('BULLISH');
    expect(gaps[0].gapLow).toEqual(new Prisma.Decimal(100));
    expect(gaps[0].gapHigh).toEqual(new Prisma.Decimal(130));
    expect(gaps[0].startTimestamp).toEqual(points[0].timestamp);
    expect(gaps[0].endTimestamp).toEqual(points[2].timestamp);
  });

  it('detects a Bearish FVG when candle 1 low is above candle 3 high, above the ATR-relative minimum', () => {
    const points = [hl(0, 130, 130), hl(1, 100, 100), hl(2, 70, 70)];

    const gaps = detectFairValueGaps(points, ATR, []);

    expect(gaps).toHaveLength(1);
    expect(gaps[0].direction).toBe('BEARISH');
    expect(gaps[0].gapLow).toEqual(new Prisma.Decimal(70));
    expect(gaps[0].gapHigh).toEqual(new Prisma.Decimal(130));
  });

  it('produces no FVG when the gap falls at or below the ATR-relative minimum', () => {
    const points = [hl(0, 100, 100), hl(1, 100, 100), hl(2, 100.1, 100.1)]; // gap 0.1 <= 0.25*ATR

    expect(detectFairValueGaps(points, ATR, [])).toEqual([]);
  });

  it('links a detected FVG to an enclosing DisplacementLeg, and leaves an FVG outside any leg unlinked', () => {
    const points = [hl(0, 100, 100), hl(1, 100, 100), hl(2, 130, 130), hl(3, 100, 100), hl(4, 70, 70)];
    const leg: DisplacementLeg = { direction: 'BULLISH', structureEventTimestamp: points[2].timestamp, startTimestamp: points[0].timestamp, startIndex: 0, endIndex: 2 };

    const gaps = detectFairValueGaps(points, ATR, [leg]);

    expect(gaps).toHaveLength(2);
    const bullishGap = gaps.find((gap) => gap.direction === 'BULLISH');
    const bearishGap = gaps.find((gap) => gap.direction === 'BEARISH');
    expect(bullishGap?.displacementLegTimestamp).toEqual(points[2].timestamp);
    expect(bearishGap?.displacementLegTimestamp).toBeUndefined();
  });
});
