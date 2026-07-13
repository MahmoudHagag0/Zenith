import { Prisma } from '@zenith/database';
import { scoreFibonacciGuidelines } from './elliott-wave-fibonacci-guideline.util';
import { buildFibonacciOutput } from './elliott-wave-test-fixtures';
import type { ImpulseWaveLeg, RuleValidatedCandidate } from './elliott-wave.types';

function leg(waveNumber: 1 | 2 | 3 | 4 | 5, startPrice: number, endPrice: number): ImpulseWaveLeg {
  return {
    waveNumber,
    startTimestamp: new Date(Date.UTC(2026, 0, waveNumber)),
    startPrice: new Prisma.Decimal(startPrice),
    endTimestamp: new Date(Date.UTC(2026, 0, waveNumber + 1)),
    endPrice: new Prisma.Decimal(endPrice),
  };
}

function candidate(legs: ImpulseWaveLeg[]): RuleValidatedCandidate {
  return {
    direction: 'BULLISH',
    legs,
    invalidation: { rule: 'RULE_3', level: legs[0].endPrice, description: 'test fixture' },
    ruleMargins: { rule1: 100, rule2: 100, rule3: 100 },
  };
}

function fakeIndicatorEngine() {
  return {
    fibonacciLevels: jest.fn((params: { anchorStart: Prisma.Decimal; anchorEnd: Prisma.Decimal }) => buildFibonacciOutput(params.anchorStart, params.anchorEnd)),
  };
}

describe('scoreFibonacciGuidelines (WP4)', () => {
  it('scores a candidate whose Wave 2/Wave 4/Wave 3 land near classic guideline ratios higher than one that lands far from them', () => {
    const near = candidate([leg(1, 100, 200), leg(2, 200, 138), leg(3, 138, 300), leg(4, 300, 238), leg(5, 238, 320)]);
    const far = candidate([leg(1, 100, 200), leg(2, 200, 130), leg(3, 130, 250), leg(4, 250, 198), leg(5, 198, 140)]);

    const indicatorEngine = fakeIndicatorEngine();
    const nearResult = scoreFibonacciGuidelines(near, indicatorEngine);
    const farResult = scoreFibonacciGuidelines(far, indicatorEngine);

    expect(nearResult.guidelineScore).toBeGreaterThan(farResult.guidelineScore);
    expect(nearResult.guidelineScore).toBeGreaterThan(80);
    expect(farResult.guidelineScore).toBeLessThan(20);
  });

  it('calls INDICATOR_ENGINE.fibonacciLevels() for all three checks rather than re-implementing the ratio math locally', () => {
    const near = candidate([leg(1, 100, 200), leg(2, 200, 138), leg(3, 138, 300), leg(4, 300, 238), leg(5, 238, 320)]);
    const indicatorEngine = fakeIndicatorEngine();

    scoreFibonacciGuidelines(near, indicatorEngine);

    expect(indicatorEngine.fibonacciLevels).toHaveBeenCalledTimes(3);
  });

  it('populates one FibonacciGuidelineCheck per reference leg, each labeled distinctly', () => {
    const near = candidate([leg(1, 100, 200), leg(2, 200, 138), leg(3, 138, 300), leg(4, 300, 238), leg(5, 238, 320)]);
    const result = scoreFibonacciGuidelines(near, fakeIndicatorEngine());

    expect(result.guidelineChecks).toHaveLength(3);
    expect(new Set(result.guidelineChecks.map((check) => check.label)).size).toBe(3);
  });
});
