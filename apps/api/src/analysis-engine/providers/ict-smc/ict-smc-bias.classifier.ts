import type { FairValueGap, IctSmcBiasHypothesis, IctSmcDirection, LiquiditySweep, OrderBlock } from './ict-smc.types';

/** Bounded, disclosed maximum for the bias `interpretation[]` (S1-010 Sprint Brief, Missing Decisions) — an unbounded search is not authorized. */
const MAX_BIAS_HYPOTHESES = 2;

interface DirectionScore {
  readonly obCount: number;
  readonly fvgCount: number;
  readonly sweepCount: number;
  readonly total: number;
}

function scoreFor(direction: IctSmcDirection, orderBlocks: readonly OrderBlock[], fairValueGaps: readonly FairValueGap[], liquiditySweeps: readonly LiquiditySweep[]): DirectionScore {
  const obCount = orderBlocks.filter((ob) => ob.direction === direction).length;
  const fvgCount = fairValueGaps.filter((fvg) => fvg.direction === direction).length;
  const sweepCount = liquiditySweeps.filter((sweep) => sweep.direction === direction).length;
  return { obCount, fvgCount, sweepCount, total: obCount + fvgCount + sweepCount };
}

function dominantPrimitive(obCount: number, sweepCount: number): 'ORDER_BLOCK' | 'LIQUIDITY_SWEEP' | 'NEUTRAL' {
  if (obCount > sweepCount) return 'ORDER_BLOCK';
  if (sweepCount > obCount) return 'LIQUIDITY_SWEEP';
  return 'NEUTRAL';
}

function toScore(count: number, opposing: number): number {
  return count + opposing === 0 ? 0 : (count / (count + opposing)) * 100;
}

/**
 * Synthesizes detected Order Blocks, Fair Value Gaps, and Liquidity Sweeps
 * into a bounded, ranked directional bias reading (S1-010 Sprint Brief,
 * Scope item 6). Returns more than one candidate only when the two
 * directions' evidence genuinely ties — never an unbounded search
 * (`MAX_BIAS_HYPOTHESES`, disclosed here as a Missing Decision).
 */
export function classifyIctSmcBias(orderBlocks: readonly OrderBlock[], fairValueGaps: readonly FairValueGap[], liquiditySweeps: readonly LiquiditySweep[]): IctSmcBiasHypothesis[] {
  const bullish = scoreFor('BULLISH', orderBlocks, fairValueGaps, liquiditySweeps);
  const bearish = scoreFor('BEARISH', orderBlocks, fairValueGaps, liquiditySweeps);

  if (bullish.total === 0 && bearish.total === 0) return [];

  const bullishHypothesis: IctSmcBiasHypothesis = {
    direction: 'BULLISH',
    score: toScore(bullish.total, bearish.total),
    dominantPrimitive: dominantPrimitive(bullish.obCount, bullish.sweepCount),
    summary: `Bullish bias: ${bullish.obCount} bullish Order Block(s), ${bullish.fvgCount} bullish Fair Value Gap(s), ${bullish.sweepCount} bullish Liquidity Sweep(s).`,
  };
  const bearishHypothesis: IctSmcBiasHypothesis = {
    direction: 'BEARISH',
    score: toScore(bearish.total, bullish.total),
    dominantPrimitive: dominantPrimitive(bearish.obCount, bearish.sweepCount),
    summary: `Bearish bias: ${bearish.obCount} bearish Order Block(s), ${bearish.fvgCount} bearish Fair Value Gap(s), ${bearish.sweepCount} bearish Liquidity Sweep(s).`,
  };

  if (bullish.total === bearish.total) {
    // Genuinely conflicting evidence -- both directions equally supported. Ranked equally, bounded at MAX_BIAS_HYPOTHESES.
    return [bullishHypothesis, bearishHypothesis].slice(0, MAX_BIAS_HYPOTHESES);
  }

  return [bullish.total > bearish.total ? bullishHypothesis : bearishHypothesis];
}
