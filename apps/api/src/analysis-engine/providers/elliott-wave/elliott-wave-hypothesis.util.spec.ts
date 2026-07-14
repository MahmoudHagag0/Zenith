import { Prisma } from '@zenith/database';
import { finalizeWaveCountHypotheses } from './elliott-wave-hypothesis.util';
import type { WaveCountCandidate } from './elliott-wave.types';

function candidate(guidelineScore: number, ruleMargins = { rule1: 80, rule2: 80, rule3: 80 }, guidelineChecks: WaveCountCandidate['guidelineChecks'] = []): WaveCountCandidate {
  return {
    direction: 'BULLISH',
    legs: [],
    invalidation: { rule: 'RULE_3', level: new Prisma.Decimal(100), description: 'test fixture' },
    ruleMargins,
    guidelineChecks,
    guidelineScore,
    survivalReasons: [],
    weaknesses: [],
  };
}

describe('finalizeWaveCountHypotheses (WP5)', () => {
  it('ranks candidates by guidelineScore descending and bounds the result at the disclosed maximum', () => {
    const candidates = [candidate(50), candidate(90), candidate(10)];

    const result = finalizeWaveCountHypotheses(candidates);

    expect(result).toHaveLength(2);
    expect(result[0].guidelineScore).toBe(90);
    expect(result[1].guidelineScore).toBe(50);
  });

  it('returns every candidate when fewer than the bound are available', () => {
    const result = finalizeWaveCountHypotheses([candidate(70)]);
    expect(result).toHaveLength(1);
  });

  it('always discloses all three Rules as survival reasons', () => {
    const [result] = finalizeWaveCountHypotheses([candidate(70)]);
    expect(result.survivalReasons).toHaveLength(3);
    expect(result.survivalReasons.some((reason) => reason.includes('Rule 1'))).toBe(true);
    expect(result.survivalReasons.some((reason) => reason.includes('Rule 2'))).toBe(true);
    expect(result.survivalReasons.some((reason) => reason.includes('Rule 3'))).toBe(true);
  });

  it('discloses a weakness for any Rule margin below the threshold, and none when every margin is comfortable', () => {
    const weak = candidate(70, { rule1: 20, rule2: 80, rule3: 80 });
    const strong = candidate(70, { rule1: 80, rule2: 80, rule3: 80 });

    const [weakResult] = finalizeWaveCountHypotheses([weak]);
    const [strongResult] = finalizeWaveCountHypotheses([strong]);

    expect(weakResult.weaknesses.some((w) => w.includes('Rule 1'))).toBe(true);
    expect(strongResult.weaknesses).toHaveLength(0);
  });

  it('discloses a weakness for any Fibonacci guideline check landing far from its nearest ratio', () => {
    const guidelineChecks: WaveCountCandidate['guidelineChecks'] = [
      { label: 'Wave 2 retracement of Wave 1', actualPrice: new Prisma.Decimal(130), nearestGuidelineRatio: 0.618, nearestGuidelinePrice: new Prisma.Decimal(138), proximityScore: 10 },
    ];
    const [result] = finalizeWaveCountHypotheses([candidate(70, undefined, guidelineChecks)]);
    expect(result.weaknesses.some((w) => w.includes('Wave 2 retracement of Wave 1'))).toBe(true);
  });
});
