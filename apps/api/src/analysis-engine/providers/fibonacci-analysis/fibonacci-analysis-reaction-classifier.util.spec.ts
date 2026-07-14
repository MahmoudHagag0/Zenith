import { Prisma } from '@zenith/database';
import { classifyReaction, determineRole } from './fibonacci-analysis-reaction-classifier.util';
import { candle } from './fibonacci-analysis-test-fixtures';

const LEVEL_PRICE = new Prisma.Decimal(100);
const ATR = new Prisma.Decimal(2);

describe('determineRole', () => {
  it('reads SUPPORT when current price is at or above the level, RESISTANCE when below', () => {
    expect(determineRole(LEVEL_PRICE, new Prisma.Decimal(110))).toBe('SUPPORT');
    expect(determineRole(LEVEL_PRICE, new Prisma.Decimal(100))).toBe('SUPPORT');
    expect(determineRole(LEVEL_PRICE, new Prisma.Decimal(90))).toBe('RESISTANCE');
  });
});

describe('classifyReaction', () => {
  it('reads UNTESTED when no subsequent point touches the level', () => {
    const points = [candle(1, { open: 110, high: 112, low: 108, close: 111 })];
    expect(classifyReaction(LEVEL_PRICE, 'SUPPORT', points, ATR)).toBe('UNTESTED');
  });

  it('reads RESPECTED when touched at least once with no decisive close through it (SUPPORT role)', () => {
    const points = [candle(1, { open: 102, high: 103, low: 99, close: 102 })];
    expect(classifyReaction(LEVEL_PRICE, 'SUPPORT', points, ATR)).toBe('RESPECTED');
  });

  it('reads BROKEN when a subsequent point closes decisively through it (SUPPORT role)', () => {
    const points = [candle(1, { open: 102, high: 103, low: 94, close: 95 })]; // close 95, margin 0.5 -> below 99.5
    expect(classifyReaction(LEVEL_PRICE, 'SUPPORT', points, ATR)).toBe('BROKEN');
  });

  it('reads BROKEN when a subsequent point closes decisively through it (RESISTANCE role)', () => {
    const points = [candle(1, { open: 98, high: 106, low: 97, close: 105 })]; // close 105, above 100.5
    expect(classifyReaction(LEVEL_PRICE, 'RESISTANCE', points, ATR)).toBe('BROKEN');
  });

  it('never reads BROKEN for a pierce that closes back within the disclosed margin', () => {
    const points = [candle(1, { open: 102, high: 103, low: 98, close: 100.2 })]; // touches, closes back near the level, within margin
    expect(classifyReaction(LEVEL_PRICE, 'SUPPORT', points, ATR)).toBe('RESPECTED');
  });

  it('scans sequentially so the first break wins, even if a later point would have respected it', () => {
    const points = [candle(1, { open: 102, high: 103, low: 94, close: 95 }), candle(2, { open: 95, high: 103, low: 94, close: 102 })];
    expect(classifyReaction(LEVEL_PRICE, 'SUPPORT', points, ATR)).toBe('BROKEN');
  });
});
