import { Prisma } from '@zenith/database';
import type { SupplyDemandZone, ZoneInvalidation } from './supply-demand.types';

/** A quality/interpretation value below this is disclosed as a weakness, not silently omitted. */
const WEAKNESS_THRESHOLD = 40;

function distanceToPrice(zone: SupplyDemandZone, currentPrice: Prisma.Decimal): Prisma.Decimal {
  return zone.boundaries.proximal.minus(currentPrice).abs();
}

/**
 * Bounded at one hypothesis per side -- the nearest `DEMAND` zone below
 * current price and the nearest `SUPPLY` zone above it (S1-016 Sprint
 * Brief, Scope item 7) -- a genuinely different bounding rationale
 * (sidedness, not ranking ambiguity) from every prior Provider's own
 * bounded-hypothesis mechanism. Ordered nearest-to-price first.
 */
export function selectZoneHypotheses(zones: readonly SupplyDemandZone[], currentPrice: Prisma.Decimal): SupplyDemandZone[] {
  const nearestOf = (type: SupplyDemandZone['type']): SupplyDemandZone | null =>
    zones.filter((zone) => zone.type === type).reduce<SupplyDemandZone | null>((nearest, zone) => {
      if (!nearest) return zone;
      return distanceToPrice(zone, currentPrice).lessThan(distanceToPrice(nearest, currentPrice)) ? zone : nearest;
    }, null);

  const candidates = [nearestOf('DEMAND'), nearestOf('SUPPLY')].filter((zone): zone is SupplyDemandZone => zone !== null);
  return candidates.sort((a, b) => distanceToPrice(a, currentPrice).minus(distanceToPrice(b, currentPrice)).toNumber());
}

/** The disclosed, forward-looking condition that would fully mitigate this zone -- the same distal line this reading is itself built from, never a separately-estimated level. */
export function buildInvalidation(zone: Pick<SupplyDemandZone, 'type' | 'boundaries'>): ZoneInvalidation {
  return {
    level: zone.boundaries.distal,
    description: `A decisive close beyond ${zone.boundaries.distal.toFixed(2)} would invalidate this reading -- fully mitigating this ${zone.type} zone.`,
  };
}

export function buildSurvivalReasons(zone: SupplyDemandZone): string[] {
  const reasons = [zone.qualityScore.explanation, `Freshness reads ${zone.freshness}; mitigation reads ${zone.mitigation}.`];
  return reasons;
}

export function buildWeaknesses(zone: SupplyDemandZone): string[] {
  const weaknesses: string[] = [];
  if (zone.interpretationScore < WEAKNESS_THRESHOLD) {
    weaknesses.push(`This zone's own Interpretation score (${zone.interpretationScore.toFixed(0)}) is below the disclosed weakness threshold -- a low-conviction reading.`);
  }
  if (zone.mitigation === 'FULLY_MITIGATED') {
    weaknesses.push('This zone has already been fully mitigated -- a subsequent return to this level carries a materially higher probability of failing than holding.');
  } else if (zone.freshness === 'TESTED_MULTIPLE') {
    weaknesses.push('This zone has already been tested multiple times without being fully mitigated -- repeated tests draw down the original order size behind it.');
  }
  return weaknesses;
}
