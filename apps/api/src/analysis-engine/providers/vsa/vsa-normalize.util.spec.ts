import { Prisma } from '@zenith/database';
import { normalizeVsaResult } from './vsa-normalize.util';
import type { AnalysisProviderResult } from '../analysis-provider.types';

function buildResult(summary: string | null): AnalysisProviderResult {
  return {
    contractVersion: '1.0.0',
    evidence: { detectedConditions: [], missingConditions: [], supporting: [], conflicting: [] },
    interpretation:
      summary === null
        ? []
        : [
            {
              summary,
              confidence: { kind: 'INTERPRETATION', value: new Prisma.Decimal(50), explanation: '' },
              regimeAdjustedConfidence: { kind: 'REGIME_ADJUSTED', value: new Prisma.Decimal(50), explanation: '' },
            },
          ],
    limitations: { dataQuality: 'COMPLETE', assumptions: [], notes: [] },
    traceability: { rawDataReferences: [], intermediateCalculations: [], conditionDerivations: [], confidenceDerivation: '' },
    detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(60), explanation: '' },
    methodologyConfidenceCeiling: { kind: 'METHODOLOGY_CEILING', value: new Prisma.Decimal(74), explanation: '' },
  };
}

describe('normalizeVsaResult (S1-018 Sprint Brief, Scope item 9)', () => {
  it('populates VOLUME natively (the first Provider to do so) and MOMENTUM/LIQUIDITY/VOLATILITY as NOT_APPLICABLE', () => {
    const result = buildResult('[SIGNAL:UPTHRUST] [CATEGORY:CLIMAX] [DIRECTION:BEARISH] some narrative text.');
    const output = normalizeVsaResult('VSA', 'VSA', result);

    const volume = output.signals.find((s) => s.dimension === 'VOLUME')!;
    expect(volume.reading).toBe('BEARISH');
    expect(volume.strength).toBeGreaterThan(0);

    for (const dimension of ['MOMENTUM', 'LIQUIDITY', 'VOLATILITY'] as const) {
      const signal = output.signals.find((s) => s.dimension === dimension)!;
      expect(signal.reading).toBe('NOT_APPLICABLE');
      expect(signal.strength).toBe(0);
    }
  });

  it('populates TREND/STRUCTURE from the primary signal\'s own implied direction', () => {
    const bullish = normalizeVsaResult('VSA', 'VSA', buildResult('[SIGNAL:SHAKEOUT] [CATEGORY:CLIMAX] [DIRECTION:BULLISH] text.'));
    expect(bullish.signals.find((s) => s.dimension === 'TREND')!.reading).toBe('BULLISH');
    expect(bullish.signals.find((s) => s.dimension === 'STRUCTURE')!.reading).toBe('BULLISH');

    const bearish = normalizeVsaResult('VSA', 'VSA', buildResult('[SIGNAL:NO_DEMAND] [CATEGORY:QUIET] [DIRECTION:BEARISH] text.'));
    expect(bearish.signals.find((s) => s.dimension === 'TREND')!.reading).toBe('BEARISH');
  });

  it('populates CONFIRMATION only for a climax-type signal, else NOT_APPLICABLE', () => {
    const climax = normalizeVsaResult('VSA', 'VSA', buildResult('[SIGNAL:STOPPING_VOLUME] [CATEGORY:CLIMAX] [DIRECTION:BULLISH] text.'));
    expect(climax.signals.find((s) => s.dimension === 'CONFIRMATION')!.reading).toBe('BULLISH');

    const quiet = normalizeVsaResult('VSA', 'VSA', buildResult('[SIGNAL:NO_SUPPLY] [CATEGORY:QUIET] [DIRECTION:BULLISH] text.'));
    expect(quiet.signals.find((s) => s.dimension === 'CONFIRMATION')!.reading).toBe('NOT_APPLICABLE');
  });

  it('reports all seven dimensions NOT_APPLICABLE on the Limitations path (empty interpretation)', () => {
    const output = normalizeVsaResult('VSA', 'VSA', buildResult(null));
    expect(output.signals).toHaveLength(7);
    expect(output.signals.every((s) => s.reading === 'NOT_APPLICABLE' && s.strength === 0)).toBe(true);
  });
});
