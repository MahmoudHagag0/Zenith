import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import type { DisplacementLeg } from './ict-smc.types';

/**
 * Derives one `DisplacementLeg` per `BOS` structure event the Swing
 * Detector reports (S1-007) — the impulse leg producing that break
 * (S1-010 Sprint Brief, Scope item 2; Implementation Guidance #1). The
 * leg's start is the most recent swing of the opposite type before the
 * breaking swing (the last pullback low before a bullish break, or the
 * last pullback high before a bearish break) — the launch point of the
 * impulse.
 *
 * Deliberately confined to `BOS` only, not `CHoCH`: a CHoCH marks a trend
 * *reversal* against the prior trend's own swing sequence, so there is no
 * preceding same-trend swing of the opposite type to anchor a Displacement
 * Leg's start against — a CHoCH's own swing is itself the reversal point,
 * not the confirmation of an already-established directional impulse the
 * way a BOS is.
 *
 * Composed entirely from the generic `StructureEvent`/`Swing` shapes
 * (S1-007) — no other Provider's internal concept referenced, and no
 * re-derivation of structure-break logic (Architecture Requirements).
 */
export function deriveDisplacementLegs(points: readonly MarketSeriesPoint[], swingResult: SwingDetectionResult): DisplacementLeg[] {
  const legs: DisplacementLeg[] = [];

  for (const event of swingResult.structureEvents) {
    if (event.type !== 'BOS') continue;

    const oppositeType = event.direction === 'BULLISH' ? 'LOW' : 'HIGH';
    const priorOppositeSwings = swingResult.swings
      .filter((candidate) => candidate.type === oppositeType && candidate.timestamp.getTime() < event.swing.timestamp.getTime())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const launchSwing = priorOppositeSwings[0];
    if (!launchSwing) continue;

    const startIndex = points.findIndex((point) => point.timestamp.getTime() === launchSwing.timestamp.getTime());
    const endIndex = points.findIndex((point) => point.timestamp.getTime() === event.swing.timestamp.getTime());
    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) continue;

    legs.push({
      direction: event.direction,
      structureEventTimestamp: event.swing.timestamp,
      startTimestamp: launchSwing.timestamp,
      startIndex,
      endIndex,
    });
  }

  return legs;
}
