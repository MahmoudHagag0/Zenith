import { buildComputationMetadata } from '../../common/computation-metadata.util';
import { ComputationRejectedError } from '../../common/computation-rejected.error';
import type { FibonacciLevel, FibonacciParams } from '../indicator-engine.types';
import type { ComputationMetadata } from '../../common/computation-metadata.util';

const COMPUTATION_VERSION = '1.0.0';

// 0.5 is a universally-used retracement level but is NOT a true
// Fibonacci-sequence-derived ratio (it is a "half-way" convention
// borrowed from Dow Theory) — flagged per-level via
// `isTrueFibonacciRatio`, per the architecture research's documented
// source disagreement on this point.
const RATIOS: ReadonlyArray<{ ratio: number; isTrueFibonacciRatio: boolean }> = [
  { ratio: 0, isTrueFibonacciRatio: true },
  { ratio: 0.236, isTrueFibonacciRatio: true },
  { ratio: 0.382, isTrueFibonacciRatio: true },
  { ratio: 0.5, isTrueFibonacciRatio: false },
  { ratio: 0.618, isTrueFibonacciRatio: true },
  { ratio: 0.786, isTrueFibonacciRatio: true },
  { ratio: 1, isTrueFibonacciRatio: true },
  { ratio: 1.272, isTrueFibonacciRatio: true },
  { ratio: 1.618, isTrueFibonacciRatio: true },
];

/**
 * Fibonacci retracement/extension ratio calculator. The sequence/ratios
 * originate from Leonardo of Pisa, "Liber Abaci" (1202) — a mathematics
 * text, not a trading text; there is no single canonical "trading
 * application" source. Per 22_ANALYSIS_ENGINE_ARCHITECTURE.md, this is
 * Indicator Engine infrastructure, never an independent Analysis
 * Provider — it carries no independent confidence or interpretation, and
 * anchor selection is the caller's responsibility, not this calculator's.
 */
export class FibonacciCalculator {
  readonly name = 'Fibonacci';

  compute(params: FibonacciParams): { levels: readonly FibonacciLevel[]; metadata: ComputationMetadata } {
    const { anchorStart, anchorEnd } = params;
    if (anchorStart.equals(anchorEnd)) {
      throw new ComputationRejectedError('Fibonacci', 'anchorStart and anchorEnd must differ');
    }

    const range = anchorEnd.minus(anchorStart);
    const levels: FibonacciLevel[] = RATIOS.map(({ ratio, isTrueFibonacciRatio }) => ({
      ratio,
      price: anchorEnd.minus(range.times(ratio)),
      isTrueFibonacciRatio,
    }));

    return {
      levels,
      metadata: buildComputationMetadata({
        computation: 'Fibonacci',
        parameters: { anchorStart: anchorStart.toString(), anchorEnd: anchorEnd.toString() },
        formula: 'level(ratio) = anchorEnd - (anchorEnd - anchorStart) * ratio.',
        source:
          'Leonardo of Pisa, "Liber Abaci" (1202) — mathematical origin only; no single canonical trading-application source exists.',
        points: [],
        computationVersion: COMPUTATION_VERSION,
      }),
    };
  }
}

export { RATIOS as FIBONACCI_RATIOS };
