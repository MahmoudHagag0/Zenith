import { Prisma } from '@zenith/database';
import { normalizeSupplyDemandResult } from './supply-demand-normalize.util';
import type { AnalysisProviderResult } from '../analysis-provider.types';

function resultWithSummary(summary: string, detectionValue = 60): AnalysisProviderResult {
  return {
    contractVersion: '1.0.0',
    evidence: { detectedConditions: [], missingConditions: [], supporting: [], conflicting: [] },
    interpretation: [{ summary, confidence: { kind: 'INTERPRETATION', value: new Prisma.Decimal(0), explanation: '' }, regimeAdjustedConfidence: { kind: 'REGIME_ADJUSTED', value: new Prisma.Decimal(0), explanation: '' } }],
    limitations: { dataQuality: 'COMPLETE', assumptions: [], notes: [] },
    traceability: { rawDataReferences: [], intermediateCalculations: [], conditionDerivations: [], confidenceDerivation: '' },
    detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(detectionValue), explanation: '' },
    methodologyConfidenceCeiling: { kind: 'METHODOLOGY_CEILING', value: new Prisma.Decimal(68), explanation: '' },
  };
}

function signalFor(normalized: ReturnType<typeof normalizeSupplyDemandResult>, dimension: string) {
  return normalized.signals.find((s) => s.dimension === dimension)!;
}

describe('normalizeSupplyDemandResult', () => {
  it('forces all seven dimensions to NOT_APPLICABLE when interpretation is empty', () => {
    const result: AnalysisProviderResult = { ...resultWithSummary(''), interpretation: [] };
    const normalized = normalizeSupplyDemandResult('SUPPLY_DEMAND', 'SUPPLY_DEMAND', result);
    expect(normalized.signals).toHaveLength(7);
    expect(normalized.signals.every((s) => s.reading === 'NOT_APPLICABLE' && s.strength === 0)).toBe(true);
  });

  it('populates TREND/STRUCTURE/LIQUIDITY as BULLISH and CONFIRMATION for a FRESH/UNMITIGATED DEMAND zone', () => {
    const result = resultWithSummary('[TYPE:DEMAND] [FRESHNESS:FRESH] [MITIGATION:UNMITIGATED] human-readable text', 60);
    const normalized = normalizeSupplyDemandResult('SUPPLY_DEMAND', 'SUPPLY_DEMAND', result);

    expect(signalFor(normalized, 'TREND')).toMatchObject({ reading: 'BULLISH', strength: 60 });
    expect(signalFor(normalized, 'STRUCTURE')).toMatchObject({ reading: 'BULLISH', strength: 60 });
    expect(signalFor(normalized, 'LIQUIDITY')).toMatchObject({ reading: 'BULLISH', strength: 60 });
    expect(signalFor(normalized, 'CONFIRMATION')).toMatchObject({ reading: 'BULLISH' });
    expect(signalFor(normalized, 'MOMENTUM').reading).toBe('NOT_APPLICABLE');
    expect(signalFor(normalized, 'VOLATILITY').reading).toBe('NOT_APPLICABLE');
    expect(signalFor(normalized, 'VOLUME').reading).toBe('NOT_APPLICABLE');
  });

  it('does not populate CONFIRMATION for a TESTED_MULTIPLE/PARTIALLY_MITIGATED SUPPLY zone, but still populates TREND/LIQUIDITY as BEARISH', () => {
    const result = resultWithSummary('[TYPE:SUPPLY] [FRESHNESS:TESTED_MULTIPLE] [MITIGATION:PARTIALLY_MITIGATED] text', 45);
    const normalized = normalizeSupplyDemandResult('SUPPLY_DEMAND', 'SUPPLY_DEMAND', result);

    expect(signalFor(normalized, 'TREND')).toMatchObject({ reading: 'BEARISH' });
    expect(signalFor(normalized, 'LIQUIDITY')).toMatchObject({ reading: 'BEARISH' });
    expect(signalFor(normalized, 'CONFIRMATION').reading).toBe('NOT_APPLICABLE');
  });
});
