import type { Prisma } from '@zenith/database';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { SwingDetectionResult } from '../../swing-detection/swing-detection.types';
import { averageVolumeBefore, findVolumeAt, isNear } from './wyckoff-event-detection.util';
import type { WyckoffEvent, WyckoffRange, WyckoffSideEvents } from './wyckoff.types';

/**
 * Disclosed, named calibration constants (S1-009 Sprint Brief, Missing
 * Decisions) — never silent magic numbers.
 */
const TRAILING_VOLUME_WINDOW = 5;
/** A Selling Climax's volume must be at least this multiple of the trailing average. */
const CLIMAX_VOLUME_MULTIPLIER = 2;

/**
 * Detects the Accumulation half of Wyckoff Schematic #1 — PS, SC, AR,
 * ST, Spring, Test, SOS, LPS — as a deterministic, chronologically
 * sequential scan over the Swing Detector's already-verified swings
 * (S1-007), using per-bar volume (via `points`) **only** for the
 * Selling Climax's volume-spike criterion (S1-009 Sprint Brief, Scope
 * item 4's disclosed volume boundary — never for bar-by-bar effort/
 * result scoring, which is VSA's job).
 *
 * `nearTolerance` is an absolute, ATR-derived tolerance (via
 * `INDICATOR_ENGINE`, S1-007) the Provider computes and supplies — how
 * close a Secondary Test must land to the Selling Climax's price scales
 * with the instrument's own actual volatility, rather than a fixed,
 * arbitrary percentage.
 *
 * Returns whatever prefix of the schematic is actually found — a
 * partial result (e.g. only PS/SC/AR) is not an error, it is an honest,
 * still-forming reading; the Provider's Confidence layer (WP6), not
 * this function, is responsible for expressing how far the schematic
 * has progressed.
 */
export function detectAccumulationEvents(
  points: readonly MarketSeriesPoint[],
  swingResult: SwingDetectionResult,
  range: WyckoffRange,
  nearTolerance: Prisma.Decimal,
): WyckoffSideEvents {
  const events: WyckoffEvent[] = [];
  const lows = swingResult.swings.filter((swing) => swing.type === 'LOW');
  const highs = swingResult.swings.filter((swing) => swing.type === 'HIGH');

  if (lows.length < 2) {
    return { side: 'ACCUMULATION', events };
  }

  // PS — Preliminary Support: the earliest swing low.
  const psSwing = lows[0];
  events.push({
    type: 'PS',
    timestamp: psSwing.timestamp,
    price: psSwing.price,
    description: `Preliminary Support: first swing low at ${psSwing.price.toFixed(2)}, first evidence of buying interest.`,
  });

  // SC — Selling Climax: the next swing low, only if it shows a genuine volume spike.
  const scSwing = lows[1];
  const scVolume = findVolumeAt(points, scSwing.timestamp);
  const scBaseline = averageVolumeBefore(points, scSwing.timestamp, TRAILING_VOLUME_WINDOW);
  const isClimactic = scBaseline.greaterThan(0) && scVolume.greaterThanOrEqualTo(scBaseline.times(CLIMAX_VOLUME_MULTIPLIER));
  if (!isClimactic) {
    return { side: 'ACCUMULATION', events };
  }
  events.push({
    type: 'SC',
    timestamp: scSwing.timestamp,
    price: scSwing.price,
    description: `Selling Climax: swing low at ${scSwing.price.toFixed(2)} on ${scBaseline.greaterThan(0) ? scVolume.dividedBy(scBaseline).toFixed(1) : 'n/a'}x trailing volume.`,
  });

  // AR — Automatic Rally: the first swing high after SC.
  const arSwing = highs.find((high) => high.timestamp.getTime() > scSwing.timestamp.getTime());
  if (!arSwing) {
    return { side: 'ACCUMULATION', events };
  }
  events.push({ type: 'AR', timestamp: arSwing.timestamp, price: arSwing.price, description: `Automatic Rally: swing high at ${arSwing.price.toFixed(2)}.` });

  // ST — Secondary Test: a swing low after AR, near SC's price, on lower volume than SC.
  const stSwing = lows.find(
    (low) =>
      low.timestamp.getTime() > arSwing.timestamp.getTime() &&
      isNear(low.price, scSwing.price, nearTolerance) &&
      findVolumeAt(points, low.timestamp).lessThan(scVolume),
  );
  if (stSwing) {
    events.push({
      type: 'ST',
      timestamp: stSwing.timestamp,
      price: stSwing.price,
      description: `Secondary Test: swing low at ${stSwing.price.toFixed(2)}, retesting the Selling Climax on lower volume.`,
    });
  }

  // Spring — a swing low, after ST (or AR if no ST), undercutting range support.
  const afterPhaseA = (stSwing ?? arSwing).timestamp;
  const springSwing = lows.find((low) => low.timestamp.getTime() > afterPhaseA.getTime() && low.price.lessThan(range.support));
  if (!springSwing) {
    return { side: 'ACCUMULATION', events };
  }
  events.push({
    type: 'SPRING',
    timestamp: springSwing.timestamp,
    price: springSwing.price,
    description: `Spring: shakeout below support (${range.support.toFixed(2)}) to ${springSwing.price.toFixed(2)}.`,
  });

  // Test (of the Spring) — a swing low after Spring, higher than the Spring's low, on lower volume.
  const springVolume = findVolumeAt(points, springSwing.timestamp);
  const testSwing = lows.find(
    (low) =>
      low.timestamp.getTime() > springSwing.timestamp.getTime() &&
      low.price.greaterThan(springSwing.price) &&
      findVolumeAt(points, low.timestamp).lessThan(springVolume),
  );
  if (testSwing) {
    events.push({
      type: 'TEST',
      timestamp: testSwing.timestamp,
      price: testSwing.price,
      description: `Test of the Spring: higher low at ${testSwing.price.toFixed(2)} on lower volume, confirming support holds.`,
    });
  }

  // SOS — Sign of Strength: a swing high after Spring/Test, breaking above range resistance.
  const afterPhaseC = (testSwing ?? springSwing).timestamp;
  const sosSwing = highs.find((high) => high.timestamp.getTime() > afterPhaseC.getTime() && high.price.greaterThan(range.resistance));
  if (!sosSwing) {
    return { side: 'ACCUMULATION', events };
  }
  events.push({
    type: 'SOS',
    timestamp: sosSwing.timestamp,
    price: sosSwing.price,
    description: `Sign of Strength: swing high at ${sosSwing.price.toFixed(2)}, breaking above resistance (${range.resistance.toFixed(2)}).`,
  });

  // LPS — Last Point of Support: a swing low after SOS, holding above range support.
  const lpsSwing = lows.find((low) => low.timestamp.getTime() > sosSwing.timestamp.getTime() && low.price.greaterThan(range.support));
  if (lpsSwing) {
    events.push({
      type: 'LPS',
      timestamp: lpsSwing.timestamp,
      price: lpsSwing.price,
      description: `Last Point of Support: higher low at ${lpsSwing.price.toFixed(2)}, holding above support.`,
    });
  }

  return { side: 'ACCUMULATION', events };
}
