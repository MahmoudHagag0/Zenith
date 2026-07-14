import { Prisma } from '@zenith/database';
import { gatherSubsequentPoints, identifyKeyLevel } from './price-action-level-identification.util';
import { buildSeries, buildSwingResult, candle, swing } from './price-action-test-fixtures';

describe('identifyKeyLevel', () => {
  it('returns null when no swing exists', () => {
    expect(identifyKeyLevel(buildSwingResult([]))).toBeNull();
  });

  it('returns the single most recent swing only, ignoring earlier ones', () => {
    const swings = [swing('LOW', 90, 0), swing('HIGH', 100, 2), swing('LOW', 95, 4)];
    const keyLevel = identifyKeyLevel(buildSwingResult(swings));
    expect(keyLevel).not.toBeNull();
    expect(keyLevel!.type).toBe('LOW');
    expect(keyLevel!.price).toEqual(new Prisma.Decimal(95));
    expect(keyLevel!.timestamp).toEqual(swings[2].timestamp);
  });
});

describe('gatherSubsequentPoints', () => {
  it('returns only points strictly after the key level timestamp', () => {
    const points = [candle(0, { open: 100, high: 100, low: 100, close: 100 }), candle(1, { open: 101, high: 101, low: 101, close: 101 }), candle(2, { open: 102, high: 102, low: 102, close: 102 })];
    const series = buildSeries(points);
    const keyLevel = { type: 'HIGH' as const, price: new Prisma.Decimal(101), timestamp: points[1].timestamp };

    const result = gatherSubsequentPoints(series, keyLevel);
    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toEqual(points[2].timestamp);
  });

  it('returns an empty array when the key level is the series own most recent point', () => {
    const points = [candle(0, { open: 100, high: 100, low: 100, close: 100 }), candle(1, { open: 101, high: 101, low: 101, close: 101 })];
    const series = buildSeries(points);
    const keyLevel = { type: 'HIGH' as const, price: new Prisma.Decimal(101), timestamp: points[1].timestamp };

    expect(gatherSubsequentPoints(series, keyLevel)).toHaveLength(0);
  });
});
