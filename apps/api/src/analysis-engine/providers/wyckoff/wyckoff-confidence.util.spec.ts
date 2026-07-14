import { Prisma } from '@zenith/database';
import {
  METHODOLOGY_CONFIDENCE_CEILING,
  buildDetectionConfidence,
  buildInterpretationConfidence,
  buildMethodologyConfidenceCeiling,
  buildRegimeAdjustedConfidence,
} from './wyckoff-confidence.util';
import type { RegimeContextResult } from '../../regime-context/regime-context.types';
import type { WyckoffPhaseHypothesis, WyckoffSideEvents } from './wyckoff.types';

function regime(trendState: 'RANGING' | 'TRENDING'): RegimeContextResult {
  return {
    trendState,
    trendDirection: 'UNKNOWN',
    volatilityState: 'LOW',
    adx: new Prisma.Decimal(15),
    atr: new Prisma.Decimal(1),
    atrBaseline: new Prisma.Decimal(1),
    metadata: {} as never,
  };
}

function hypothesis(score: number): WyckoffPhaseHypothesis {
  return { phase: 'C', side: 'ACCUMULATION', score, supportingEvents: ['PS', 'SC'], summary: 'test hypothesis' };
}

describe('wyckoff-confidence.util (WP6)', () => {
  it('buildDetectionConfidence scales with the fraction of the 8-event schematic detected', () => {
    const sideEvents: WyckoffSideEvents = { side: 'ACCUMULATION', events: [{ type: 'PS', timestamp: new Date(), price: new Prisma.Decimal(1), description: '' }] };
    const result = buildDetectionConfidence(sideEvents);
    expect(result.kind).toBe('DETECTION');
    expect(result.value.toNumber()).toBeCloseTo(12.5, 5);
  });

  it('buildDetectionConfidence never exceeds the Methodology Confidence Ceiling', () => {
    const events = Array.from({ length: 8 }, () => ({ type: 'PS' as const, timestamp: new Date(), price: new Prisma.Decimal(1), description: '' }));
    const result = buildDetectionConfidence({ side: 'ACCUMULATION', events });
    expect(result.value.toNumber()).toBe(METHODOLOGY_CONFIDENCE_CEILING);
  });

  it('buildInterpretationConfidence wraps the hypothesis score, capped at the ceiling', () => {
    expect(buildInterpretationConfidence(hypothesis(65)).value.toNumber()).toBe(65);
    expect(buildInterpretationConfidence(hypothesis(99)).value.toNumber()).toBe(METHODOLOGY_CONFIDENCE_CEILING);
  });

  it('buildRegimeAdjustedConfidence is lower under TRENDING than RANGING for an identical hypothesis', () => {
    const trending = buildRegimeAdjustedConfidence(hypothesis(70), regime('TRENDING'));
    const ranging = buildRegimeAdjustedConfidence(hypothesis(70), regime('RANGING'));
    expect(trending.value.toNumber()).toBeLessThan(ranging.value.toNumber());
    expect(ranging.value.toNumber()).toBe(70);
  });

  it('buildMethodologyConfidenceCeiling reports the disclosed constant for WYCKOFF', () => {
    const result = buildMethodologyConfidenceCeiling();
    expect(result.kind).toBe('METHODOLOGY_CEILING');
    expect(result.value.toNumber()).toBe(METHODOLOGY_CONFIDENCE_CEILING);
  });
});
