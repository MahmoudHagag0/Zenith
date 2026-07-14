import { Prisma } from '@zenith/database';
import { buildInvalidation, buildSurvivalReasons, buildWeaknesses, selectZoneHypotheses } from './supply-demand-hypothesis.util';
import { candle } from './supply-demand-test-fixtures';
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

describe('selectZoneHypotheses', () => {
  it('selects the nearest DEMAND zone and the nearest SUPPLY zone, one per side, nearer first', () => {
    const currentPrice = new Prisma.Decimal(150);
    const nearDemand = zone({ type: 'DEMAND', boundaries: { proximal: new Prisma.Decimal(140), distal: new Prisma.Decimal(138) } });
    const farDemand = zone({ type: 'DEMAND', boundaries: { proximal: new Prisma.Decimal(100), distal: new Prisma.Decimal(98) } });
    const nearSupply = zone({ type: 'SUPPLY', boundaries: { proximal: new Prisma.Decimal(160), distal: new Prisma.Decimal(162) } });

    const result = selectZoneHypotheses([nearDemand, farDemand, nearSupply], currentPrice);

    expect(result).toHaveLength(2);
    expect(result[0].type).toBe('DEMAND');
    expect(result[0].boundaries.proximal.toNumber()).toBe(140);
    expect(result[1].type).toBe('SUPPLY');
  });

  it('returns exactly one hypothesis when only one side is present', () => {
    const currentPrice = new Prisma.Decimal(150);
    const onlyDemand = zone({ type: 'DEMAND', boundaries: { proximal: new Prisma.Decimal(140), distal: new Prisma.Decimal(138) } });

    const result = selectZoneHypotheses([onlyDemand], currentPrice);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('DEMAND');
  });

  it('returns an empty array when no zones exist', () => {
    expect(selectZoneHypotheses([], new Prisma.Decimal(100))).toEqual([]);
  });
});

describe('buildInvalidation', () => {
  it('discloses a non-empty, distal-referencing invalidation description', () => {
    const invalidation = buildInvalidation({ type: 'DEMAND', boundaries: { proximal: new Prisma.Decimal(100), distal: new Prisma.Decimal(98) } });
    expect(invalidation.level.toNumber()).toBe(98);
    expect(invalidation.description).toContain('98.00');
    expect(invalidation.description.length).toBeGreaterThan(0);
  });
});

describe('buildSurvivalReasons / buildWeaknesses', () => {
  it('discloses freshness/mitigation in survival reasons', () => {
    const reasons = buildSurvivalReasons(zone());
    expect(reasons.some((r) => r.includes('FRESH'))).toBe(true);
    expect(reasons.some((r) => r.includes('UNMITIGATED'))).toBe(true);
  });

  it('flags a fully-mitigated zone as a weakness disclosing higher failure probability', () => {
    const weaknesses = buildWeaknesses(zone({ mitigation: 'FULLY_MITIGATED', freshness: 'TESTED_ONCE', interpretationScore: 24 }));
    expect(weaknesses.some((w) => w.includes('failing'))).toBe(true);
  });

  it('flags a repeatedly-tested-but-unmitigated zone as a weakness', () => {
    const weaknesses = buildWeaknesses(zone({ mitigation: 'PARTIALLY_MITIGATED', freshness: 'TESTED_MULTIPLE', interpretationScore: 40 }));
    expect(weaknesses.some((w) => w.includes('repeated'))).toBe(true);
  });

  it('reports no weaknesses for a strong, fresh, unmitigated zone', () => {
    expect(buildWeaknesses(zone())).toEqual([]);
  });
});
