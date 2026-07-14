import { Prisma } from '@zenith/database';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import { detectSignal } from './vsa-signal-detector.util';
import type { ClassifiedBar } from './vsa.types';
import { candle } from './vsa-test-fixtures';

function baseBar(overrides: Partial<ClassifiedBar> = {}): ClassifiedBar {
  return {
    point: candle(20, { open: 100, high: 101, low: 99, close: 100 }),
    index: 20,
    atr: new Prisma.Decimal(10),
    spread: 'AVERAGE',
    spreadAtrRatio: 1,
    volume: 'AVERAGE',
    volumeRatio: 1,
    closePosition: 'MID',
    closePositionRatio: 0.5,
    direction: 'UP',
    ...overrides,
  };
}

/** A tight preceding range (highs=101, lows=99) so any bar with high>101 or low<99 is a genuine new local extreme. */
function tightPrecedingPoints(): readonly MarketSeriesPoint[] {
  return Array.from({ length: 5 }, (_, i) => candle(i, { open: 100, high: 101, low: 99, close: 100 }));
}

/** A wide preceding range (highs=130, lows=70) so a bar within it is never a new local extreme. */
function widePrecedingPoints(): readonly MarketSeriesPoint[] {
  return Array.from({ length: 5 }, (_, i) => candle(i, { open: 100, high: 130, low: 70, close: 100 }));
}

