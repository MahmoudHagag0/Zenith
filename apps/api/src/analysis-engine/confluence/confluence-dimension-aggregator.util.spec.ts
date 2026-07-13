import { aggregateDimension } from './confluence-dimension-aggregator.util';
import { EqualWeightStrategy } from './equal-weight.strategy';
import type { DimensionContribution } from './confluence.types';

const weightStrategy = new EqualWeightStrategy();

function contribution(providerId: string, reading: DimensionContribution['reading'], strength: number, methodologyFamily?: string): DimensionContribution {
  return { providerId, methodologyFamily, reading, strength };
}

describe('aggregateDimension (S1-012 WP9)', () => {
  it('flags disagreement and lists all contributing Providers per side when 3 read BULLISH and 2 read BEARISH', () => {
    const contributions = [
      contribution('A', 'BULLISH', 80),
      contribution('B', 'BULLISH', 60),
      contribution('C', 'BULLISH', 40),
      contribution('D', 'BEARISH', 70),
      contribution('E', 'BEARISH', 50),
    ];

    const result = aggregateDimension('TREND', contributions, weightStrategy);

    expect(result.disagreement).toBe(true);
    expect(result.bullishContributors.map((c) => c.providerId)).toEqual(['A', 'B', 'C']);
    expect(result.bearishContributors.map((c) => c.providerId)).toEqual(['D', 'E']);
  });

  it('bounds contributing Providers at the top 3 by confidence, regardless of how many participate', () => {
    const contributions = [
      contribution('A', 'BULLISH', 90),
      contribution('B', 'BULLISH', 80),
      contribution('C', 'BULLISH', 70),
      contribution('D', 'BULLISH', 60),
      contribution('E', 'BULLISH', 50),
      contribution('F', 'BEARISH', 30),
      contribution('G', 'BEARISH', 20),
    ];

    const result = aggregateDimension('TREND', contributions, weightStrategy);

    expect(result.bullishContributors).toHaveLength(3);
    expect(result.bullishContributors.map((c) => c.providerId)).toEqual(['A', 'B', 'C']);
  });

  it('reports no disagreement when every contributing Provider agrees', () => {
    const contributions = [contribution('A', 'BULLISH', 80), contribution('B', 'BULLISH', 60)];
    const result = aggregateDimension('TREND', contributions, weightStrategy);
    expect(result.disagreement).toBe(false);
    expect(result.aggregateReading).toBe('BULLISH');
  });

  it('excludes NOT_APPLICABLE contributions entirely, and reports NOT_APPLICABLE when every contribution is NOT_APPLICABLE', () => {
    const contributions = [contribution('A', 'NOT_APPLICABLE', 0), contribution('B', 'NOT_APPLICABLE', 0)];
    const result = aggregateDimension('LIQUIDITY', contributions, weightStrategy);
    expect(result.aggregateReading).toBe('NOT_APPLICABLE');
    expect(result.disagreement).toBe(false);
  });

  it('combines two same-family Providers into one vote, never double-counting them as independent confirmation', () => {
    const contributions = [
      contribution('A', 'BULLISH', 90, 'FAMILY_X'),
      contribution('B', 'BULLISH', 70, 'FAMILY_X'),
      contribution('C', 'BEARISH', 95, 'FAMILY_Y'),
    ];

    const result = aggregateDimension('TREND', contributions, weightStrategy);

    // Two same-family bullish Providers combine into a single vote whose strength (80, the
    // family average) is still less than the single bearish Provider's own 95 -- so the
    // aggregate correctly reads BEARISH, which a naive (non-family-aware) sum (90+70=160 vs 95)
    // would have gotten wrong.
    expect(result.aggregateReading).toBe('BEARISH');
    expect(result.bullishContributors).toHaveLength(1);
  });
});
