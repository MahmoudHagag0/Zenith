import { Prisma } from '@zenith/database';
import { FixtureProvider } from './__fixtures__/fixture-provider';
import type { MarketSeries } from '../market-series/market-series.types';

function emptySeries(): MarketSeries {
  return {
    assetId: 'asset-1',
    requestedRange: { from: new Date('2026-01-01'), to: new Date('2026-01-01') },
    points: [],
    missingDates: [],
    currentQuote: { price: null, currency: null, asOf: null, fetchedAt: null, ageSeconds: null, dataQuality: { kind: 'current', freshness: 'MISSING' } },
  };
}

describe('AnalysisProvider contract (WP1)', () => {
  it('a fixture Provider satisfies the full AnalysisProvider interface', async () => {
    const provider = new FixtureProvider({ id: 'fixture-a' });
    expect(provider.id).toBe('fixture-a');
    expect(provider.tier).toBe('FAST');
    expect(provider.lifecycleState).toBe('ACTIVE');
    expect(provider.computationVersion).toBe('1.0.0');

    const result = await provider.analyze(emptySeries());
    expect(result.contractVersion).toBe('1.0.0');
    expect(Array.isArray(result.interpretation)).toBe(true);
    expect(result.interpretation).toHaveLength(1);
    expect(result.interpretation[0].confidence.kind).toBe('INTERPRETATION');
    expect(result.interpretation[0].confidence.value).toBeInstanceOf(Prisma.Decimal);
    expect(result.limitations.dataQuality).toBe('COMPLETE');
    expect(result.traceability.confidenceDerivation).toBeTruthy();

    const normalized = provider.normalize(result);
    expect(normalized.providerId).toBe('fixture-a');
    expect(normalized.signals).toHaveLength(7);
    expect(normalized.signals.every((signal) => signal.reading === 'NOT_APPLICABLE')).toBe(true);
  });

  it('a THROW-configured fixture rejects rather than returning a malformed result', async () => {
    const provider = new FixtureProvider({ id: 'fixture-b', behavior: 'THROW' });
    await expect(provider.analyze(emptySeries())).rejects.toThrow('fixture-b fixture configured to throw');
  });

  it('supports dependsOn, tier, lifecycleState, and timeoutMs configuration', () => {
    const provider = new FixtureProvider({
      id: 'fixture-c',
      tier: 'SLOW',
      lifecycleState: 'DEPRECATED',
      dependsOn: ['fixture-a', 'fixture-b'],
      timeoutMs: 500,
    });
    expect(provider.tier).toBe('SLOW');
    expect(provider.lifecycleState).toBe('DEPRECATED');
    expect(provider.dependsOn).toEqual(['fixture-a', 'fixture-b']);
    expect(provider.timeoutMs).toBe(500);
  });
});
