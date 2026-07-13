import { Prisma } from '@zenith/database';
import { normalizePriceActionResult } from './price-action-normalize.util';
import type { AnalysisProviderResult } from '../analysis-provider.types';

function resultWithSummary(summary: string, detectionValue = 65): AnalysisProviderResult {
  return {
    contractVersion: '1.0.0',
    evidence: { detectedConditions: [], missingConditions: [], supporting: [], conflicting: [] },
    interpretation: [{ summary, confidence: { kind: 'INTERPRETATION', value: new Prisma.Decimal(0), explanation: '' }, regimeAdjustedConfidence: { kind: 'REGIME_ADJUSTED', value: new Prisma.Decimal(0), explanation: '' } }],
    limitations: { dataQuality: 'COMPLETE', assumptions: [], notes: [] },
    traceability: { rawDataReferences: [], intermediateCalculations: [], conditionDerivations: [], confidenceDerivation: '' },
    detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(detectionValue), explanation: '' },
    methodologyConfidenceCeiling: { kind: 'METHODOLOGY_CEILING', value: new Prisma.Decimal(70), explanation: '' },
  };
}

function signalFor(normalized: ReturnType<typeof normalizePriceActionResult>, dimension: string) {
  return normalized.signals.find((s) => s.dimension === dimension)!;
}

describe('normalizePriceActionResult', () => {
  it('forces all seven dimensions to NOT_APPLICABLE when interpretation is empty', () => {
    const result: AnalysisProviderResult = {
      ...resultWithSummary(''),
      interpretation: [],
    };
    const normalized = normalizePriceActionResult('PRICE_ACTION', 'PRICE_ACTION', result);
    expect(normalized.signals).toHaveLength(7);
    expect(normalized.signals.every((s) => s.reading === 'NOT_APPLICABLE' && s.strength === 0)).toBe(true);
  });

  it('populates a genuine, natively-computed MOMENTUM signal and CONFIRMATION for BREAKOUT_CONFIRMED', () => {
    const result = resultWithSummary('[STATE:BREAKOUT_CONFIRMED] [DIRECTION:BULLISH] [MOMENTUM_SCORE:73] human-readable text', 65);
    const normalized = normalizePriceActionResult('PRICE_ACTION', 'PRICE_ACTION', result);

    expect(signalFor(normalized, 'TREND')).toMatchObject({ reading: 'BULLISH', strength: 65 });
    expect(signalFor(normalized, 'STRUCTURE')).toMatchObject({ reading: 'BULLISH', strength: 65 });
    expect(signalFor(normalized, 'MOMENTUM')).toMatchObject({ reading: 'BULLISH', strength: 73 });
    expect(signalFor(normalized, 'CONFIRMATION')).toMatchObject({ reading: 'BULLISH' });
    expect(signalFor(normalized, 'LIQUIDITY').reading).toBe('NOT_APPLICABLE');
    expect(signalFor(normalized, 'VOLATILITY').reading).toBe('NOT_APPLICABLE');
    expect(signalFor(normalized, 'VOLUME').reading).toBe('NOT_APPLICABLE');
  });

  it('does not populate CONFIRMATION for BREAKOUT_UNCONFIRMED, but still populates MOMENTUM', () => {
    const result = resultWithSummary('[STATE:BREAKOUT_UNCONFIRMED] [DIRECTION:BULLISH] [MOMENTUM_SCORE:40] text');
    const normalized = normalizePriceActionResult('PRICE_ACTION', 'PRICE_ACTION', result);
    expect(signalFor(normalized, 'CONFIRMATION').reading).toBe('NOT_APPLICABLE');
    expect(signalFor(normalized, 'MOMENTUM')).toMatchObject({ reading: 'BULLISH', strength: 40 });
  });

  it('does not populate MOMENTUM for a REJECTED_LEVEL reading', () => {
    const result = resultWithSummary('[STATE:REJECTED_LEVEL] [DIRECTION:BEARISH] [MOMENTUM_SCORE:0] text');
    const normalized = normalizePriceActionResult('PRICE_ACTION', 'PRICE_ACTION', result);
    expect(signalFor(normalized, 'TREND')).toMatchObject({ reading: 'BEARISH' });
    expect(signalFor(normalized, 'MOMENTUM').reading).toBe('NOT_APPLICABLE');
    expect(signalFor(normalized, 'CONFIRMATION').reading).toBe('NOT_APPLICABLE');
  });

  it('reads NEUTRAL (evaluated, no bias) rather than NOT_APPLICABLE for an APPROACHING_LEVEL reading', () => {
    const result = resultWithSummary('[STATE:APPROACHING_LEVEL] [DIRECTION:NEUTRAL] [MOMENTUM_SCORE:0] text');
    const normalized = normalizePriceActionResult('PRICE_ACTION', 'PRICE_ACTION', result);
    expect(signalFor(normalized, 'TREND')).toMatchObject({ reading: 'NEUTRAL' });
    expect(signalFor(normalized, 'MOMENTUM').reading).toBe('NOT_APPLICABLE');
  });
});
