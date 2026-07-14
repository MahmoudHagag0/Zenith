import { Prisma } from '@zenith/database';
import { generateFibonacciLevels, MAX_SWINGS_FOR_LEGS } from './fibonacci-analysis-level-generator.util';
import { buildSwingResult, fibonacciLevelsOf, swing } from './fibonacci-analysis-test-fixtures';
import type { IndicatorEngine } from '../../indicator-engine/indicator-engine.tokens';

function fakeIndicatorEngine(): IndicatorEngine {
  return {
    fibonacciLevels: jest.fn(({ anchorStart, anchorEnd }: { anchorStart: Prisma.Decimal; anchorEnd: Prisma.Decimal }) => fibonacciLevelsOf(anchorStart, anchorEnd)),
  } as unknown as IndicatorEngine;
}

describe('generateFibonacciLevels', () => {
  it('generates exactly 3 legs worth of levels from a 4-swing fixture, excluding the raw anchor ratios 0 and 1', () => {
    const swings = [swing('LOW', 100, 0), swing('HIGH', 150, 1), swing('LOW', 120, 2), swing('HIGH', 180, 3)];
    const indicatorEngine = fakeIndicatorEngine();

    const { levels, legMetadata } = generateFibonacciLevels(buildSwingResult(swings), indicatorEngine);

    expect(legMetadata).toHaveLength(3);
    expect(indicatorEngine.fibonacciLevels).toHaveBeenCalledTimes(3);
    expect(levels).toHaveLength(21); // 3 legs * 7 kept ratios (9 - ratio 0 - ratio 1)
    expect(levels.some((level) => level.ratio === 0 || level.ratio === 1)).toBe(false);
    expect(levels.filter((level) => level.type === 'RETRACEMENT')).toHaveLength(15); // 3 legs * 5 retracement ratios
    expect(levels.filter((level) => level.type === 'EXTENSION')).toHaveLength(6); // 3 legs * 2 extension ratios
  });

  it('bounds the scan at MAX_SWINGS_FOR_LEGS, never scanning more legs than the disclosed window', () => {
    const swings = [swing('LOW', 90, -2), swing('HIGH', 95, -1), swing('LOW', 100, 0), swing('HIGH', 150, 1), swing('LOW', 120, 2), swing('HIGH', 180, 3)];
    const indicatorEngine = fakeIndicatorEngine();

    const { legMetadata } = generateFibonacciLevels(buildSwingResult(swings), indicatorEngine);

    expect(legMetadata).toHaveLength(MAX_SWINGS_FOR_LEGS - 1);
  });

  it('returns no levels and no metadata when fewer than two swings exist', () => {
    const indicatorEngine = fakeIndicatorEngine();
    const { levels, legMetadata } = generateFibonacciLevels(buildSwingResult([swing('LOW', 100, 0)]), indicatorEngine);

    expect(levels).toEqual([]);
    expect(legMetadata).toEqual([]);
    expect(indicatorEngine.fibonacciLevels).not.toHaveBeenCalled();
  });
});
