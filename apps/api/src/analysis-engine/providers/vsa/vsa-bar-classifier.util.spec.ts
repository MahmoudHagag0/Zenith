import { Prisma } from '@zenith/database';
import { classifyBar } from './vsa-bar-classifier.util';
import { candle } from './vsa-test-fixtures';

const ATR = new Prisma.Decimal(10);

function precedingWithVolume(volume: number, count = 5) {
  return Array.from({ length: count }, (_, i) => candle(i, { open: 100, high: 101, low: 99, close: 100.5 }, volume));
}

describe('classifyBar (S1-018 Sprint Brief, Scope item 2)', () => {
  describe('spread classification', () => {
    it('reads NARROW when the bar range is at or below 0.5x ATR', () => {
      const bar = candle(10, { open: 100, high: 102, low: 98, close: 100 }, 1000); // range=4, ratio=0.4
      const result = classifyBar(bar, 10, precedingWithVolume(1000), ATR);
      expect(result.spread).toBe('NARROW');
      expect(result.spreadAtrRatio).toBeCloseTo(0.4);
    });

    it('reads AVERAGE between the two thresholds', () => {
      const bar = candle(10, { open: 100, high: 105, low: 95, close: 100 }, 1000); // range=10, ratio=1.0
      const result = classifyBar(bar, 10, precedingWithVolume(1000), ATR);
      expect(result.spread).toBe('AVERAGE');
    });

    it('reads WIDE when the bar range is at or above 1.5x ATR', () => {
      const bar = candle(10, { open: 100, high: 110, low: 90, close: 100 }, 1000); // range=20, ratio=2.0
      const result = classifyBar(bar, 10, precedingWithVolume(1000), ATR);
      expect(result.spread).toBe('WIDE');
    });
  });

  describe('volume classification (relative to a trailing average computed strictly from preceding bars)', () => {
    it('reads LOW when volume is at or below 0.7x the trailing average', () => {
      const bar = candle(10, { open: 100, high: 101, low: 99, close: 100 }, 700);
      const result = classifyBar(bar, 10, precedingWithVolume(1000), ATR);
      expect(result.volume).toBe('LOW');
    });

    it('reads AVERAGE between the two thresholds', () => {
      const bar = candle(10, { open: 100, high: 101, low: 99, close: 100 }, 1000);
      const result = classifyBar(bar, 10, precedingWithVolume(1000), ATR);
      expect(result.volume).toBe('AVERAGE');
    });

    it('reads HIGH when volume is at or above 1.5x the trailing average', () => {
      const bar = candle(10, { open: 100, high: 101, low: 99, close: 100 }, 1600);
      const result = classifyBar(bar, 10, precedingWithVolume(1000), ATR);
      expect(result.volume).toBe('HIGH');
    });

    it('reads ULTRA_HIGH when volume is at or above 2.5x the trailing average', () => {
      const bar = candle(10, { open: 100, high: 101, low: 99, close: 100 }, 2600);
      const result = classifyBar(bar, 10, precedingWithVolume(1000), ATR);
      expect(result.volume).toBe('ULTRA_HIGH');
    });

    it('never includes the classified bar itself in its own trailing average (no look-ahead)', () => {
      const preceding = precedingWithVolume(1000);
      const bar = candle(10, { open: 100, high: 101, low: 99, close: 100 }, 999_999);
      const result = classifyBar(bar, 10, preceding, ATR);
      // If the bar's own extreme volume leaked into the baseline, its own ratio would collapse toward 1 (AVERAGE) instead of reading ULTRA_HIGH.
      expect(result.volume).toBe('ULTRA_HIGH');
    });
  });

  describe('close position classification', () => {
    it('reads NEAR_HIGH at or above 0.7 of the bar range', () => {
      const bar = candle(10, { open: 100, high: 110, low: 100, close: 108 }, 1000); // (108-100)/10=0.8
      const result = classifyBar(bar, 10, precedingWithVolume(1000), ATR);
      expect(result.closePosition).toBe('NEAR_HIGH');
    });

    it('reads MID between the two thresholds', () => {
      const bar = candle(10, { open: 100, high: 110, low: 100, close: 105 }, 1000); // 0.5
      const result = classifyBar(bar, 10, precedingWithVolume(1000), ATR);
      expect(result.closePosition).toBe('MID');
    });

    it('reads NEAR_LOW at or below 0.3 of the bar range', () => {
      const bar = candle(10, { open: 100, high: 110, low: 100, close: 102 }, 1000); // 0.2
      const result = classifyBar(bar, 10, precedingWithVolume(1000), ATR);
      expect(result.closePosition).toBe('NEAR_LOW');
    });
  });

  describe('direction', () => {
    it('reads UP when close >= open', () => {
      const bar = candle(10, { open: 100, high: 105, low: 99, close: 101 }, 1000);
      expect(classifyBar(bar, 10, precedingWithVolume(1000), ATR).direction).toBe('UP');
    });

    it('reads DOWN when close < open', () => {
      const bar = candle(10, { open: 101, high: 105, low: 99, close: 100 }, 1000);
      expect(classifyBar(bar, 10, precedingWithVolume(1000), ATR).direction).toBe('DOWN');
    });
  });
});
