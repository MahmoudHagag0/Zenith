import { Prisma } from '@zenith/database';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';

/**
 * Shared, side-agnostic helpers used by both the Accumulation and
 * Distribution event detectors — kept generic (price/volume arithmetic
 * only, no Wyckoff-specific meaning) so they carry no schematic-side
 * bias of their own.
 */

export function findVolumeAt(points: readonly MarketSeriesPoint[], timestamp: Date): Prisma.Decimal {
  const point = points.find((p) => p.timestamp.getTime() === timestamp.getTime());
  return point ? point.volume : new Prisma.Decimal(0);
}

/** Average volume of up to `window` bars strictly before `timestamp`. Zero if none exist. */
export function averageVolumeBefore(points: readonly MarketSeriesPoint[], timestamp: Date, window: number): Prisma.Decimal {
  const priorPoints = points.filter((p) => p.timestamp.getTime() < timestamp.getTime()).slice(-window);
  if (priorPoints.length === 0) {
    return new Prisma.Decimal(0);
  }
  const sum = priorPoints.reduce((acc, p) => acc.plus(p.volume), new Prisma.Decimal(0));
  return sum.dividedBy(priorPoints.length);
}

/** Whether `value` is within `tolerance` (a fraction, e.g. 0.03 for 3%) of `reference`. */
export function isNear(value: Prisma.Decimal, reference: Prisma.Decimal, tolerance: number): boolean {
  if (reference.isZero()) {
    return value.isZero();
  }
  return value.minus(reference).abs().dividedBy(reference.abs()).lessThanOrEqualTo(tolerance);
}
