import { Prisma } from '@zenith/database';
import { normalizeIctSmcResult } from './ict-smc-normalize.util';
import type { AnalysisProviderResult } from '../analysis-provider.types';

function resultWith(detectedConditions: string[], summary: string, detectionConfidence = 60): AnalysisProviderResult {
  return {
    contractVersion: '1.0.0',
    evidence: { detectedConditions, missingConditions: [], supporting: [], conflicting: [] },
    interpretation: summary ? [{ summary, confidence: { kind: 'INTERPRETATION', value: new Prisma.Decimal(50), explanation: '' }, regimeAdjustedConfidence: { kind: 'REGIME_ADJUSTED', value: new Prisma.Decimal(50), explanation: '' } }] : [],
    limitations: { dataQuality: 'COMPLETE', assumptions: [], notes: [] },
    traceability: { rawDataReferences: [], intermediateCalculations: [], conditionDerivations: [], confidenceDerivation: '' },
    detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(detectionConfidence), explanation: '' },
    methodologyConfidenceCeiling: { kind: 'METHODOLOGY_CEILING', value: new Prisma.Decimal(60), explanation: '' },
  };
}

describe('normalizeIctSmcResult (S1-012 WP4)', () => {
  it('maps a bullish reading (Order Block, FVG, Liquidity Sweep all bullish) to BULLISH on TREND/LIQUIDITY/STRUCTURE/CONFIRMATION', () => {
    const result = resultWith(
      ['BULLISH Order Block at 2026-01-01T00:00:00.000Z (99.00-101.00).', 'BULLISH Fair Value Gap 2026-01-02T00:00:00.000Z-2026-01-04T00:00:00.000Z (100.00-105.00).', 'BULLISH Liquidity Sweep at 2026-01-03T00:00:00.000Z (swept level 95.00).'],
      'Bullish bias: 1 bullish Order Block(s), 1 bullish Fair Value Gap(s), 1 bullish Liquidity Sweep(s).',
    );

    const normalized = normalizeIctSmcResult('ICT_SMC', 'ICT_SMC', result);
    const byDimension = Object.fromEntries(normalized.signals.map((s) => [s.dimension, s]));
    expect(byDimension.TREND.reading).toBe('BULLISH');
    expect(byDimension.LIQUIDITY.reading).toBe('BULLISH');
    expect(byDimension.STRUCTURE.reading).toBe('BULLISH');
    expect(byDimension.CONFIRMATION.reading).toBe('BULLISH');
    expect(byDimension.MOMENTUM.reading).toBe('NOT_APPLICABLE');
    expect(byDimension.VOLATILITY.reading).toBe('NOT_APPLICABLE');
    expect(byDimension.VOLUME.reading).toBe('NOT_APPLICABLE');
  });

  it('maps a Limitations-only result (no primitives detected) to all seven dimensions NOT_APPLICABLE, never fabricated', () => {
    const result = resultWith([], '', 0);
    const normalized = normalizeIctSmcResult('ICT_SMC', 'ICT_SMC', result);
    expect(normalized.signals.every((s) => s.reading === 'NOT_APPLICABLE')).toBe(true);
  });
});
