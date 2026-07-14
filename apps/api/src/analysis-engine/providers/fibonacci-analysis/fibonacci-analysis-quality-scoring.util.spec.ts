import { Prisma } from '@zenith/database';
import { scoreInterpretation, scoreQuality } from './fibonacci-analysis-quality-scoring.util';
import type { FibonacciCandidate, RawFibonacciLevel } from './fibonacci-analysis.types';

function levelAt(legIndex: number, price: number): RawFibonacciLevel {
  return { legIndex, ratio: 0.618, price: new Prisma.Decimal(price), type: 'RETRACEMENT', isTrueFibonacciRatio: true };
}

function candidateWith(contributingLevels: RawFibonacciLevel[]): FibonacciCandidate {
  const distinctLegs = new Set(contributingLevels.map((l) => l.legIndex)).size;
  return { price: contributingLevels[0].price, dominantType: 'RETRACEMENT', contributingLevels, confluenceCount: distinctLegs };
}

describe('scoreQuality', () => {
  it('scores a candidate with more independent contributing legs strictly higher than one with fewer, holding tightness fixed', () => {
    const single = candidateWith([{ ...levelAt(0, 100), isTrueFibonacciRatio: true }]);
    const triple = candidateWith([levelAt(0, 100), levelAt(1, 100), levelAt(2, 100)]);

    const singleScore = scoreQuality(single, new Prisma.Decimal(1));
    const tripleScore = scoreQuality(triple, new Prisma.Decimal(1));

    expect(tripleScore.value).toBeGreaterThan(singleScore.value);
  });

  it('scores a more tightly-clustered confluence zone strictly higher than a loosely-clustered one, holding leg count fixed', () => {
    const tight = candidateWith([levelAt(0, 100), levelAt(1, 100.05), levelAt(2, 100.1)]);
    const loose = candidateWith([levelAt(0, 100), levelAt(1, 100.4), levelAt(2, 99.6)]);

    const tightScore = scoreQuality(tight, new Prisma.Decimal(1));
    const looseScore = scoreQuality(loose, new Prisma.Decimal(1));

    expect(tightScore.value).toBeGreaterThan(looseScore.value);
  });

  it("scores a standalone true-Fibonacci-ratio level higher than a standalone 0.5-convention level", () => {
    const trueRatio = candidateWith([{ ...levelAt(0, 100), isTrueFibonacciRatio: true }]);
    const conventionRatio = candidateWith([{ ...levelAt(0, 100), ratio: 0.5, isTrueFibonacciRatio: false }]);

    expect(scoreQuality(trueRatio, new Prisma.Decimal(1)).precisionScore).toBeGreaterThan(scoreQuality(conventionRatio, new Prisma.Decimal(1)).precisionScore);
  });
});

describe('scoreInterpretation', () => {
  const qualityScore = { value: 80, confluenceScore: 80, precisionScore: 80, explanation: '' };

  it('scores RESPECTED strictly higher than BROKEN for an otherwise-identical reading', () => {
    expect(scoreInterpretation(qualityScore, 'RESPECTED')).toBeGreaterThan(scoreInterpretation(qualityScore, 'BROKEN'));
  });

  it('leaves UNTESTED unchanged from the base quality score', () => {
    expect(scoreInterpretation(qualityScore, 'UNTESTED')).toBe(80);
  });
});
