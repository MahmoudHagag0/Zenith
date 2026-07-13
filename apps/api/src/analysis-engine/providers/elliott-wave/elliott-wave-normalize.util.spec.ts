import { Prisma } from '@zenith/database';
import { normalizeElliottWaveResult } from './elliott-wave-normalize.util';
import type { AnalysisProviderResult } from '../analysis-provider.types';

function resultWith(summary: string | null, interpretationConfidence: number, detectionConfidence: number): AnalysisProviderResult {
  return {
    contractVersion: '1.0.0',
    evidence: { detectedConditions: [], missingConditions: [], supporting: [], conflicting: [] },
    interpretation: summary
      ? [{ summary, confidence: { kind: 'INTERPRETATION', value: new Prisma.Decimal(interpretationConfidence), explanation: '' }, regimeAdjustedConfidence: { kind: 'REGIME_ADJUSTED', value: new Prisma.Decimal(50), explanation: '' } }]
      : [],
    limitations: { dataQuality: 'COMPLETE', assumptions: [], notes: [] },
    traceability: { rawDataReferences: [], intermediateCalculations: [], conditionDerivations: [], confidenceDerivation: '' },
    detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(detectionConfidence), explanation: '' },
    methodologyConfidenceCeiling: { kind: 'METHODOLOGY_CEILING', value: new Prisma.Decimal(75), explanation: '' },
  };
}

describe('normalizeElliottWaveResult (S1-012 WP5)', () => {
  it('maps a strong BULLISH reading to BULLISH on TREND/STRUCTURE/MOMENTUM/CONFIRMATION', () => {
    const result = resultWith('The strongest currently-surviving interpretation: a BULLISH 5-wave impulse.', 70, 60);
    const normalized = normalizeElliottWaveResult('ELLIOTT_WAVE', 'ELLIOTT_WAVE', result);
    const byDimension = Object.fromEntries(normalized.signals.map((s) => [s.dimension, s]));
    expect(byDimension.TREND.reading).toBe('BULLISH');
    expect(byDimension.STRUCTURE.reading).toBe('BULLISH');
    expect(byDimension.MOMENTUM.reading).toBe('BULLISH');
    expect(byDimension.CONFIRMATION.reading).toBe('BULLISH');
    expect(byDimension.LIQUIDITY.reading).toBe('NOT_APPLICABLE');
    expect(byDimension.VOLATILITY.reading).toBe('NOT_APPLICABLE');
    expect(byDimension.VOLUME.reading).toBe('NOT_APPLICABLE');
  });

  it('does not confirm MOMENTUM/CONFIRMATION when the underlying confidence is below the disclosed threshold', () => {
    const result = resultWith('a BEARISH 5-wave impulse.', 20, 10);
    const normalized = normalizeElliottWaveResult('ELLIOTT_WAVE', 'ELLIOTT_WAVE', result);
    const byDimension = Object.fromEntries(normalized.signals.map((s) => [s.dimension, s]));
    expect(byDimension.TREND.reading).toBe('BEARISH');
    expect(byDimension.MOMENTUM.reading).toBe('NOT_APPLICABLE');
    expect(byDimension.CONFIRMATION.reading).toBe('NOT_APPLICABLE');
  });

  it('maps a Limitations-only result (no candidate survived) to all seven dimensions NOT_APPLICABLE, never fabricated', () => {
    const result = resultWith(null, 0, 0);
    const normalized = normalizeElliottWaveResult('ELLIOTT_WAVE', 'ELLIOTT_WAVE', result);
    expect(normalized.signals.every((s) => s.reading === 'NOT_APPLICABLE')).toBe(true);
  });
});