describe('detectSignal (S1-018 Sprint Brief, Scope item 3)', () => {
  describe('Upthrust', () => {
    const upthrustBar = baseBar({
      point: candle(20, { open: 95, high: 110, low: 90, close: 92 }), // new local high (110 > 101); closePosition=(92-90)/20=0.1 NEAR_LOW
      spread: 'WIDE',
      volume: 'ULTRA_HIGH',
      closePosition: 'NEAR_LOW',
    });

    it('detects Upthrust from a genuine new local high, WIDE spread, HIGH/ULTRA_HIGH volume, and NEAR_LOW close', () => {
      expect(detectSignal(upthrustBar, tightPrecedingPoints(), 'UNKNOWN')).toBe('UPTHRUST');
    });

    it('never classifies Upthrust when the close position is not NEAR_LOW', () => {
      const nearMiss = baseBar({ ...upthrustBar, closePosition: 'MID' });
      expect(detectSignal(nearMiss, tightPrecedingPoints(), 'UNKNOWN')).toBeNull();
    });
  });

  describe('Shakeout', () => {
    const shakeoutBar = baseBar({
      point: candle(20, { open: 90, high: 100, low: 80, close: 96 }), // new local low (80 < 99); closePosition=(96-80)/20=0.8 NEAR_HIGH
      spread: 'WIDE',
      volume: 'HIGH',
      closePosition: 'NEAR_HIGH',
    });

    it('detects Shakeout from a genuine new local low, WIDE spread, HIGH/ULTRA_HIGH volume, and NEAR_HIGH close', () => {
      expect(detectSignal(shakeoutBar, tightPrecedingPoints(), 'UNKNOWN')).toBe('SHAKEOUT');
    });

    it('never classifies Shakeout when the close position is not NEAR_HIGH', () => {
      const nearMiss = baseBar({ ...shakeoutBar, closePosition: 'MID' });
      expect(detectSignal(nearMiss, tightPrecedingPoints(), 'UNKNOWN')).toBeNull();
    });
  });

  describe('Stopping Volume', () => {
    const stoppingVolumeBar = baseBar({
      point: candle(20, { open: 115, high: 120, low: 90, close: 112 }), // no new extreme against widePrecedingPoints; closePosition=(112-90)/30=0.733 NEAR_HIGH; DOWN (112<115)
      spread: 'WIDE',
      volume: 'ULTRA_HIGH',
      closePosition: 'NEAR_HIGH',
      direction: 'DOWN',
    });

    it('detects Stopping Volume from a down bar closing NEAR_HIGH with no new local extreme', () => {
      expect(detectSignal(stoppingVolumeBar, widePrecedingPoints(), 'UNKNOWN')).toBe('STOPPING_VOLUME');
    });

    it('detects Stopping Volume from an up bar closing NEAR_LOW with no new local extreme', () => {
      const mirrored = baseBar({
        point: candle(21, { open: 95, high: 125, low: 90, close: 97 }), // no new extreme against widePrecedingPoints; closePosition=(97-90)/35=0.2 NEAR_LOW; UP (97>=95)
        spread: 'WIDE',
        volume: 'HIGH',
        closePosition: 'NEAR_LOW',
        direction: 'UP',
      });
      expect(detectSignal(mirrored, widePrecedingPoints(), 'UNKNOWN')).toBe('STOPPING_VOLUME');
    });

    it('never classifies Stopping Volume when the close position is MID', () => {
      const nearMiss = baseBar({ ...stoppingVolumeBar, closePosition: 'MID' });
      expect(detectSignal(nearMiss, widePrecedingPoints(), 'UNKNOWN')).toBeNull();
    });
  });

  describe('No Demand', () => {
    const noDemandBar = baseBar({
      point: candle(20, { open: 100, high: 101, low: 99, close: 100.5 }),
      spread: 'NARROW',
      volume: 'LOW',
      direction: 'UP',
    });

    it('detects No Demand from an up bar, NARROW spread, LOW volume, during an active up-move', () => {
      expect(detectSignal(noDemandBar, tightPrecedingPoints(), 'UP')).toBe('NO_DEMAND');
    });

    it('never classifies No Demand when the broader trend is not an active up-move', () => {
      expect(detectSignal(noDemandBar, tightPrecedingPoints(), 'UNKNOWN')).toBeNull();
      expect(detectSignal(noDemandBar, tightPrecedingPoints(), 'DOWN')).toBeNull();
    });

    it('never classifies No Demand when volume is not LOW', () => {
      const nearMiss = baseBar({ ...noDemandBar, volume: 'AVERAGE' });
      expect(detectSignal(nearMiss, tightPrecedingPoints(), 'UP')).toBeNull();
    });
  });

  describe('No Supply', () => {
    const noSupplyBar = baseBar({
      point: candle(20, { open: 100, high: 101, low: 99, close: 99.5 }),
      spread: 'NARROW',
      volume: 'LOW',
      direction: 'DOWN',
    });

    it('detects No Supply from a down bar, NARROW spread, LOW volume, during an active down-move', () => {
      expect(detectSignal(noSupplyBar, tightPrecedingPoints(), 'DOWN')).toBe('NO_SUPPLY');
    });

    it('never classifies No Supply when the broader trend is not an active down-move', () => {
      expect(detectSignal(noSupplyBar, tightPrecedingPoints(), 'UP')).toBeNull();
    });

    it('never classifies No Supply when spread is not NARROW', () => {
      const nearMiss = baseBar({ ...noSupplyBar, spread: 'AVERAGE' });
      expect(detectSignal(nearMiss, tightPrecedingPoints(), 'DOWN')).toBeNull();
    });
  });

  describe('disclosed priority order resolves genuine raw ambiguity', () => {
    it('classifies a bar simultaneously satisfying Upthrust and the raw (unguarded) Stopping Volume criteria as UPTHRUST only', () => {
      // WIDE, ULTRA_HIGH volume, a genuine new local high, closing NEAR_LOW, and UP direction (close >= open) --
      // this bar's own raw values satisfy Upthrust's own criteria AND would, absent the disclosed
      // "no new local extreme" exclusion, also satisfy Stopping Volume's own "up bar closing NEAR_LOW" clause.
      const ambiguousBar = baseBar({
        point: candle(20, { open: 94, high: 110, low: 90, close: 95 }), // new local high (110>101); closePosition=(95-90)/20=0.25 NEAR_LOW; UP (95>=94)
        spread: 'WIDE',
        volume: 'ULTRA_HIGH',
        closePosition: 'NEAR_LOW',
        direction: 'UP',
      });

      const result = detectSignal(ambiguousBar, tightPrecedingPoints(), 'UNKNOWN');
      expect(result).toBe('UPTHRUST');
      expect(result).not.toBe('STOPPING_VOLUME');
    });
  });
});
