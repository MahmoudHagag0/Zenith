import type { Swing, SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { ImpulseWaveLeg, WaveDirection } from './elliott-wave.types';

/** Five legs need six swings (start + 5 endpoints). Not a Missing Decision -- a structural fact of a 5-wave motive count. */
const SWINGS_PER_CANDIDATE = 6;

/** A 5-wave candidate before Rule validation (WP3) -- shape only, not yet known to survive. */
export interface RawWaveCandidate {
  readonly direction: WaveDirection;
  readonly legs: readonly ImpulseWaveLeg[];
}

function legsFromSwings(swings: readonly Swing[]): ImpulseWaveLeg[] {
  const legs: ImpulseWaveLeg[] = [];
  for (let i = 0; i < swings.length - 1; i++) {
    const start = swings[i];
    const end = swings[i + 1];
    legs.push({
      waveNumber: (i + 1) as 1 | 2 | 3 | 4 | 5,
      startTimestamp: start.timestamp,
      startPrice: start.price,
      endTimestamp: end.timestamp,
      endPrice: end.price,
    });
  }
  return legs;
}

/**
 * Generates candidate 5-wave motive (impulse) counts via a **linear scan
 * over consecutive swing windows** — never a combinatorial subset search
 * (S1-011 Sprint Brief, Scope items 2-3; Risks, "Combinatorial-search
 * risk"). For each starting offset in the Swing Detector's already-
 * computed `swings` (S1-007, no re-derivation), examines the six
 * consecutive swings there and builds one candidate only if they alternate
 * type correctly for a bullish (`LOW,HIGH,LOW,HIGH,LOW,HIGH`) or bearish
 * (`HIGH,LOW,HIGH,LOW,HIGH,LOW`) impulse. Rule validation (Elliott's Three
 * Rules) happens separately, in `elliott-wave-rules.util.ts` — this
 * function only assembles shape-correct raw candidates.
 */
export function generateWaveCountCandidates(swingResult: SwingDetectionResult): RawWaveCandidate[] {
  const { swings } = swingResult;
  const candidates: RawWaveCandidate[] = [];

  for (let i = 0; i + SWINGS_PER_CANDIDATE <= swings.length; i++) {
    const window = swings.slice(i, i + SWINGS_PER_CANDIDATE);
    const typeSequence = window.map((candidate) => candidate.type).join(',');

    if (typeSequence === 'LOW,HIGH,LOW,HIGH,LOW,HIGH') {
      candidates.push({ direction: 'BULLISH', legs: legsFromSwings(window) });
    } else if (typeSequence === 'HIGH,LOW,HIGH,LOW,HIGH,LOW') {
      candidates.push({ direction: 'BEARISH', legs: legsFromSwings(window) });
    }
  }

  return candidates;
}
