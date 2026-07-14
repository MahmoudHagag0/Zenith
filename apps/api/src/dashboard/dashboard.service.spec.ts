import { DashboardService } from './dashboard.service';
import type { InstrumentReading } from './dashboard.types';

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

function asset(id: string, symbol: string, marketName = 'NASDAQ') {
  return { id, symbol, market: { name: marketName } };
}

function buildService(prismaOverrides: { watchlistItems?: unknown[]; positions?: unknown[] }, getInstrumentReading: jest.Mock) {
  const prisma = {
    watchlistItem: { findMany: jest.fn().mockResolvedValue(prismaOverrides.watchlistItems ?? []) },
    position: { findMany: jest.fn().mockResolvedValue(prismaOverrides.positions ?? []) },
  };
  const instrumentReadingService = { getInstrumentReading };
  const service = new DashboardService(prisma as never, instrumentReadingService as never);
  return { service, prisma };
}

describe('DashboardService (S1-019 WP4)', () => {
  it('gathers the union of Watchlist and open-Position instruments, deduplicated by assetId', async () => {
    const getInstrumentReading = jest.fn().mockResolvedValue(reading());
    const { service, prisma } = buildService(
      {
        watchlistItems: [{ asset: asset('a1', 'AAA') }, { asset: asset('a2', 'BBB') }],
        positions: [{ asset: asset('a2', 'BBB') }, { asset: asset('a3', 'CCC') }],
      },
      getInstrumentReading,
    );

    await service.getDecisionCenter('user-1');

    expect(getInstrumentReading).toHaveBeenCalledTimes(3);
    expect(getInstrumentReading.mock.calls.map((c) => c[0]).sort()).toEqual(['a1', 'a2', 'a3']);
    expect(prisma.position.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { portfolio: { userId: 'user-1' }, quantity: { gt: 0 } } }));
  });

  it('excludes NEUTRAL readings from opportunities but counts them toward instrumentsConsidered', async () => {
    const getInstrumentReading = jest.fn().mockResolvedValue(reading({ netDirection: 'NEUTRAL' }));
    const { service } = buildService({ watchlistItems: [{ asset: asset('a1', 'AAA') }] }, getInstrumentReading);

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
    const { service } = buildService(
      { watchlistItems: [{ asset: asset('a1', 'AAA') }, { asset: asset('a2', 'BBB') }] },
      getInstrumentReading,
    );

    const result = await service.getDecisionCenter('user-1');

    expect(result.readiness).toBe('OPPORTUNITIES_AVAILABLE');
    expect(result.opportunities.map((o) => o.assetId)).toEqual(['a2', 'a1']);
  });

  it('discloses a single instrument failure without aborting the batch, distinct from NO_CLEAR_OPPORTUNITY', async () => {
    const getInstrumentReading = jest
      .fn()
      .mockRejectedValueOnce(new Error('db timeout'))
      .mockResolvedValueOnce(reading({ assetId: 'a2', netDirection: 'BULLISH', relevanceScore: 5 }));
    const { service } = buildService(
      { watchlistItems: [{ asset: asset('a1', 'AAA') }, { asset: asset('a2', 'BBB') }] },
      getInstrumentReading,
    );

    const result = await service.getDecisionCenter('user-1');

    expect(result.readiness).toBe('OPPORTUNITIES_AVAILABLE');
    expect(result.instrumentsFailed).toEqual([{ assetId: 'a1', reason: 'db timeout' }]);
    expect(result.instrumentsConsidered).toBe(1);
    expect(result.opportunities).toHaveLength(1);
  });

  it('reports DEGRADED only when every attempted instrument fails outright', async () => {
    const getInstrumentReading = jest.fn().mockRejectedValue(new Error('total outage'));
    const { service } = buildService({ watchlistItems: [{ asset: asset('a1', 'AAA') }] }, getInstrumentReading);

    const result = await service.getDecisionCenter('user-1');

    expect(result.readiness).toBe('DEGRADED');
    expect(result.instrumentsFailed).toEqual([{ assetId: 'a1', reason: 'total outage' }]);
  });

  it('reports NO_CLEAR_OPPORTUNITY, never DEGRADED, when the trader tracks zero instruments', async () => {
    const getInstrumentReading = jest.fn();
    const { service } = buildService({}, getInstrumentReading);

    const result = await service.getDecisionCenter('user-1');

    expect(result.readiness).toBe('NO_CLEAR_OPPORTUNITY');
    expect(getInstrumentReading).not.toHaveBeenCalled();
  });
});
