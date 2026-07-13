import type { Swing, SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { PatternLeg, RawPatternCandidate } from './harmonic-patterns.types';

/** Four legs (XA, AB, BC, CD) need five swings (X, A, B, C, D). A structural fact of an XABCD harmonic pattern, not a Missing Decision. */
const SWINGS_PER_CANDIDATE = 5;

const LEG_LABELS = ['XA', 'AB', 'BC', 'CD'] as const;

function legsFromSwings(swings: readonly Swing[]): PatternLeg[] {
  const legs: PatternLeg[] = [];
  for (let i = 0; i < swings.length - 1; i++) {
    const start = swings[i];
    const end = swings[i + 1];
    legs.push({
      label: LEG_LABELS[i],
      startTimestamp: start.timestamp,
      startPrice: start.price,
      endTimestamp: end.timestamp,
      endPrice: end.price,
    });
  }
  return legs;
}

/**
 * Generates candidate 5-point (X, A, B, C, D) harmonic pattern structures
 * via a **linear scan over consecutive swing windows** — never a
 * combinatorial subset search (S1-013 Sprint Brief, Scope item 3; Risks,
 * "Combinatorial-search risk"). For each starting offset in the Swing
 * Detector's already-computed `swings` (S1-007, no re-derivation),
 * examines the five consecutive swings there and builds one candidate
 * only if they alternate type correctly for a bullish-completing
 * (`LOW,HIGH,LOW,HIGH,LOW` — D is a swing low, the point from which a
 * bullish reversal is anticipated) or bearish-completing
 * (`HIGH,LOW,HIGH,LOW,HIGH`) structure. Ratio/band matching happens
 * separately, in `harmonic-patterns-band-matching.util.ts` — this
 * function only assembles shape-correct raw candidates.
 */
export function generateHarmonicCandidates(swingResult: SwingDetectionResult): RawPatternCandidate[] {
  const { swings } = swingResult;
  const candidates: RawPatternCandidate[] = [];

  for (let i = 0; i + SWINGS_PER_CANDIDATE <= swings.length; i++) {
    const window = swings.slice(i, i + SWINGS_PER_CANDIDATE);
    const typeSequence = window.map((swing) => swing.type).join(',');

    if (typeSequence === 'LOW,HIGH,LOW,HIGH,LOW') {
      candidates.push({ direction: 'BULLISH', legs: legsFromSwings(window) });
    } else if (typeSequence === 'HIGH,LOW,HIGH,LOW,HIGH') {
      candidates.push({ direction: 'BEARISH', legs: legsFromSwings(window) });
    }
  }

  return candidates;
}
