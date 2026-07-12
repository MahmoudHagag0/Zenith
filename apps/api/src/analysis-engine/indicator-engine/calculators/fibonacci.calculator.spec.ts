import { Prisma } from '@zenith/database';
import { FibonacciCalculator } from './fibonacci.calculator';
import { ComputationRejectedError } from '../../common/computation-rejected.error';

describe('FibonacciCalculator', () => {
  const calculator = new FibonacciCalculator();

  it('computes hand-verified retracement/extension levels for a 100 -> 200 move', () => {
    const result = calculator.compute({ anchorStart: new Prisma.Decimal(100), anchorEnd: new Prisma.Decimal(200) });

    const byRatio = new Map(result.levels.map((l) => [l.ratio, l.price.toNumber()]));
    expect(byRatio.get(0)).toBe(200);
    expect(byRatio.get(0.236)).toBeCloseTo(176.4, 6);
    expect(byRatio.get(0.382)).toBeCloseTo(161.8, 6);
    expect(byRatio.get(0.5)).toBeCloseTo(150, 6);
    expect(byRatio.get(0.618)).toBeCloseTo(138.2, 6);
    expect(byRatio.get(0.786)).toBeCloseTo(121.4, 6);
    expect(byRatio.get(1)).toBe(100);
    expect(byRatio.get(1.272)).toBeCloseTo(72.8, 6);
    expect(byRatio.get(1.618)).toBeCloseTo(38.2, 6);
  });

  it('flags the 50% level as not a true Fibonacci ratio, and every other level as true', () => {
    const result = calculator.compute({ anchorStart: new Prisma.Decimal(100), anchorEnd: new Prisma.Decimal(200) });
    for (const level of result.levels) {
      expect(level.isTrueFibonacciRatio).toBe(level.ratio !== 0.5);
    }
  });

  it('rejects when the two anchors are identical', () => {
    expect(() =>
      calculator.compute({ anchorStart: new Prisma.Decimal(100), anchorEnd: new Prisma.Decimal(100) }),
    ).toThrow(ComputationRejectedError);
  });

  it('does not attribute the trading application to a single canonical source', () => {
    const result = calculator.compute({ anchorStart: new Prisma.Decimal(0), anchorEnd: new Prisma.Decimal(1) });
    expect(result.metadata.source).toContain('Liber Abaci');
    expect(result.metadata.source).toContain('no single canonical trading-application source');
  });
});
