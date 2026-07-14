import { Prisma } from '@zenith/database';
import { normalizeWyckoffResult } from './wyckoff-normalize.util';
import type { AnalysisProviderResult } from '../analysis-provider.types';

function resultWithConditions(detectedConditions: string[], detectionConfidence = 70): AnalysisProviderResult {
  return {
    contractVersion: '1.0.0',
    evidence: { detectedConditions, missingConditions: [], supporting: [], conflicting: [] },
    interpretation: detectedConditions.length > 0 ? [{ summary: 'test', confidence: { kind: 'INTERPRETATION', value: new Prisma.Decimal(50), explanation: '' }, regimeAdjustedConfidence: { kind: 'REGIME_ADJUSTED', value: new Prisma.Decimal(50), explanation: '' } }] : [],
    limitations: { dataQuality: 'COMPLETE', assumptions: [], notes: [] },
    traceability: { rawDataReferences: [], intermediateCalculations: [], conditionDerivations: [], confidenceDerivation: '' },
    detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(detectionConfidence), explanation: '' },
    methodologyConfidenceCeiling: { kind: 'METHODOLOGY_CEILING', value: new Prisma.Decimal(85), explanation: '' },
  };
}

describe('normalizeWyckoffResult (S1-012 WP3)', () => {
  it('maps a fully-confirmed Accumulation schematic to BULLISH on TREND/STRUCTURE/VOLUME/CONFIRMATION', () => {
    const result = resultWithConditions([
      'Preliminary Support: first swing low at 95.00, first evidence of buying interest.',
      'Selling Climax: swing low at 90.00 on 3.1x trailing volume.',
      'Sign of Strength: swing high at 106.00, breaking above resistance (100.00).',
      'Last Point of Support: higher low at 93.00, holding above support.',
    ]);

    const normalized = normalizeWyckoffResult('WYCKOFF', 'WYCKOFF', result);

    expect(normalized.signals).toHaveLength(7);
    const byDimension = Object.fromEntries(normalized.signals.map((s) => [s.dimension, s]));
    expect(byDimension.TREND.reading).toBe('BULLISH');
    expect(byDimension.STRUCTURE.reading).toBe('BULLISH');
    expect(byDimension.VOLUME.reading).toBe('BULLISH');
    expect(byDimension.CONFIRMATION.reading).toBe('BULLISH');
    expect(byDimension.MOMENTUM.reading).toBe('NOT_APPLICABLE');
    expect(byDimension.LIQUIDITY.reading).toBe('NOT_APPLICABLE');
    expect(byDimension.VOLATILITY.reading).toBe('NOT_APPLICABLE');
  });

  it('maps a fully-confirmed Distribution schematic to BEARISH on the same dimensions', () => {
    const result = resultWithConditions([
      'Buying Climax: swing high at 110.00 on 3.2x trailing volume.',
      'Sign of Weakness: swing low at 94.00, breaking below support (100.00).',
      'Last Point of Supply: lower high at 107.00, holding below resistance.',
    ]);

    const normalized = normalizeWyckoffResult('WYCKOFF', 'WYCKOFF', result);
    const byDimension = Object.fromEntries(normalized.signals.map((s) => [s.dimension, s]));
    expect(byDimension.TREND.reading).toBe('BEARISH');
    expect(byDimension.STRUCTURE.reading).toBe('BEARISH');
    expect(byDimension.VOLUME.reading).toBe('BEARISH');
    expect(byDimension.CONFIRMATION.reading).toBe('BEARISH');
  });

  it('maps a Limitations-only result (no events detected) to all seven dimensions NOT_APPLICABLE, never fabricated', () => {
    const result = resultWithConditions([], 0);
    const normalized = normalizeWyckoffResult('WYCKOFF', 'WYCKOFF', result);
    expect(normalized.signals.every((s) => s.reading === 'NOT_APPLICABLE')).toBe(true);
  });

  it('every non-NOT_APPLICABLE signal has a non-empty explanation and a strength in [0,100]', () => {
    const result = resultWithConditions(['Selling Climax: swing low at 90.00 on 3.1x trailing volume.', 'Sign of Strength: swing high at 106.00, breaking above resistance (100.00).']);
    const normalized = normalizeWyckoffResult('WYCKOFF', 'WYCKOFF', result);
    for (const signal of normalized.signals) {
      expect(signal.strength).toBeGreaterThanOrEqual(0);
      expect(signal.strength).toBeLessThanOrEqual(100);
      if (signal.reading !== 'NOT_APPLICABLE') {
        expect(signal.explanation.length).toBeGreaterThan(0);
      }
    }
  });
});
