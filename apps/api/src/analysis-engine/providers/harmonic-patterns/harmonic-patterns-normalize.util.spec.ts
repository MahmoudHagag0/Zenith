import { Prisma } from '@zenith/database';
import { normalizeHarmonicPatternsResult } from './harmonic-patterns-normalize.util';
import type { AnalysisProviderResult } from '../analysis-provider.types';

function resultWith(summary: string | null, detectionConfidence: number): AnalysisProviderResult {
  return {
    contractVersion: '1.0.0',
    evidence: { detectedConditions: [], missingConditions: [], supporting: [], conflicting: [] },
    interpretation: summary
      ? [{ summary, confidence: { kind: 'INTERPRETATION', value: new Prisma.Decimal(60), explanation: '' }, regimeAdjustedConfidence: { kind: 'REGIME_ADJUSTED', value: new Prisma.Decimal(50), explanation: '' } }]
      : [],
    limitations: { dataQuality: 'COMPLETE', assumptions: [], notes: [] },
    traceability: { rawDataReferences: [], intermediateCalculations: [], conditionDerivations: [], confidenceDerivation: '' },
    detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(detectionConfidence), explanation: '' },
    methodologyConfidenceCeiling: { kind: 'METHODOLOGY_CEILING', value: new Prisma.Decimal(65), explanation: '' },
  };
}

describe('normalizeHarmonicPatternsResult (S1-013 WP10)', () => {
  it('maps a BULLISH GARTLEY match with confirmed AB=CD time symmetry to BULLISH on TREND/STRUCTURE/CONFIRMATION', () => {
    const result = resultWith('The strongest currently-surviving interpretation: a BULLISH GARTLEY pattern, with confirmed AB=CD time symmetry.', 70);
    const normalized = normalizeHarmonicPatternsResult('HARMONIC_PATTERNS', 'HARMONIC_PATTERNS', result);
    const byDimension = Object.fromEntries(normalized.signals.map((s) => [s.dimension, s]));
    expect(byDimension.TREND.reading).toBe('BULLISH');
    expect(byDimension.STRUCTURE.reading).toBe('BULLISH');
    expect(byDimension.CONFIRMATION.reading).toBe('BULLISH');
    expect(byDimension.MOMENTUM.reading).toBe('NOT_APPLICABLE');
    expect(byDimension.LIQUIDITY.reading).toBe('NOT_APPLICABLE');
    expect(byDimension.VOLATILITY.reading).toBe('NOT_APPLICABLE');
    expect(byDimension.VOLUME.reading).toBe('NOT_APPLICABLE');
  });

  it('does not confirm CONFIRMATION when AB=CD time symmetry is not disclosed as confirmed', () => {
    const result = resultWith('a BEARISH BAT pattern, with AB=CD time symmetry not confirmed.', 40);
    const normalized = normalizeHarmonicPatternsResult('HARMONIC_PATTERNS', 'HARMONIC_PATTERNS', result);
    const byDimension = Object.fromEntries(normalized.signals.map((s) => [s.dimension, s]));
    expect(byDimension.TREND.reading).toBe('BEARISH');
    expect(byDimension.STRUCTURE.reading).toBe('BEARISH');
    expect(byDimension.CONFIRMATION.reading).toBe('NOT_APPLICABLE');
  });

  it('maps a Limitations-only result (no candidate matched) to all seven dimensions NOT_APPLICABLE, never fabricated', () => {
    const result = resultWith(null, 0);
    const normalized = normalizeHarmonicPatternsResult('HARMONIC_PATTERNS', 'HARMONIC_PATTERNS', result);
    expect(normalized.signals.every((s) => s.reading === 'NOT_APPLICABLE')).toBe(true);
  });
});
