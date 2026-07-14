import { Prisma } from '@zenith/database';
import { METHODOLOGY_CONFIDENCE_CEILING, buildDetectionConfidence, buildInterpretationConfidence, buildMethodologyConfidenceCeiling, buildRegimeAdjustedConfidence } from './fibonacci-analysis-confidence.util';
import { buildRegimeResult } from './fibonacci-analysis-test-fixtures';
import type { FibonacciCandidate, FibonacciHypothesis } from './fibonacci-analysis.types';

function candidateOfType(dominantType: 'RETRACEMENT' | 'EXTENSION'): FibonacciCandidate {
  return {
    price: new Prisma.Decimal(100),
    dominantType,
    contributingLevels: [{ legIndex: 0, ratio: 0.618, price: new Prisma.Decimal(100), type: dominantType === 'RETRACEMENT' ? 'RETRACEMENT' : 'EXTENSION', isTrueFibonacciRatio: true }],
    confluenceCount: 1,
  };
}

function hypothesis(overrides: Partial<FibonacciHypothesis> = {}): FibonacciHypothesis {
  return {
    candidate: candidateOfType('RETRACEMENT'),
    direction: 'BULLISH',
    reactionState: 'UNTESTED',
    qualityScore: { value: 80, confluenceScore: 80, precisionScore: 80, explanation: 'strong reading' },
    interpretationScore: 80,
    invalidation: { level: new Prisma.Decimal(100), description: 'test invalidation' },
    survivalReasons: [],
    weaknesses: [],
    ...overrides,
  };
}

describe('buildDetectionConfidence', () => {
  it('reports the quality score, capped at the Methodology Confidence Ceiling', () => {
    expect(buildDetectionConfidence(hypothesis()).value.toNumber()).toBe(METHODOLOGY_CONFIDENCE_CEILING);
  });
});

describe('buildInterpretationConfidence', () => {
  it('reports the interpretation score, capped at the Methodology Confidence Ceiling', () => {
    expect(buildInterpretationConfidence(hypothesis({ interpretationScore: 50 })).value.toNumber()).toBe(50);
  });
});

describe('buildRegimeAdjustedConfidence', () => {
  it('strengthens a retracement-dominant reading when volatilityState reads LOW, and weakens it when HIGH', () => {
    const base = hypothesis({ candidate: candidateOfType('RETRACEMENT'), interpretationScore: 40 });
    const low = buildRegimeAdjustedConfidence(base, buildRegimeResult('LOW')).value.toNumber();
    const high = buildRegimeAdjustedConfidence(base, buildRegimeResult('HIGH')).value.toNumber();
    expect(low).toBeGreaterThan(high);
  });

  it('strengthens an extension-dominant reading when volatilityState reads HIGH, and weakens it when LOW (opposite bifurcation)', () => {
    const base = hypothesis({ candidate: candidateOfType('EXTENSION'), interpretationScore: 40 });
    const high = buildRegimeAdjustedConfidence(base, buildRegimeResult('HIGH')).value.toNumber();
    const low = buildRegimeAdjustedConfidence(base, buildRegimeResult('LOW')).value.toNumber();
    expect(high).toBeGreaterThan(low);
  });
});

describe('buildMethodologyConfidenceCeiling', () => {
  it("reports a value distinct from every other registered Provider's own ceiling", () => {
    const ceiling = buildMethodologyConfidenceCeiling();
    expect(ceiling.value.toNumber()).toBe(METHODOLOGY_CONFIDENCE_CEILING);
    expect([60, 65, 68, 70, 75, 80, 85]).not.toContain(ceiling.value.toNumber());
    expect(ceiling.explanation.length).toBeGreaterThan(0);
  });
});
