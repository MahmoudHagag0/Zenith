import { deriveNetDirection } from './net-direction-ranking.util';
import type { DimensionConfluence } from '../analysis-engine/confluence/confluence.types';

function dim(overrides: Partial<DimensionConfluence>): DimensionConfluence {
  return {
    dimension: 'TREND',
    aggregateReading: 'NOT_APPLICABLE',
    disagreement: false,
    bullishContributors: [],
    bearishContributors: [],
    ...overrides,
  };
}

describe('deriveNetDirection (S1-019 WP3)', () => {
  it('returns NEUTRAL with a zero relevanceScore when every dimension is NOT_APPLICABLE (no qualifying reading)', () => {
    const dimensions = ['TREND', 'MOMENTUM', 'LIQUIDITY', 'STRUCTURE', 'VOLATILITY', 'VOLUME', 'CONFIRMATION'].map((dimension) =>
      dim({ dimension: dimension as DimensionConfluence['dimension'] }),
    );
    const result = deriveNetDirection(dimensions);
    expect(result.netDirection).toBe('NEUTRAL');
    expect(result.relevanceScore).toBe(0);
    expect(result.agreeingDimensions).toBe(0);
  });

  it('returns NEUTRAL on a tie between bullish and bearish dimension counts, never forcing a direction', () => {
    const dimensions = [
      dim({ dimension: 'TREND', aggregateReading: 'BULLISH', bullishContributors: [{ providerId: 'A', reading: 'BULLISH', confidence: 70 }] }),
      dim({ dimension: 'MOMENTUM', aggregateReading: 'BEARISH', bearishContributors: [{ providerId: 'B', reading: 'BEARISH', confidence: 70 }] }),
    ];
    expect(deriveNetDirection(dimensions).netDirection).toBe('NEUTRAL');
  });

  it('nets BULLISH when bullish dimensions outnumber bearish ones, weighting by the top contributor confidence of the winning direction only', () => {
    const dimensions = [
      dim({ dimension: 'TREND', aggregateReading: 'BULLISH', bullishContributors: [{ providerId: 'A', reading: 'BULLISH', confidence: 80 }] }),
      dim({ dimension: 'MOMENTUM', aggregateReading: 'BULLISH', bullishContributors: [{ providerId: 'B', reading: 'BULLISH', confidence: 60 }] }),
      dim({ dimension: 'STRUCTURE', aggregateReading: 'BEARISH', bearishContributors: [{ providerId: 'C', reading: 'BEARISH', confidence: 99 }] }),
    ];
    const result = deriveNetDirection(dimensions);
    expect(result.netDirection).toBe('BULLISH');
    expect(result.agreeingDimensions).toBe(2);
    // netMagnitude (2-1=1) * averageSupportingConfidence ((80+60)/2=70) = 70; the losing side's own 99 confidence never enters the score.
    expect(result.relevanceScore).toBe(70);
  });

  it('always discloses disagreement dimensions, regardless of net direction, and never lets disagreement disqualify ranking', () => {
    const dimensions = [
      dim({ dimension: 'TREND', aggregateReading: 'BULLISH', disagreement: true, bullishContributors: [{ providerId: 'A', reading: 'BULLISH', confidence: 50 }] }),
      dim({ dimension: 'MOMENTUM', aggregateReading: 'BULLISH', bullishContributors: [{ providerId: 'B', reading: 'BULLISH', confidence: 50 }] }),
    ];
    const result = deriveNetDirection(dimensions);
    expect(result.netDirection).toBe('BULLISH');
    expect(result.disagreementDimensions).toEqual(['TREND']);
  });
});
