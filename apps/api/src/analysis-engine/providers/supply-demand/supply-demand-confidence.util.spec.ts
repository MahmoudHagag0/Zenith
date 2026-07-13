import { Prisma } from '@zenith/database';
import { METHODOLOGY_CONFIDENCE_CEILING, buildDetectionConfidence, buildInterpretationConfidence, buildMethodologyConfidenceCeiling, buildRegimeAdjustedConfidence } from './supply-demand-confidence.util';
import { buildRegimeResult, candle } from './supply-demand-test-fixtures';
import type { SupplyDemandZone } from './supply-demand.types';

function zone(overrides: Partial<SupplyDemandZone> = {}): SupplyDemandZone {
  return {
    type: 'DEMAND',
    origin: 'DROP_BASE_RALLY',
    boundaries: { proximal: new Prisma.Decimal(100), distal: new Prisma.Decimal(98) },
    departureCandle: candle(2, { open: 98, high: 105, low: 97.5, close: 104 }),
    freshness: 'FRESH',
    mitigation: 'UNMITIGATED',
    qualityScore: { value: 80, baseTightnessScore: 80, departureStrengthScore: 80, explanation: 'strong zone' },
    interpretationScore: 80,
    invalidation: { level: new Prisma.Decimal(98), description: 'test invalidation' },
    survivalReasons: [],
    weaknesses: [],
    ...overrides,
  };
}

describe('buildDetectionConfidence', () => {
  it('reports the zone quality score, capped at the Methodology Confidence Ceiling', () => {
    expect(buildDetectionConfidence(zone()).value.toNumber()).toBe(METHODOLOGY_CONFIDENCE_CEILING);
  });
});

describe('buildInterpretationConfidence', () => {
  it('reports the interpretation score, capped at the Methodology Confidence Ceiling', () => {
    expect(buildInterpretationConfidence(zone({ interpretationScore: 50 })).value.toNumber()).toBe(50);
  });
});

describe('buildRegimeAdjustedConfidence', () => {
  it('strengthens a DEMAND zone when trendDirection reads UP, and weakens it when DOWN', () => {
    const base = zone({ type: 'DEMAND', interpretationScore: 40 });
    const up = buildRegimeAdjustedConfidence(base, buildRegimeResult('UP')).value.toNumber();
    const down = buildRegimeAdjustedConfidence(base, buildRegimeResult('DOWN')).value.toNumber();
    expect(up).toBeGreaterThan(down);
  });

  it('strengthens a SUPPLY zone when trendDirection reads DOWN, and weakens it when UP (opposite bifurcation)', () => {
    const base = zone({ type: 'SUPPLY', interpretationScore: 40 });
    const down = buildRegimeAdjustedConfidence(base, buildRegimeResult('DOWN')).value.toNumber();
    const up = buildRegimeAdjustedConfidence(base, buildRegimeResult('UP')).value.toNumber();
    expect(down).toBeGreaterThan(up);
  });

  it('applies no adjustment when trendDirection reads UNKNOWN', () => {
    const base = zone({ interpretationScore: 40 });
    const interpretationValue = buildInterpretationConfidence(base).value.toNumber();
    expect(buildRegimeAdjustedConfidence(base, buildRegimeResult('UNKNOWN')).value.toNumber()).toBeCloseTo(interpretationValue, 5);
  });
});

describe('buildMethodologyConfidenceCeiling', () => {
  it('reports a value distinct from every other registered Provider\'s own ceiling', () => {
    const ceiling = buildMethodologyConfidenceCeiling();
    expect(ceiling.value.toNumber()).toBe(METHODOLOGY_CONFIDENCE_CEILING);
    expect([60, 65, 70, 75, 80, 85]).not.toContain(ceiling.value.toNumber());
    expect(ceiling.explanation.length).toBeGreaterThan(0);
  });
});
