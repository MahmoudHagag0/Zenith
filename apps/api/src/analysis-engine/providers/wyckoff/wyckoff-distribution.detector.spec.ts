import { Prisma } from '@zenith/database';
import { detectDistributionEvents } from './wyckoff-distribution.detector';
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

const basePoints = Array.from({ length: 16 }, (_, i) => point(1000, i));
function withVolumes(overrides: Record<number, number>): MarketSeriesPoint[] {
  return basePoints.map((p, i) => (i in overrides ? { ...p, volume: new Prisma.Decimal(overrides[i]) } : p));
}

describe('detectDistributionEvents (WP4)', () => {
  it('detects PSY but not BC when the second swing high lacks a genuine volume spike', () => {
    const swings = [swing('HIGH', 105, 1), swing('HIGH', 110, 3)];
    const result = detectDistributionEvents(withVolumes({ 3: 1000 }), swingResult(swings), RANGE, NEAR_TOLERANCE);
    expect(result.events.map((e) => e.type)).toEqual(['PSY']);
  });

  it('detects BC once the second swing high shows a >=2x trailing-volume climax', () => {
    const swings = [swing('HIGH', 105, 1), swing('HIGH', 110, 3)];
    const result = detectDistributionEvents(withVolumes({ 3: 3000 }), swingResult(swings), RANGE, NEAR_TOLERANCE);
    expect(result.events.map((e) => e.type)).toEqual(['PSY', 'BC']);
    expect(result.events[1].price.toNumber()).toBe(110);
  });

  it('detects AR as the first swing low after BC', () => {
    const swings = [swing('HIGH', 105, 1), swing('HIGH', 110, 3), swing('LOW', 100, 5)];
    const result = detectDistributionEvents(withVolumes({ 3: 3000 }), swingResult(swings), RANGE, NEAR_TOLERANCE);
    expect(result.events.map((e) => e.type)).toEqual(['PSY', 'BC', 'AR']);
  });

  it('detects ST as a swing high near the Buying Climax price, after AR, on lower volume', () => {
    const swings = [swing('HIGH', 105, 1), swing('HIGH', 110, 3), swing('LOW', 100, 5), swing('HIGH', 109, 7)];
    const result = detectDistributionEvents(withVolumes({ 3: 3000, 7: 800 }), swingResult(swings), RANGE, NEAR_TOLERANCE);
    expect(result.events.map((e) => e.type)).toEqual(['PSY', 'BC', 'AR', 'ST']);
  });

  it('detects UT/UTAD as a swing high after ST overshooting range resistance', () => {
    const swings = [swing('HIGH', 105, 1), swing('HIGH', 110, 3), swing('LOW', 100, 5), swing('HIGH', 109, 7), swing('HIGH', 106, 9)];
    const result = detectDistributionEvents(withVolumes({ 3: 3000, 7: 800, 9: 700 }), swingResult(swings), RANGE, NEAR_TOLERANCE);
    expect(result.events.map((e) => e.type)).toEqual(['PSY', 'BC', 'AR', 'ST', 'UT_UTAD']);
    expect(result.events[4].price.toNumber()).toBe(106);
  });

  it('detects Test of the Upthrust as a lower high on lower volume', () => {
    const swings = [
      swing('HIGH', 105, 1),
      swing('HIGH', 110, 3),
      swing('LOW', 100, 5),
      swing('HIGH', 109, 7),
      swing('HIGH', 106, 9),
      swing('HIGH', 103, 11),
    ];
    const result = detectDistributionEvents(withVolumes({ 3: 3000, 7: 800, 9: 700, 11: 500 }), swingResult(swings), RANGE, NEAR_TOLERANCE);
    expect(result.events.map((e) => e.type)).toEqual(['PSY', 'BC', 'AR', 'ST', 'UT_UTAD', 'TEST']);
  });

  it('detects SOW as a swing low after the Upthrust/Test breaking below range support', () => {
    const swings = [
      swing('HIGH', 105, 1),
      swing('HIGH', 110, 3),
      swing('LOW', 100, 5),
      swing('HIGH', 109, 7),
      swing('HIGH', 106, 9),
      swing('HIGH', 103, 11),
      swing('LOW', 85, 13),
    ];
    const result = detectDistributionEvents(withVolumes({ 3: 3000, 7: 800, 9: 700, 11: 500 }), swingResult(swings), RANGE, NEAR_TOLERANCE);
    expect(result.events.map((e) => e.type)).toEqual(['PSY', 'BC', 'AR', 'ST', 'UT_UTAD', 'TEST', 'SOW']);
  });

  it('detects the full schematic through LPSY: a swing high after SOW holding below resistance', () => {
    const swings = [
      swing('HIGH', 105, 1),
      swing('HIGH', 110, 3),
      swing('LOW', 100, 5),
      swing('HIGH', 109, 7),
      swing('HIGH', 106, 9),
      swing('HIGH', 103, 11),
      swing('LOW', 85, 13),
      swing('HIGH', 95, 15),
    ];
    const result = detectDistributionEvents(withVolumes({ 3: 3000, 7: 800, 9: 700, 11: 500 }), swingResult(swings), RANGE, NEAR_TOLERANCE);
    expect(result.events.map((e) => e.type)).toEqual(['PSY', 'BC', 'AR', 'ST', 'UT_UTAD', 'TEST', 'SOW', 'LPSY']);
    expect(result.side).toBe('DISTRIBUTION');
  });

  it('returns only PSY when fewer than two swing highs exist', () => {
    const result = detectDistributionEvents(withVolumes({}), swingResult([swing('HIGH', 105, 1)]), RANGE, NEAR_TOLERANCE);
    expect(result.events).toEqual([]);
  });
});
