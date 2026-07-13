import type { WyckoffEventType, WyckoffPhase, WyckoffPhaseHypothesis, WyckoffSideEvents } from './wyckoff.types';

/**
 * Maximum number of alternate phase-hypotheses tracked — a disclosed,
 * named constant (S1-009 Sprint Brief, Missing Decisions; Known
 * Limitations: "the maximum number of alternate hypotheses tracked is a
 * Decision Log item still requiring calibration; unbounded search is
 * not authorized"). This classifier never returns more than this many.
 */
export const MAX_PHASE_HYPOTHESES = 2;

/**
 * Maps a detected Wyckoff Schematic #1 event sequence to Phase A-E
 * candidate reading(s), per the modern Wyckoff Method curriculum's
 * standard schematic (Wyckoff Associates / Stock Market Institute
 * course materials, as popularized by Hank Pruden and others) —
 * **distinct from Wyckoff's own original Three Laws**, which this
 * function does not itself embody (S1-009 Sprint Brief, Scope item 5).
 *
 * Returns more than one ranked candidate exactly where the schematic is
 * genuinely ambiguous — right at the Phase A/B transition (after AR,
 * before ST) and right at the Phase B/C transition (a Spring/Upthrust
 * detected but not yet confirmed by a Test) — never a single forced
 * guess at those points. Returns exactly one candidate everywhere else,
 * including once the schematic is unambiguously complete.
 */
export function classifyWyckoffPhase(sideEvents: WyckoffSideEvents): WyckoffPhaseHypothesis[] {
  const { side, events } = sideEvents;
  const lastEvent = events[events.length - 1];
  if (!lastEvent) {
    return [];
  }

  const supportingEvents: readonly WyckoffEventType[] = events.map((event) => event.type);

  const hypothesis = (phase: WyckoffPhase, score: number, summary: string): WyckoffPhaseHypothesis => ({
    phase,
    side,
    score,
    supportingEvents,
    summary,
  });

  switch (lastEvent.type) {
    case 'PS':
    case 'PSY':
      return [hypothesis('A', 40, 'Preliminary Support/Supply detected; range not yet confirmed.')];

    case 'SC':
    case 'BC':
      return [hypothesis('A', 60, 'Climactic event (Selling/Buying Climax) confirms Phase A is underway.')];

    case 'AR':
      // Genuinely ambiguous: the Automatic Rally/Reaction both completes
      // Phase A and is the first evidence Phase B (range-testing) may
      // already be starting.
      return [
        hypothesis('A', 50, 'Automatic Rally/Reaction just completed; still plausibly the close of Phase A.'),
        hypothesis('B', 50, 'Automatic Rally/Reaction establishes the range; Phase B testing may already be underway.'),
      ];

    case 'ST':
      return [hypothesis('B', 65, 'Secondary Test confirms Phase B range-testing.')];

    case 'SPRING':
    case 'UT_UTAD':
      // Genuinely ambiguous: an undercut/overshoot is not yet
      // confirmable as a genuine shakeout (Phase C) until a Test
      // follows — it could still be a range failure (S1-009 Sprint
      // Brief, "Premature confidence risk").
      return [
        hypothesis('B', 40, 'Undercut/overshoot not yet confirmed by a Test; could still be a range failure rather than a shakeout.'),
        hypothesis('C', 55, 'Spring/Upthrust detected; Phase C shakeout in progress, not yet confirmed.'),
      ];

    case 'TEST':
      return [hypothesis('C', 75, 'Test confirms the Spring/Upthrust; Phase C complete.')];

    case 'SOS':
    case 'SOW':
      return [hypothesis('D', 80, 'Sign of Strength/Weakness confirms markup/markdown is underway (Phase D).')];

    case 'LPS':
    case 'LPSY':
      return [hypothesis('D', 85, 'Last Point of Support/Supply confirms Phase D, with continuation into Phase E expected.')];
  }
}
