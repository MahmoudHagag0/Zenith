import type { Swing, SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { PatternPoint, RawChartPatternCandidate } from './classical-chart-patterns.types';

const HEAD_AND_SHOULDERS_LABELS = ['LEFT_SHOULDER', 'LEFT_TROUGH', 'HEAD', 'RIGHT_TROUGH', 'RIGHT_SHOULDER'] as const;
const INVERSE_HEAD_AND_SHOULDERS_LABELS = ['LEFT_SHOULDER', 'LEFT_PEAK', 'HEAD', 'RIGHT_PEAK', 'RIGHT_SHOULDER'] as const;
const DOUBLE_TOP_LABELS = ['PEAK_1', 'TROUGH', 'PEAK_2'] as const;
const DOUBLE_BOTTOM_LABELS = ['TROUGH_1', 'PEAK', 'TROUGH_2'] as const;

function pointsFromSwings(swings: readonly Swing[], labels: readonly string[]): PatternPoint[] {
  return swings.map((swing, i) => ({ label: labels[i], timestamp: swing.timestamp, price: swing.price }));
}

/**
 * Generates candidate chart pattern shapes via **two independent linear
 * scans over consecutive swing windows** — never a combinatorial subset
 * search (S1-014 Sprint Brief, Scope item 3; Risks, "Combinatorial-search
 * risk"). A 5-swing window checked for a Head and Shoulders (Top or
 * Inverse) shape, and a 3-swing window checked for a Double Top/Bottom
 * shape, both over the Swing Detector's already-computed `swings` (S1-007,
 * no re-derivation). Hard-criterion shape validation (Head dominance,
 * symmetry, neckline levelness) happens separately, in
 * `classical-chart-patterns-shape-criteria.util.ts` — this function only
 * assembles alternation-correct raw candidates.
 */
export function generateChartPatternCandidates(swingResult: SwingDetectionResult): RawChartPatternCandidate[] {
  const { swings } = swingResult;
  const candidates: RawChartPatternCandidate[] = [];

  for (let i = 0; i + 5 <= swings.length; i++) {
    const window = swings.slice(i, i + 5);
    const typeSequence = window.map((swing) => swing.type).join(',');

    if (typeSequence === 'HIGH,LOW,HIGH,LOW,HIGH') {
      candidates.push({ patternType: 'HEAD_AND_SHOULDERS', direction: 'BEARISH', points: pointsFromSwings(window, HEAD_AND_SHOULDERS_LABELS) });
    } else if (typeSequence === 'LOW,HIGH,LOW,HIGH,LOW') {
      candidates.push({ patternType: 'INVERSE_HEAD_AND_SHOULDERS', direction: 'BULLISH', points: pointsFromSwings(window, INVERSE_HEAD_AND_SHOULDERS_LABELS) });
    }
  }

  for (let i = 0; i + 3 <= swings.length; i++) {
    const window = swings.slice(i, i + 3);
    const typeSequence = window.map((swing) => swing.type).join(',');

    if (typeSequence === 'HIGH,LOW,HIGH') {
      candidates.push({ patternType: 'DOUBLE_TOP', direction: 'BEARISH', points: pointsFromSwings(window, DOUBLE_TOP_LABELS) });
    } else if (typeSequence === 'LOW,HIGH,LOW') {
      candidates.push({ patternType: 'DOUBLE_BOTTOM', direction: 'BULLISH', points: pointsFromSwings(window, DOUBLE_BOTTOM_LABELS) });
    }
  }

  return candidates;
}
