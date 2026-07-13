import type { Prisma } from '@zenith/database';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import { averageVolumeBefore, findVolumeAt, isNear } from './wyckoff-event-detection.util';
import type { WyckoffEvent, WyckoffRange, WyckoffSideEvents } from './wyckoff.types';

/**
 * Disclosed, named calibration constants (S1-009 Sprint Brief, Missing
 * Decisions) — mirrors `wyckoff-accumulation.detector.ts`'s constants
 * exactly, since Distribution is Accumulation's mirror-image schematic.
 */
const TRAILING_VOLUME_WINDOW = 5;
/** A Buying Climax's volume must be at least this multiple of the trailing average. */
const CLIMAX_VOLUME_MULTIPLIER = 2;

/**
 * Detects the Distribution half of Wyckoff Schematic #1 — PSY, BC, AR,
 * ST, UT/UTAD, Test, SOW, LPSY — the mirror image of
 * `detectAccumulationEvents` (swing highs/lows and support/resistance
 * swapped throughout). Per-bar volume is used only for BC's climax
 * criterion, the same disclosed boundary as Accumulation's SC.
 *
 * `nearTolerance` is an absolute, ATR-derived tolerance (see
 * `detectAccumulationEvents`'s doc comment) — how close a Secondary Test
 * must land to the Buying Climax's price.
 *
 * Returns whatever prefix of the schematic is actually found — a
 * partial result is an honest, still-forming reading, not an error.
 */
export function detectDistributionEvents(
  points: readonly MarketSeriesPoint[],
  swingResult: SwingDetectionResult,
  range: WyckoffRange,
  nearTolerance: Prisma.Decimal,
): WyckoffSideEvents {
  const events: WyckoffEvent[] = [];
  const lows = swingResult.swings.filter((swing) => swing.type === 'LOW');
  const highs = swingResult.swings.filter((swing) => swing.type === 'HIGH');

  if (highs.length < 2) {
    return { side: 'DISTRIBUTION', events };
  }

  // PSY — Preliminary Supply: the earliest swing high.
  const psySwing = highs[0];
  events.push({
    type: 'PSY',
    timestamp: psySwing.timestamp,
    price: psySwing.price,
    description: `Preliminary Supply: first swing high at ${psySwing.price.toFixed(2)}, first evidence of selling interest.`,
  });

  // BC — Buying Climax: the next swing high, only if it shows a genuine volume spike.
  const bcSwing = highs[1];
  const bcVolume = findVolumeAt(points, bcSwing.timestamp);
  const bcBaseline = averageVolumeBefore(points, bcSwing.timestamp, TRAILING_VOLUME_WINDOW);
  const isClimactic = bcBaseline.greaterThan(0) && bcVolume.greaterThanOrEqualTo(bcBaseline.times(CLIMAX_VOLUME_MULTIPLIER));
  if (!isClimactic) {
    return { side: 'DISTRIBUTION', events };
  }
  events.push({
    type: 'BC',
    timestamp: bcSwing.timestamp,
    price: bcSwing.price,
    description: `Buying Climax: swing high at ${bcSwing.price.toFixed(2)} on ${bcBaseline.greaterThan(0) ? bcVolume.dividedBy(bcBaseline).toFixed(1) : 'n/a'}x trailing volume.`,
  });

  // AR — Automatic Reaction: the first swing low after BC.
  const arSwing = lows.find((low) => low.timestamp.getTime() > bcSwing.timestamp.getTime());
  if (!arSwing) {
    return { side: 'DISTRIBUTION', events };
  }
  events.push({ type: 'AR', timestamp: arSwing.timestamp, price: arSwing.price, description: `Automatic Reaction: swing low at ${arSwing.price.toFixed(2)}.` });

  // ST — Secondary Test: a swing high after AR, near BC's price, on lower volume than BC.
  const stSwing = highs.find(
    (high) =>
      high.timestamp.getTime() > arSwing.timestamp.getTime() &&
      isNear(high.price, bcSwing.price, nearTolerance) &&
      findVolumeAt(points, high.timestamp).lessThan(bcVolume),
  );
  if (stSwing) {
    events.push({
      type: 'ST',
      timestamp: stSwing.timestamp,
      price: stSwing.price,
      description: `Secondary Test: swing high at ${stSwing.price.toFixed(2)}, retesting the Buying Climax on lower volume.`,
    });
  }

  // UT/UTAD — a swing high, after ST (or AR if no ST), overshooting range resistance.
  const afterPhaseA = (stSwing ?? arSwing).timestamp;
  const utSwing = highs.find((high) => high.timestamp.getTime() > afterPhaseA.getTime() && high.price.greaterThan(range.resistance));
  if (!utSwing) {
    return { side: 'DISTRIBUTION', events };
  }
  events.push({
    type: 'UT_UTAD',
    timestamp: utSwing.timestamp,
    price: utSwing.price,
    description: `Upthrust (After Distribution): overshoot above resistance (${range.resistance.toFixed(2)}) to ${utSwing.price.toFixed(2)}.`,
  });

  // Test (of the UT/UTAD) — a swing high after UT/UTAD, lower than its high, on lower volume.
  const utVolume = findVolumeAt(points, utSwing.timestamp);
  const testSwing = highs.find(
    (high) =>
      high.timestamp.getTime() > utSwing.timestamp.getTime() &&
      high.price.lessThan(utSwing.price) &&
      findVolumeAt(points, high.timestamp).lessThan(utVolume),
  );
  if (testSwing) {
    events.push({
      type: 'TEST',
      timestamp: testSwing.timestamp,
      price: testSwing.price,
      description: `Test of the Upthrust: lower high at ${testSwing.price.toFixed(2)} on lower volume, confirming resistance holds.`,
    });
  }

  // SOW — Sign of Weakness: a swing low after UT/Test, breaking below range support.
  const afterPhaseC = (testSwing ?? utSwing).timestamp;
  const sowSwing = lows.find((low) => low.timestamp.getTime() > afterPhaseC.getTime() && low.price.lessThan(range.support));
  if (!sowSwing) {
    return { side: 'DISTRIBUTION', events };
  }
  events.push({
    type: 'SOW',
    timestamp: sowSwing.timestamp,
    price: sowSwing.price,
    description: `Sign of Weakness: swing low at ${sowSwing.price.toFixed(2)}, breaking below support (${range.support.toFixed(2)}).`,
  });

  // LPSY — Last Point of Supply: a swing high after SOW, holding below range resistance.
  const lpsySwing = highs.find((high) => high.timestamp.getTime() > sowSwing.timestamp.getTime() && high.price.lessThan(range.resistance));
  if (lpsySwing) {
    events.push({
      type: 'LPSY',
      timestamp: lpsySwing.timestamp,
      price: lpsySwing.price,
      description: `Last Point of Supply: lower high at ${lpsySwing.price.toFixed(2)}, holding below resistance.`,
    });
  }

  return { side: 'DISTRIBUTION', events };
}
