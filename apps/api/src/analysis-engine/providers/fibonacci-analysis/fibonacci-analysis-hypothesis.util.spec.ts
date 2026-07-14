import { Prisma } from '@zenith/database';
import { buildInvalidation, buildSurvivalReasons, buildWeaknesses, selectHypotheses } from './fibonacci-analysis-hypothesis.util';
import type { FibonacciCandidate, FibonacciHypothesis } from './fibonacci-analysis.types';

function candidateAt(price: number, confluenceCount = 1): FibonacciCandidate {
  return {
    price: new Prisma.Decimal(price),
    dominantType: 'RETRACEMENT',
    contributingLevels: [{ legIndex: 0, ratio: 0.618, price: new Prisma.Decimal(price), type: 'RETRACEMENT', isTrueFibonacciRatio: true }],
    confluenceCount,
  };
}

function hypothesisAt(price: number, overrides: Partial<FibonacciHypothesis> = {}): FibonacciHypothesis {
  return {
    candidate: candidateAt(price),
    direction: 'BULLISH',
    reactionState: 'UNTESTED',
    qualityScore: { value: 80, confluenceScore: 80, precisionScore: 80, explanation: 'strong reading' },
    interpretationScore: 80,
    invalidation: { level: new Prisma.Decimal(price), description: 'test invalidation' },
    survivalReasons: [],
    weaknesses: [],
    ...overrides,
  };
}

describe('selectHypotheses', () => {
  it('ranks candidates by proximity to current price, bounded at 2, nearest first', () => {
    const near = hypothesisAt(105);
    const mid = hypothesisAt(120);
    const far = hypothesisAt(200);
    const currentPrice = new Prisma.Decimal(100);

    const result = selectHypotheses([far, mid, near], currentPrice);

    expect(result).toHaveLength(2);
    expect(result[0].candidate.price.toNumber()).toBe(105);
    expect(result[1].candidate.price.toNumber()).toBe(120);
  });

  it('returns exactly one hypothesis when only one candidate exists', () => {
    const only = hypothesisAt(105);
    expect(selectHypotheses([only], new Prisma.Decimal(100))).toHaveLength(1);
  });

  it('returns an empty array when no candidates exist', () => {
    expect(selectHypotheses([], new Prisma.Decimal(100))).toEqual([]);
  });
});

describe('buildInvalidation', () => {
  it('discloses a non-empty, price-referencing invalidation description', () => {
    const invalidation = buildInvalidation(candidateAt(150));
    expect(invalidation.level.toNumber()).toBe(150);
    expect(invalidation.description).toContain('150.00');
    expect(invalidation.description).toContain('invalidate');
  });
});

describe('buildSurvivalReasons / buildWeaknesses', () => {
  it('discloses reaction state in survival reasons', () => {
    const reasons = buildSurvivalReasons(hypothesisAt(100, { reactionState: 'RESPECTED' }));
    expect(reasons.some((r) => r.includes('RESPECTED'))).toBe(true);
  });

  it('flags a broken reading as a weakness disclosing higher failure probability', () => {
    const weaknesses = buildWeaknesses(hypothesisAt(100, { reactionState: 'BROKEN', interpretationScore: 24 }));
    expect(weaknesses.some((w) => w.includes('failing'))).toBe(true);
  });

  it('reports no weaknesses for a strong, untested reading', () => {
    expect(buildWeaknesses(hypothesisAt(100))).toEqual([]);
  });
});
