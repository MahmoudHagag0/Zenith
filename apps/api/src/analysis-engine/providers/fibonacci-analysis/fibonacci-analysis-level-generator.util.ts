import type { SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { IndicatorEngine } from '../../indicator-engine/indicator-engine.tokens';
import type { ComputationMetadata } from '../../common/computation-metadata.util';
import type { LevelType, RawFibonacciLevel } from './fibonacci-analysis.types';

/** Disclosed calibration (S1-017 Sprint Brief, Missing Decisions): the bounded swing-window count this Provider scans, forming up to `MAX_SWINGS_FOR_LEGS - 1` consecutive legs. */
export const MAX_SWINGS_FOR_LEGS = 4;

export interface FibonacciLevelGenerationResult {
  readonly levels: readonly RawFibonacciLevel[];
  readonly legMetadata: readonly ComputationMetadata[];
}

/**
 * A bounded scan across the last `MAX_SWINGS_FOR_LEGS` swings (S1-017
 * Sprint Brief, Scope item 2) -- never an unbounded historical scan.
 * Each consecutive swing pair is one leg; `INDICATOR_ENGINE.fibonacciLevels()`
 * (S1-007) is called once per leg with that leg's own two swing prices as
 * anchors. Only the true retracement ratios (`0.236`/`0.382`/`0.5`/
 * `0.618`/`0.786`) and extension ratios (`1.272`/`1.618`) are kept -- the
 * raw anchor ratios (`0`/`1`) are excluded, since they are not
 * independent Fibonacci levels at all, only the leg's own endpoints.
 */
export function generateFibonacciLevels(swingResult: SwingDetectionResult, indicatorEngine: IndicatorEngine): FibonacciLevelGenerationResult {
  const swings = swingResult.swings.slice(-MAX_SWINGS_FOR_LEGS);
  const levels: RawFibonacciLevel[] = [];
  const legMetadata: ComputationMetadata[] = [];

  for (let legIndex = 0; legIndex < swings.length - 1; legIndex++) {
    const anchorStart = swings[legIndex].price;
    const anchorEnd = swings[legIndex + 1].price;
    const { levels: rawLevels, metadata } = indicatorEngine.fibonacciLevels({ anchorStart, anchorEnd });
    legMetadata.push(metadata);

    for (const rawLevel of rawLevels) {
      if (rawLevel.ratio === 0 || rawLevel.ratio === 1) continue;
      const type: LevelType = rawLevel.ratio < 1 ? 'RETRACEMENT' : 'EXTENSION';
      levels.push({ legIndex, ratio: rawLevel.ratio, price: rawLevel.price, type, isTrueFibonacciRatio: rawLevel.isTrueFibonacciRatio });
    }
  }

  return { levels, legMetadata };
}
