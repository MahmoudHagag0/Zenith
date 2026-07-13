import { Prisma } from '@zenith/database';
import { averageVolumeBefore, findVolumeAt, isNear } from './wyckoff-event-detection.util';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';

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

describe('wyckoff-event-detection.util (WP3 shared helpers)', () => {
  const points = [point(1000, 0), point(1200, 1), point(800, 2), point(5000, 3)];

  it('findVolumeAt returns the volume of the matching point, zero if none match', () => {
    expect(findVolumeAt(points, points[3].timestamp).toNumber()).toBe(5000);
    expect(findVolumeAt(points, new Date(Date.UTC(2099, 0, 1))).toNumber()).toBe(0);
  });

  it('averageVolumeBefore averages the trailing window strictly before the given timestamp', () => {
    const avg = averageVolumeBefore(points, points[3].timestamp, 3);
    expect(avg.toNumber()).toBeCloseTo((1000 + 1200 + 800) / 3, 9);
  });

  it('averageVolumeBefore returns zero when no prior points exist', () => {
    expect(averageVolumeBefore(points, points[0].timestamp, 3).toNumber()).toBe(0);
  });

  it('isNear correctly bounds an absolute tolerance band around a reference value', () => {
    expect(isNear(new Prisma.Decimal(101), new Prisma.Decimal(100), new Prisma.Decimal(3))).toBe(true);
    expect(isNear(new Prisma.Decimal(110), new Prisma.Decimal(100), new Prisma.Decimal(3))).toBe(false);
  });
});
