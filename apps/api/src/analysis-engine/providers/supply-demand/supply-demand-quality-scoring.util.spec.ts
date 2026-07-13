import { Prisma } from '@zenith/database';
import { scoreInterpretation, scoreZoneQuality } from './supply-demand-quality-scoring.util';
import { buildAtrSeries, candle } from './supply-demand-test-fixtures';
import type { RawZoneCandidate } from './supply-demand.types';

function candidateWith(baseHighLow: { high: number; low: number }, departureBody: number): RawZoneCandidate {
  const baseCandle = candle(1, { open: (baseHighLow.high + baseHighLow.low) / 2, high: baseHighLow.high, low: baseHighLow.low, close: (baseHighLow.high + baseHighLow.low) / 2 });
  const departureCandle = candle(2, { open: 100, high: 100 + departureBody + 0.5, low: 99.5, close: 100 + departureBody });
  return { type: 'DEMAND', origin: 'DROP_BASE_RALLY', boundaries: { proximal: new Prisma.Decimal(baseHighLow.high), distal: new Prisma.Decimal(baseHighLow.low) }, baseCandles: [baseCandle], departureCandle };
}

describe('scoreZoneQuality', () => {
  it('scores a tighter base strictly higher than a looser one, holding departure strength fixed', () => {
    const tight = candidateWith({ high: 100.5, low: 99.5 }, 4); // range 1, atr 1 -> ratio 1 (tight)
    const loose = candidateWith({ high: 101.5, low: 98.5 }, 4); // range 3, atr 1 -> ratio 3 (loose)
    const atrSeries = buildAtrSeries([tight.baseCandles[0], tight.departureCandle], 1);

    const tightScore = scoreZoneQuality(tight, atrSeries);
    const looseScore = scoreZoneQuality(loose, atrSeries);

    expect(tightScore.value).toBeGreaterThan(looseScore.value);
  });

  it('scores a stronger departure strictly higher than a weaker one, holding base tightness fixed', () => {
    const weak = candidateWith({ high: 100.5, low: 99.5 }, 1.5); // departure body 1.5, atr 1 -> ratio 1.5 (gate, zero score)
    const strong = candidateWith({ high: 100.5, low: 99.5 }, 3); // departure body 3, atr 1 -> ratio 3 (full score)
    const atrSeries = buildAtrSeries([weak.baseCandles[0], weak.departureCandle], 1);

    const weakScore = scoreZoneQuality(weak, atrSeries);
    const strongScore = scoreZoneQuality(strong, atrSeries);

    expect(strongScore.value).toBeGreaterThan(weakScore.value);
  });

  it('reports a zero score when no ATR value is available', () => {
    const candidate = candidateWith({ high: 100.5, low: 99.5 }, 3);
    expect(scoreZoneQuality(candidate, []).value).toBe(0);
  });
});

describe('scoreInterpretation', () => {
  const qualityScore = { value: 80, baseTightnessScore: 80, departureStrengthScore: 80, explanation: '' };

  it('scores FRESH/UNMITIGATED strictly higher than TESTED_MULTIPLE/FULLY_MITIGATED for an otherwise-identical zone', () => {
    const fresh = scoreInterpretation(qualityScore, 'FRESH', 'UNMITIGATED');
    const failed = scoreInterpretation(qualityScore, 'TESTED_MULTIPLE', 'FULLY_MITIGATED');
    expect(fresh).toBeGreaterThan(failed);
  });

  it('applies a full-strength (1.0) multiplier for FRESH/UNMITIGATED', () => {
    expect(scoreInterpretation(qualityScore, 'FRESH', 'UNMITIGATED')).toBe(80);
  });

  it('scores a merely-touched-but-unbroken zone higher than a broken one at the same freshness', () => {
    const partiallyMitigated = scoreInterpretation(qualityScore, 'TESTED_ONCE', 'PARTIALLY_MITIGATED');
    const fullyMitigated = scoreInterpretation(qualityScore, 'TESTED_ONCE', 'FULLY_MITIGATED');
    expect(partiallyMitigated).toBeGreaterThan(fullyMitigated);
  });
});
