import { Prisma } from '@zenith/database';
import { classifyIctSmcBias } from './ict-smc-bias.classifier';
import type { FairValueGap, IctSmcDirection, LiquiditySweep, OrderBlock } from './ict-smc.types';

function ob(direction: IctSmcDirection): OrderBlock {
  return { stage: 'INSTITUTIONAL_REACTION', direction, timestamp: new Date(), high: new Prisma.Decimal(1), low: new Prisma.Decimal(1), displacementLegTimestamp: new Date() };
}
function fvg(direction: IctSmcDirection): FairValueGap {
  return { stage: 'IMBALANCE', direction, startTimestamp: new Date(), endTimestamp: new Date(), gapLow: new Prisma.Decimal(1), gapHigh: new Prisma.Decimal(2) };
}
function sweep(direction: IctSmcDirection): LiquiditySweep {
  return { stage: 'LIQUIDITY_EVENT', direction, timestamp: new Date(), sweptLevel: new Prisma.Decimal(1) };
}

describe('classifyIctSmcBias (WP6)', () => {
  it('returns exactly one hypothesis for an unambiguous, one-sided reading', () => {
    const hypotheses = classifyIctSmcBias([ob('BULLISH'), ob('BULLISH')], [], []);

    expect(hypotheses).toHaveLength(1);
    expect(hypotheses[0].direction).toBe('BULLISH');
    expect(hypotheses[0].dominantPrimitive).toBe('ORDER_BLOCK');
  });

  it('returns two ranked hypotheses when both directions are equally supported', () => {
    const hypotheses = classifyIctSmcBias([ob('BULLISH')], [], [sweep('BEARISH')]);

    expect(hypotheses).toHaveLength(2);
    expect(hypotheses.map((h) => h.direction).sort()).toEqual(['BEARISH', 'BULLISH']);
  });

  it('returns an empty array when nothing was detected', () => {
    expect(classifyIctSmcBias([], [], [])).toEqual([]);
  });

  it('identifies LIQUIDITY_SWEEP as the dominant primitive when sweeps outnumber Order Blocks for a direction', () => {
    const hypotheses = classifyIctSmcBias([], [fvg('BULLISH')], [sweep('BULLISH'), sweep('BULLISH')]);

    expect(hypotheses[0].dominantPrimitive).toBe('LIQUIDITY_SWEEP');
  });

  it('identifies NEUTRAL as the dominant primitive when Order Block and Liquidity Sweep counts tie', () => {
    const hypotheses = classifyIctSmcBias([ob('BULLISH')], [], [sweep('BULLISH')]);

    expect(hypotheses[0].dominantPrimitive).toBe('NEUTRAL');
  });
});
