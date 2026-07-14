import { Prisma } from '@zenith/database';
import { normalizeFibonacciAnalysisResult } from './fibonacci-analysis-normalize.util';
import type { AnalysisProviderResult } from '../analysis-provider.types';

function resultWithSummary(summary: string, detectionValue = 60): AnalysisProviderResult {
  return {
    contractVersion: '1.0.0',
    evidence: { detectedConditions: [], missingConditions: [], supporting: [], conflicting: [] },
    interpretation: [{ summary, confidence: { kind: 'INTERPRETATION', value: new Prisma.Decimal(0), explanation: '' }, regimeAdjustedConfidence: { kind: 'REGIME_ADJUSTED', value: new Prisma.Decimal(0), explanation: '' } }],
    limitations: { dataQuality: 'COMPLETE', assumptions: [], notes: [] },
    traceability: { rawDataReferences: [], intermediateCalculations: [], conditionDerivations: [], confidenceDerivation: '' },
    detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(detectionValue), explanation: '' },
    methodologyConfidenceCeiling: { kind: 'METHODOLOGY_CEILING', value: new Prisma.Decimal(72), explanation: '' },
  };
}

function signalFor(normalized: ReturnType<typeof normalizeFibonacciAnalysisResult>, dimension: string) {
  return normalized.signals.find((s) => s.dimension === dimension)!;
}

describe('normalizeFibonacciAnalysisResult', () => {
  it('forces all seven dimensions to NOT_APPLICABLE when interpretation is empty', () => {
    const result: AnalysisProviderResult = { ...resultWithSummary(''), interpretation: [] };
    const normalized = normalizeFibonacciAnalysisResult('FIBONACCI_ANALYSIS', 'FIBONACCI_ANALYSIS', result);
    expect(normalized.signals).toHaveLength(7);
    expect(normalized.signals.every((s) => s.reading === 'NOT_APPLICABLE' && s.strength === 0)).toBe(true);
  });

  it('populates TREND/STRUCTURE as BULLISH and CONFIRMATION for a RESPECTED reading', () => {
    const result = resultWithSummary('[DIRECTION:BULLISH] [REACTION:RESPECTED] human-readable text', 60);
    const normalized = normalizeFibonacciAnalysisResult('FIBONACCI_ANALYSIS', 'FIBONACCI_ANALYSIS', result);

    expect(signalFor(normalized, 'TREND')).toMatchObject({ reading: 'BULLISH', strength: 60 });
    expect(signalFor(normalized, 'STRUCTURE')).toMatchObject({ reading: 'BULLISH', strength: 60 });
    expect(signalFor(normalized, 'CONFIRMATION')).toMatchObject({ reading: 'BULLISH' });
    expect(signalFor(normalized, 'MOMENTUM').reading).toBe('NOT_APPLICABLE');
    expect(signalFor(normalized, 'LIQUIDITY').reading).toBe('NOT_APPLICABLE');
    expect(signalFor(normalized, 'VOLATILITY').reading).toBe('NOT_APPLICABLE');
    expect(signalFor(normalized, 'VOLUME').reading).toBe('NOT_APPLICABLE');
  });

  it('does not populate CONFIRMATION for a BROKEN reading, but still populates TREND as BEARISH', () => {
    const result = resultWithSummary('[DIRECTION:BEARISH] [REACTION:BROKEN] text', 45);
    const normalized = normalizeFibonacciAnalysisResult('FIBONACCI_ANALYSIS', 'FIBONACCI_ANALYSIS', result);
    expect(signalFor(normalized, 'TREND')).toMatchObject({ reading: 'BEARISH' });
    expect(signalFor(normalized, 'CONFIRMATION').reading).toBe('NOT_APPLICABLE');
  });

  it('does not populate CONFIRMATION for an UNTESTED reading', () => {
    const result = resultWithSummary('[DIRECTION:BULLISH] [REACTION:UNTESTED] text');
    const normalized = normalizeFibonacciAnalysisResult('FIBONACCI_ANALYSIS', 'FIBONACCI_ANALYSIS', result);
    expect(signalFor(normalized, 'CONFIRMATION').reading).toBe('NOT_APPLICABLE');
  });
});
