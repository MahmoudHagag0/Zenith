import { Prisma } from '@zenith/database';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { BarDirection, ClassifiedBar, ClosePosition, SpreadClassification, VolumeClassification } from './vsa.types';

/**
 * Disclosed calibration (S1-018 Sprint Brief, Missing Decisions): a
 * bar's own spread (high-low), relative to ATR, at or below which it
 * reads as `NARROW`, at or above which it reads as `WIDE`; between the
 * two it reads as `AVERAGE`.
 */
export const NARROW_SPREAD_ATR_MULTIPLE = 0.5;
export const WIDE_SPREAD_ATR_MULTIPLE = 1.5;

/**
 * Disclosed calibration (S1-018 Sprint Brief, Missing Decisions): a
 * bar's own volume, relative to the trailing average volume of the
 * preceding bars in the lookback window, at or below which it reads as
 * `LOW`, at or above which it reads as `HIGH`/`ULTRA_HIGH`.
 */
export const LOW_VOLUME_RATIO = 0.7;
export const HIGH_VOLUME_RATIO = 1.5;
export const ULTRA_HIGH_VOLUME_RATIO = 2.5;

/** Disclosed calibration (S1-018 Sprint Brief, Missing Decisions): close-position-within-spread thresholds. */
export const NEAR_HIGH_CLOSE_POSITION = 0.7;
export const NEAR_LOW_CLOSE_POSITION = 0.3;

function classifySpread(spreadAtrRatio: number): SpreadClassification {
  if (spreadAtrRatio <= NARROW_SPREAD_ATR_MULTIPLE) return 'NARROW';
  if (spreadAtrRatio >= WIDE_SPREAD_ATR_MULTIPLE) return 'WIDE';
  return 'AVERAGE';
}

function classifyVolume(volumeRatio: number): VolumeClassification {
  if (volumeRatio >= ULTRA_HIGH_VOLUME_RATIO) return 'ULTRA_HIGH';
  if (volumeRatio >= HIGH_VOLUME_RATIO) return 'HIGH';
  if (volumeRatio <= LOW_VOLUME_RATIO) return 'LOW';
  return 'AVERAGE';
}

function classifyClosePosition(closePositionRatio: number): ClosePosition {
  if (closePositionRatio >= NEAR_HIGH_CLOSE_POSITION) return 'NEAR_HIGH';
  if (closePositionRatio <= NEAR_LOW_CLOSE_POSITION) return 'NEAR_LOW';
  return 'MID';
}

function directionOf(point: MarketSeriesPoint): BarDirection {
  return point.close.greaterThanOrEqualTo(point.open) ? 'UP' : 'DOWN';
}

/**
 * Classifies a single bar's own spread (relative to ATR), volume
 * (relative to a trailing average computed strictly from
 * `precedingPoints` -- never the bar itself, avoiding look-ahead), close
 * position within its own spread, and direction (S1-018 Sprint Brief,
 * Scope item 2) -- the entire raw Evidence vocabulary this Provider's
 * signal detection is built from.
 */
export function classifyBar(point: MarketSeriesPoint, index: number, precedingPoints: readonly MarketSeriesPoint[], atr: Prisma.Decimal): ClassifiedBar {
  const range = point.high.minus(point.low);
  const spreadAtrRatio = atr.isZero() ? 0 : range.dividedBy(atr).toNumber();

  const trailingAverageVolume = precedingPoints.reduce((sum, p) => sum.plus(p.volume), new Prisma.Decimal(0)).dividedBy(precedingPoints.length || 1);
  const volumeRatio = trailingAverageVolume.isZero() ? 0 : point.volume.dividedBy(trailingAverageVolume).toNumber();

  const closePositionRatio = range.isZero() ? 0.5 : point.close.minus(point.low).dividedBy(range).toNumber();

  return {
    point,
    index,
    atr,
    spread: classifySpread(spreadAtrRatio),
    spreadAtrRatio,
    volume: classifyVolume(volumeRatio),
    volumeRatio,
    closePosition: classifyClosePosition(closePositionRatio),
    closePositionRatio,
    direction: directionOf(point),
  };
}
