import { Prisma } from '@zenith/database';
import type { MarketSeriesPoint } from '../../market-series/market-series.types';
import type { Freshness, MitigationStatus, RawZoneCandidate } from './supply-demand.types';

export interface ZoneHealth {
  readonly freshness: Freshness;
  readonly mitigation: MitigationStatus;
}

/**
 * Freshness and mitigation, tracked as two independent dimensions (S1-016
 * Sprint Brief, Scope item 5) — never conflated into one combined state.
 * A touch episode is one or more consecutive subsequent points touching
 * the zone's own `[proximal, distal]` range; any non-touching point ends
 * the current episode, so a single deep excursion across several bars
 * never inflates the touch count. Mitigation only ever worsens
 * (`UNMITIGATED` → `PARTIALLY_MITIGATED` → `FULLY_MITIGATED`), never
 * reverts, once a subsequent close has cleared the distal line.
 */
export function assessZoneHealth(candidate: RawZoneCandidate, subsequentPoints: readonly MarketSeriesPoint[]): ZoneHealth {
  const zoneLow = Prisma.Decimal.min(candidate.boundaries.proximal, candidate.boundaries.distal);
  const zoneHigh = Prisma.Decimal.max(candidate.boundaries.proximal, candidate.boundaries.distal);

  let episodeCount = 0;
  let inEpisode = false;
  let mitigation: MitigationStatus = 'UNMITIGATED';

  for (const point of subsequentPoints) {
    const touches = point.low.lessThanOrEqualTo(zoneHigh) && point.high.greaterThanOrEqualTo(zoneLow);
    if (!touches) {
      inEpisode = false;
      continue;
    }
    if (!inEpisode) {
      episodeCount += 1;
      inEpisode = true;
    }

    const closesBeyondDistal = candidate.type === 'DEMAND' ? point.close.lessThan(candidate.boundaries.distal) : point.close.greaterThan(candidate.boundaries.distal);
    if (closesBeyondDistal) {
      mitigation = 'FULLY_MITIGATED';
    } else if (mitigation === 'UNMITIGATED') {
      mitigation = 'PARTIALLY_MITIGATED';
    }
  }

  const freshness: Freshness = episodeCount === 0 ? 'FRESH' : episodeCount === 1 ? 'TESTED_ONCE' : 'TESTED_MULTIPLE';
  return { freshness, mitigation };
}
