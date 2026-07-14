import { Prisma } from '@zenith/database';
import { detectAccumulationEvents } from './wyckoff-accumulation.detector';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { Swing, SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { WyckoffRange } from './wyckoff.types';

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

function swing(type: 'HIGH' | 'LOW', price: number, dayOffset: number): Swing {
  return { timestamp: new Date(Date.UTC(2026, 0, 1 + dayOffset)), type, price: new Prisma.Decimal(price), classification: null };
}

function swingResult(swings: Swing[]): SwingDetectionResult {
  return { sensitivity: 2, swings, structureEvents: [], currentTrend: 'UNKNOWN', metadata: {} as never };
}

const RANGE: WyckoffRange = {
  support: new Prisma.Decimal(90),
  resistance: new Prisma.Decimal(100),
  startTimestamp: new Date(Date.UTC(2026, 0, 2)),
  endTimestamp: new Date(Date.UTC(2026, 0, 16)),
};

const NEAR_TOLERANCE = new Prisma.Decimal(3);

// Uniform, non-climactic volume for every day the tests don't override.
const basePoints = Array.from({ length: 16 }, (_, i) => point(1000, i));
function withVolume(dayOffset: number, volume: number): MarketSeriesPoint[] {
  return basePoints.map((p, i) => (i === dayOffset ? point(volume, i) : p));
}

describe('detectAccumulationEvents (WP3)', () => {
  it('detects PS but not SC when the second swing low lacks a genuine volume spike', () => {
    const swings = [swing('LOW', 95, 1), swing('LOW', 90, 3)];
    const result = detectAccumulationEvents(withVolume(3, 1000), swingResult(swings), RANGE, NEAR_TOLERANCE);
    expect(result.events.map((e) => e.type)).toEqual(['PS']);
  });

  it('detects SC once the second swing low shows a >=2x trailing-volume climax', () => {
    const swings = [swing('LOW', 95, 1), swing('LOW', 90, 3)];
    const result = detectAccumulationEvents(withVolume(3, 3000), swingResult(swings), RANGE, NEAR_TOLERANCE);
    expect(result.events.map((e) => e.type)).toEqual(['PS', 'SC']);
    expect(result.events[1].price.toNumber()).toBe(90);
  });

  it('detects AR as the first swing high after SC', () => {
    const swings = [swing('LOW', 95, 1), swing('LOW', 90, 3), swing('HIGH', 100, 5)];
    const result = detectAccumulationEvents(withVolume(3, 3000), swingResult(swings), RANGE, NEAR_TOLERANCE);
    expect(result.events.map((e) => e.type)).toEqual(['PS', 'SC', 'AR']);
  });

  it('detects ST as a swing low near the Selling Climax price, after AR, on lower volume', () => {
    const swings = [swing('LOW', 95, 1), swing('LOW', 90, 3), swing('HIGH', 100, 5), swing('LOW', 91, 7)];
    let points = withVolume(3, 3000);
    points = points.map((p, i) => (i === 7 ? { ...p, volume: new Prisma.Decimal(800) } : p));
    const result = detectAccumulationEvents(points, swingResult(swings), RANGE, NEAR_TOLERANCE);
    expect(result.events.map((e) => e.type)).toEqual(['PS', 'SC', 'AR', 'ST']);
  });

  it('does not detect ST when no later swing low is near the Selling Climax price', () => {
    const swings = [swing('LOW', 95, 1), swing('LOW', 90, 3), swing('HIGH', 100, 5), swing('LOW', 82, 7)];
    const result = detectAccumulationEvents(withVolume(3, 3000), swingResult(swings), RANGE, NEAR_TOLERANCE);
    // 82 is not near 90 (>3% away) and is itself below support -- treated as the Spring, not ST.
    expect(result.events.map((e) => e.type)).toEqual(['PS', 'SC', 'AR', 'SPRING']);
  });

  it('detects Spring as a swing low undercutting range support', () => {
    const swings = [swing('LOW', 95, 1), swing('LOW', 90, 3), swing('HIGH', 100, 5), swing('LOW', 91, 7), swing('LOW', 88, 9)];
    let points = withVolume(3, 3000);
    points = points.map((p, i) => (i === 7 ? { ...p, volume: new Prisma.Decimal(800) } : i === 9 ? { ...p, volume: new Prisma.Decimal(700) } : p));
    const result = detectAccumulationEvents(points, swingResult(swings), RANGE, NEAR_TOLERANCE);
    expect(result.events.map((e) => e.type)).toEqual(['PS', 'SC', 'AR', 'ST', 'SPRING']);
    expect(result.events[4].price.toNumber()).toBe(88);
  });

  it('detects Test of the Spring as a higher low on lower volume than the Spring', () => {
    const swings = [
      swing('LOW', 95, 1),
      swing('LOW', 90, 3),
      swing('HIGH', 100, 5),
      swing('LOW', 91, 7),
      swing('LOW', 88, 9),
      swing('LOW', 89, 11),
    ];
    let points = withVolume(3, 3000);
    points = points.map((p, i) =>
      i === 7 ? { ...p, volume: new Prisma.Decimal(800) } : i === 9 ? { ...p, volume: new Prisma.Decimal(700) } : i === 11 ? { ...p, volume: new Prisma.Decimal(500) } : p,
    );
    const result = detectAccumulationEvents(points, swingResult(swings), RANGE, NEAR_TOLERANCE);
    expect(result.events.map((e) => e.type)).toEqual(['PS', 'SC', 'AR', 'ST', 'SPRING', 'TEST']);
  });

  it('detects SOS as a swing high after the Spring/Test breaking above range resistance', () => {
    const swings = [
      swing('LOW', 95, 1),
      swing('LOW', 90, 3),
      swing('HIGH', 100, 5),
      swing('LOW', 91, 7),
      swing('LOW', 88, 9),
      swing('LOW', 89, 11),
      swing('HIGH', 106, 13),
    ];
    let points = withVolume(3, 3000);
    points = points.map((p, i) =>
      i === 7 ? { ...p, volume: new Prisma.Decimal(800) } : i === 9 ? { ...p, volume: new Prisma.Decimal(700) } : i === 11 ? { ...p, volume: new Prisma.Decimal(500) } : p,
    );
    const result = detectAccumulationEvents(points, swingResult(swings), RANGE, NEAR_TOLERANCE);
    expect(result.events.map((e) => e.type)).toEqual(['PS', 'SC', 'AR', 'ST', 'SPRING', 'TEST', 'SOS']);
  });

  it('detects the full schematic through LPS: a swing low after SOS holding above support', () => {
    const swings = [
      swing('LOW', 95, 1),
      swing('LOW', 90, 3),
      swing('HIGH', 100, 5),
      swing('LOW', 91, 7),
      swing('LOW', 88, 9),
      swing('LOW', 89, 11),
      swing('HIGH', 106, 13),
      swing('LOW', 93, 15),
    ];
    let points = withVolume(3, 3000);
    points = points.map((p, i) =>
      i === 7 ? { ...p, volume: new Prisma.Decimal(800) } : i === 9 ? { ...p, volume: new Prisma.Decimal(700) } : i === 11 ? { ...p, volume: new Prisma.Decimal(500) } : p,
    );
    const result = detectAccumulationEvents(points, swingResult(swings), RANGE, NEAR_TOLERANCE);
    expect(result.events.map((e) => e.type)).toEqual(['PS', 'SC', 'AR', 'ST', 'SPRING', 'TEST', 'SOS', 'LPS']);
    expect(result.side).toBe('ACCUMULATION');
  });

  it('returns only PS when fewer than two swing lows exist', () => {
    const result = detectAccumulationEvents(withVolume(1, 1000), swingResult([swing('LOW', 95, 1)]), RANGE, NEAR_TOLERANCE);
    expect(result.events).toEqual([]);
  });
});
