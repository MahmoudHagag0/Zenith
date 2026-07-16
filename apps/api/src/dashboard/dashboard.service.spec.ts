import { DashboardService } from './dashboard.service';
import type { InstrumentReading } from './dashboard.types';
import type { TrackedInstrument } from '../tracked-assets/tracked-assets.service';

function reading(overrides: Partial<InstrumentReading> = {}): InstrumentReading {
  return {
    assetId: 'asset-1',
    computedAt: new Date().toISOString(),
    dimensions: [],
    participation: { participatingCount: 0, totalRegistered: 0, nonParticipating: [] },
    topContributors: [],
    netDirection: 'NEUTRAL',
    relevanceScore: 0,
    agreeingDimensions: 0,
    disagreementDimensions: [],
    ...overrides,
  };
}

function instrument(assetId: string, symbol: string, marketName = 'NASDAQ'): TrackedInstrument {
  return { assetId, symbol, marketName };
}

function buildService(instruments: TrackedInstrument[], getInstrumentReading: jest.Mock) {
  const trackedAssetsService = { getTrackedInstrumentsForUser: jest.fn().mockResolvedValue(instruments) };
  const instrumentReadingService = { getInstrumentReading };
  const service = new DashboardService(trackedAssetsService as never, instrumentReadingService as never);
  return { service, trackedAssetsService };
}

describe('DashboardService (S1-019 WP4)', () => {
  it('gathers tracked instruments via TrackedAssetsService and computes a reading for each', async () => {
    const getInstrumentReading = jest.fn().mockResolvedValue(reading());
    const { service, trackedAssetsService } = buildService(
      [instrument('a1', 'AAA'), instrument('a2', 'BBB'), instrument('a3', 'CCC')],
      getInstrumentReading,
    );

    await service.getDecisionCenter('user-1');

    expect(trackedAssetsService.getTrackedInstrumentsForUser).toHaveBeenCalledWith('user-1');
    expect(getInstrumentReading).toHaveBeenCalledTimes(3);
    expect(getInstrumentReading.mock.calls.map((c) => c[0]).sort()).toEqual(['a1', 'a2', 'a3']);
  });

  it('excludes NEUTRAL readings from opportunities but counts them toward instrumentsConsidered', async () => {
    const getInstrumentReading = jest.fn().mockResolvedValue(reading({ netDirection: 'NEUTRAL' }));
    const { service } = buildService([instrument('a1', 'AAA')], getInstrumentReading);

    const result = await service.getDecisionCenter('user-1');

    expect(result.readiness).toBe('NO_CLEAR_OPPORTUNITY');
    expect(result.instrumentsConsidered).toBe(1);
    expect(result.opportunities).toEqual([]);
  });

  it('ranks qualifying opportunities by relevanceScore, descending', async () => {
    const getInstrumentReading = jest
      .fn()
      .mockResolvedValueOnce(reading({ assetId: 'a1', netDirection: 'BULLISH', relevanceScore: 10 }))
      .mockResolvedValueOnce(reading({ assetId: 'a2', netDirection: 'BEARISH', relevanceScore: 90 }));
    const { service } = buildService([instrument('a1', 'AAA'), instrument('a2', 'BBB')], getInstrumentReading);

    const result = await service.getDecisionCenter('user-1');

    expect(result.readiness).toBe('OPPORTUNITIES_AVAILABLE');
    expect(result.opportunities.map((o) => o.assetId)).toEqual(['a2', 'a1']);
  });

  it('discloses a single instrument failure without aborting the batch, distinct from NO_CLEAR_OPPORTUNITY', async () => {
    const getInstrumentReading = jest
      .fn()
      .mockRejectedValueOnce(new Error('db timeout'))
      .mockResolvedValueOnce(reading({ assetId: 'a2', netDirection: 'BULLISH', relevanceScore: 5 }));
    const { service } = buildService([instrument('a1', 'AAA'), instrument('a2', 'BBB')], getInstrumentReading);

    const result = await service.getDecisionCenter('user-1');

    expect(result.readiness).toBe('OPPORTUNITIES_AVAILABLE');
    expect(result.instrumentsFailed).toEqual([{ assetId: 'a1', reason: 'db timeout' }]);
    expect(result.instrumentsConsidered).toBe(1);
    expect(result.opportunities).toHaveLength(1);
  });

  it('reports DEGRADED only when every attempted instrument fails outright', async () => {
    const getInstrumentReading = jest.fn().mockRejectedValue(new Error('total outage'));
    const { service } = buildService([instrument('a1', 'AAA')], getInstrumentReading);

    const result = await service.getDecisionCenter('user-1');

    expect(result.readiness).toBe('DEGRADED');
    expect(result.instrumentsFailed).toEqual([{ assetId: 'a1', reason: 'total outage' }]);
  });

  it('reports NO_CLEAR_OPPORTUNITY, never DEGRADED, when the trader tracks zero instruments', async () => {
    const getInstrumentReading = jest.fn();
    const { service } = buildService([], getInstrumentReading);

    const result = await service.getDecisionCenter('user-1');

    expect(result.readiness).toBe('NO_CLEAR_OPPORTUNITY');
    expect(getInstrumentReading).not.toHaveBeenCalled();
  });
});
