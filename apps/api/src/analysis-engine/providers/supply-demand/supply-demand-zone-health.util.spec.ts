import { Prisma } from '@zenith/database';
import { assessZoneHealth } from './supply-demand-zone-health.util';
import { candle } from './supply-demand-test-fixtures';
import type { RawZoneCandidate } from './supply-demand.types';

const DEMAND_CANDIDATE: RawZoneCandidate = {
  type: 'DEMAND',
  origin: 'DROP_BASE_RALLY',
  boundaries: { proximal: new Prisma.Decimal(106), distal: new Prisma.Decimal(104) },
  baseCandles: [],
  departureCandle: candle(2, { open: 104.5, high: 112.5, low: 104, close: 112 }),
};

describe('assessZoneHealth', () => {
  it('reads FRESH/UNMITIGATED when no subsequent point touches the zone', () => {
    const subsequent = [candle(3, { open: 107, high: 108, low: 107, close: 107.5 })];
    expect(assessZoneHealth(DEMAND_CANDIDATE, subsequent)).toEqual({ freshness: 'FRESH', mitigation: 'UNMITIGATED' });
  });

  it('reads TESTED_ONCE/PARTIALLY_MITIGATED for a single touch that never closes beyond distal', () => {
    const subsequent = [candle(3, { open: 106, high: 107, low: 105, close: 106 })];
    expect(assessZoneHealth(DEMAND_CANDIDATE, subsequent)).toEqual({ freshness: 'TESTED_ONCE', mitigation: 'PARTIALLY_MITIGATED' });
  });

  it('reads TESTED_ONCE/FULLY_MITIGATED for a single touch that closes beyond distal', () => {
    const subsequent = [candle(3, { open: 105, high: 105, low: 102, close: 103 })];
    expect(assessZoneHealth(DEMAND_CANDIDATE, subsequent)).toEqual({ freshness: 'TESTED_ONCE', mitigation: 'FULLY_MITIGATED' });
  });

  it('reads TESTED_MULTIPLE for two distinct touch episodes separated by a non-touching gap', () => {
    const subsequent = [
      candle(3, { open: 106, high: 107, low: 105, close: 106 }), // touch 1
      candle(4, { open: 108, high: 109, low: 108, close: 108.5 }), // gap (no touch)
      candle(5, { open: 105.5, high: 106.5, low: 105, close: 105.5 }), // touch 2
    ];
    expect(assessZoneHealth(DEMAND_CANDIDATE, subsequent).freshness).toBe('TESTED_MULTIPLE');
  });

  it('proves freshness and mitigation vary independently: TESTED_MULTIPLE can still be only PARTIALLY_MITIGATED', () => {
    const subsequent = [
      candle(3, { open: 106, high: 107, low: 105, close: 106 }),
      candle(4, { open: 108, high: 109, low: 108, close: 108.5 }),
      candle(5, { open: 105.5, high: 106.5, low: 105, close: 105.5 }),
    ];
    expect(assessZoneHealth(DEMAND_CANDIDATE, subsequent)).toEqual({ freshness: 'TESTED_MULTIPLE', mitigation: 'PARTIALLY_MITIGATED' });
  });

  it('never reverts FULLY_MITIGATED back to a weaker status once set, even if later touches hold', () => {
    const subsequent = [
      candle(3, { open: 105, high: 105, low: 102, close: 103 }), // fully mitigates
      candle(4, { open: 103, high: 107, low: 103, close: 106 }), // later touch, closes back above distal
    ];
    expect(assessZoneHealth(DEMAND_CANDIDATE, subsequent).mitigation).toBe('FULLY_MITIGATED');
  });
});
