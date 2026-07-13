import { Prisma } from '@zenith/database';
import type { MarketSeries, MarketSeriesPoint } from '../../market-series/market-series.types';
import type { ChartPatternCandidate } from './classical-chart-patterns.types';

/** How much a confirming close's own volume must exceed the pattern's formation-period average volume to be disclosed as volume-confirmed (S1-014 Sprint Brief, Missing Decisions) -- Edwards & Magee's own emphasis on volume expanding on a genuine breakout. */
const VOLUME_EXPANSION_MARGIN_RATIO = 0.2;

/** Interpretation Confidence base values per confirmation state (S1-014 Sprint Brief, Missing Decisions) -- an unconfirmed ("still forming") reading is genuine but weaker, per this methodology's own literature; never discarded. */
const UNCONFIRMED_SCORE = 35;
const CONFIRMED_SCORE = 65;
const VOLUME_CONFIRMED_SCORE = 90;

function findSeriesPointAt(series: MarketSeries, timestamp: Date): MarketSeriesPoint | undefined {
  return series.points.find((p) => p.timestamp.getTime() === timestamp.getTime());
}

function buildInvalidationLevel(candidate: ChartPatternCandidate): Prisma.Decimal {
  const prices = candidate.points.map((p) => p.price);
  return candidate.direction === 'BEARISH' ? Prisma.Decimal.max(...prices) : Prisma.Decimal.min(...prices);
}

/**
 * Scans the `MarketSeries` points timestamped after this candidate's own
 * last point for a `close` breaking the candidate's neckline in its own
 * anticipated direction (S1-014 Sprint Brief, Scope item 5) — the
 * genuinely distinct, temporal soft signal this methodology's own
 * primary source treats as decisive for reliability, contributing to
 * Interpretation Confidence only, never revisiting shape survival
 * (already decided in `classical-chart-patterns-shape-criteria.util.ts`).
 * An unconfirmed ("still forming") candidate is not discarded — it is
 * disclosed as a genuine, lower-confidence hypothesis. Also computes the
 * disclosed, forward-looking `PatternInvalidation` (S1-014 Sprint Brief,
 * Scope item 8): a subsequent close beyond this pattern's own most
 * extreme point (the Head, for Head and Shoulders; the higher/lower Peak/
 * Trough, for Double Top/Bottom) would contradict this reading entirely.
 */
export function scoreConfirmation(candidate: ChartPatternCandidate, series: MarketSeries): ChartPatternCandidate {
  const lastPoint = candidate.points[candidate.points.length - 1];
  const subsequentPoints = series.points.filter((p) => p.timestamp.getTime() > lastPoint.timestamp.getTime());
  const isBearish = candidate.direction === 'BEARISH';

  const confirmingPoint = subsequentPoints.find((p) => (isBearish ? p.close.lessThan(candidate.necklineLevel) : p.close.greaterThan(candidate.necklineLevel)));

  const invalidationLevel = buildInvalidationLevel(candidate);
  const invalidationDirection = isBearish ? 'above' : 'below';
  const invalidation = {
    level: invalidationLevel,
    description: `A subsequent close ${invalidationDirection} ${invalidationLevel.toFixed(2)} (this pattern's own most extreme point) would invalidate this reading.`,
  };

  if (!confirmingPoint) {
    return { ...candidate, confirmationStatus: 'UNCONFIRMED', interpretationScore: UNCONFIRMED_SCORE, invalidation };
  }

  const formationPoints = candidate.points.map((p) => findSeriesPointAt(series, p.timestamp)).filter((p): p is MarketSeriesPoint => p !== undefined);
  const formationAverageVolume =
    formationPoints.length > 0 ? formationPoints.reduce((sum, p) => sum.plus(p.volume), new Prisma.Decimal(0)).dividedBy(formationPoints.length) : new Prisma.Decimal(0);
  const isVolumeConfirmed = formationAverageVolume.greaterThan(0) && confirmingPoint.volume.greaterThan(formationAverageVolume.times(1 + VOLUME_EXPANSION_MARGIN_RATIO));

  return {
    ...candidate,
    confirmationStatus: isVolumeConfirmed ? 'VOLUME_CONFIRMED' : 'CONFIRMED',
    interpretationScore: isVolumeConfirmed ? VOLUME_CONFIRMED_SCORE : CONFIRMED_SCORE,
    invalidation,
  };
}
