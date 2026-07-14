import { Prisma } from '@zenith/database';
import { normalizeClassicalChartPatternsResult } from './classical-chart-patterns-normalize.util';
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
    methodologyConfidenceCeiling: { kind: 'METHODOLOGY_CEILING', value: new Prisma.Decimal(80), explanation: '' },
  };
}

describe('normalizeClassicalChartPatternsResult (S1-014 WP10)', () => {
  it('maps a BEARISH HEAD_AND_SHOULDERS match confirmed by a neckline break to BEARISH on TREND/STRUCTURE/CONFIRMATION', () => {
    const result = resultWith('The strongest currently-surviving interpretation: a BEARISH HEAD_AND_SHOULDERS pattern, confirmed by a subsequent close beyond the neckline.', 70);
    const normalized = normalizeClassicalChartPatternsResult('CLASSICAL_CHART_PATTERNS', 'CLASSICAL_CHART_PATTERNS', result);
    const byDimension = Object.fromEntries(normalized.signals.map((s) => [s.dimension, s]));
    expect(byDimension.TREND.reading).toBe('BEARISH');
    expect(byDimension.STRUCTURE.reading).toBe('BEARISH');
    expect(byDimension.CONFIRMATION.reading).toBe('BEARISH');
    expect(byDimension.MOMENTUM.reading).toBe('NOT_APPLICABLE');
    expect(byDimension.LIQUIDITY.reading).toBe('NOT_APPLICABLE');
    expect(byDimension.VOLATILITY.reading).toBe('NOT_APPLICABLE');
    expect(byDimension.VOLUME.reading).toBe('NOT_APPLICABLE');
  });

  it('does not confirm CONFIRMATION when the pattern is still forming (unconfirmed)', () => {
    const result = resultWith('a BULLISH DOUBLE_BOTTOM pattern, still forming -- no confirming close beyond the neckline has occurred yet.', 40);
    const normalized = normalizeClassicalChartPatternsResult('CLASSICAL_CHART_PATTERNS', 'CLASSICAL_CHART_PATTERNS', result);
    const byDimension = Object.fromEntries(normalized.signals.map((s) => [s.dimension, s]));
    expect(byDimension.TREND.reading).toBe('BULLISH');
    expect(byDimension.STRUCTURE.reading).toBe('BULLISH');
    expect(byDimension.CONFIRMATION.reading).toBe('NOT_APPLICABLE');
  });

  it('maps a Limitations-only result (no candidate matched) to all seven dimensions NOT_APPLICABLE, never fabricated', () => {
    const result = resultWith(null, 0);
    const normalized = normalizeClassicalChartPatternsResult('CLASSICAL_CHART_PATTERNS', 'CLASSICAL_CHART_PATTERNS', result);
    expect(normalized.signals.every((s) => s.reading === 'NOT_APPLICABLE')).toBe(true);
  });
});
