import type { DimensionConfluence, DimensionContributor } from '../analysis-engine/confluence/confluence.types';
import type { NormalizedDimension } from '../analysis-engine/providers/normalized-vocabulary.types';
import type { NetDirection } from './dashboard.types';

/**
 * Net direction + Decision-Relevance ranking (S1-019 Sprint Brief, Scope
 * item 3; Missing Decision 3). This is a RANKING HEURISTIC ONLY -- the
 * returned `relevanceScore` is never a Confidence value, is never displayed
 * to a trader, and must never be compared against a `LabeledConfidence`
 * as if equivalent (Constitution §6.5, "never collapse the four-part
 * Confidence taxonomy"). It exists solely to order multiple qualifying
 * instruments within one Decision Center response.
 *
 * Method: each of the seven `NormalizedDimension` aggregates casts one vote
 * (BULLISH/BEARISH/neither) toward the instrument's own net direction --
 * never re-deriving a reading from raw signals, only reading the Confluence
 * Engine's own already-computed `aggregateReading` (no aggregation logic is
 * duplicated here, per the Sprint Brief's own "no business logic
 * duplication" requirement). A tie (including zero-zero, e.g. every
 * dimension NEUTRAL/NOT_APPLICABLE) is `NEUTRAL` -- no qualifying reading,
 * the Product-Rule-9-governed valid outcome, never forced to a direction.
 * Disagreement is always disclosed on the result; it never disqualifies an
 * instrument from being ranked, and it never resolves into a false
 * consensus (Constitution §3.2, §12.4).
 */
export interface NetDirectionResult {
  readonly netDirection: NetDirection;
  /** Ranking heuristic only -- see file-level doc comment. Always 0 when `netDirection` is `NEUTRAL`. */
  readonly relevanceScore: number;
  readonly agreeingDimensions: number;
  readonly disagreementDimensions: readonly NormalizedDimension[];
}

function topConfidence(contributors: readonly DimensionContributor[]): number {
  return contributors.length === 0 ? 0 : contributors[0].confidence;
}

export function deriveNetDirection(dimensions: readonly DimensionConfluence[]): NetDirectionResult {
  let bullishCount = 0;
  let bearishCount = 0;
  let bullishConfidenceSum = 0;
  let bearishConfidenceSum = 0;
  const disagreementDimensions: NormalizedDimension[] = [];

  for (const dimension of dimensions) {
    if (dimension.disagreement) {
      disagreementDimensions.push(dimension.dimension);
    }
    if (dimension.aggregateReading === 'BULLISH') {
      bullishCount += 1;
      bullishConfidenceSum += topConfidence(dimension.bullishContributors);
    } else if (dimension.aggregateReading === 'BEARISH') {
      bearishCount += 1;
      bearishConfidenceSum += topConfidence(dimension.bearishContributors);
    }
  }

  if (bullishCount === bearishCount) {
    return { netDirection: 'NEUTRAL', relevanceScore: 0, agreeingDimensions: 0, disagreementDimensions };
  }

  const netDirection: NetDirection = bullishCount > bearishCount ? 'BULLISH' : 'BEARISH';
  const agreeingDimensions = netDirection === 'BULLISH' ? bullishCount : bearishCount;
  const supportingConfidenceSum = netDirection === 'BULLISH' ? bullishConfidenceSum : bearishConfidenceSum;
  const averageSupportingConfidence = agreeingDimensions === 0 ? 0 : supportingConfidenceSum / agreeingDimensions;
  const netMagnitude = Math.abs(bullishCount - bearishCount);

  return {
    netDirection,
    relevanceScore: netMagnitude * averageSupportingConfidence,
    agreeingDimensions,
    disagreementDimensions,
  };
}
