import { Prisma } from '@zenith/database';
import { clusterConfluence } from './fibonacci-analysis-confluence.util';
import type { RawFibonacciLevel } from './fibonacci-analysis.types';

function level(overrides: Partial<RawFibonacciLevel>): RawFibonacciLevel {
  return { legIndex: 0, ratio: 0.618, price: new Prisma.Decimal(100), type: 'RETRACEMENT', isTrueFibonacciRatio: true, ...overrides };
}

describe('clusterConfluence', () => {
  it('groups levels from independent legs within tolerance into one confluence zone', () => {
    const levels = [level({ legIndex: 0, price: new Prisma.Decimal(100) }), level({ legIndex: 1, ratio: 0.5, price: new Prisma.Decimal(100.1), isTrueFibonacciRatio: false })];

    const candidates = clusterConfluence(levels, new Prisma.Decimal(1));

    expect(candidates).toHaveLength(1);
    expect(candidates[0].confluenceCount).toBe(2);
    expect(candidates[0].contributingLevels).toHaveLength(2);
  });

  it('never merges two ratios from the same leg with each other, even when their prices happen to be close', () => {
    const levels = [level({ legIndex: 0, ratio: 0.618, price: new Prisma.Decimal(200) }), level({ legIndex: 0, ratio: 0.786, price: new Prisma.Decimal(200.05) })];

    const candidates = clusterConfluence(levels, new Prisma.Decimal(1));

    expect(candidates).toHaveLength(2);
    expect(candidates.every((candidate) => candidate.confluenceCount === 1)).toBe(true);
  });

  it('keeps an isolated level as a valid standalone candidate, never discarded', () => {
    const levels = [level({ legIndex: 0, price: new Prisma.Decimal(100) }), level({ legIndex: 1, price: new Prisma.Decimal(500) })];

    const candidates = clusterConfluence(levels, new Prisma.Decimal(1));

    expect(candidates).toHaveLength(2);
    expect(candidates.find((candidate) => candidate.price.toNumber() === 500)?.confluenceCount).toBe(1);
  });

  it('computes the dominant type by majority across contributing levels', () => {
    const levels = [
      level({ legIndex: 0, type: 'RETRACEMENT', price: new Prisma.Decimal(100) }),
      level({ legIndex: 1, type: 'RETRACEMENT', price: new Prisma.Decimal(100.05) }),
      level({ legIndex: 2, type: 'EXTENSION', ratio: 1.618, price: new Prisma.Decimal(100.1) }),
    ];

    const candidates = clusterConfluence(levels, new Prisma.Decimal(1));

    expect(candidates).toHaveLength(1);
    expect(candidates[0].confluenceCount).toBe(3);
    expect(candidates[0].dominantType).toBe('RETRACEMENT');
  });
});
