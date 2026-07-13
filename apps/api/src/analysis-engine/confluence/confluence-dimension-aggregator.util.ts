import { groupByFamily } from './confluence-family-grouping.util';
import type { ConfluenceWeightStrategy, DimensionContribution, DimensionContributor, DimensionConfluence } from './confluence.types';
import type { NormalizedDimension } from '../providers/normalized-vocabulary.types';

/** Up to this many contributing Providers per side are listed (Finding C's own recommendation, `22_ANALYSIS_ENGINE_ARCHITECTURE.md`) -- bounded regardless of Provider count, preserving the O(Providers x 7) complexity bound. */
const MAX_CONTRIBUTORS_PER_SIDE = 3;

interface FamilyVote {
  readonly representativeProviderId: string;
  readonly methodologyFamily: string | undefined;
  readonly reading: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  readonly strength: number;
  readonly weight: number;
}

function combineFamily(members: readonly DimensionContribution[]): FamilyVote {
  const hasBullish = members.some((m) => m.reading === 'BULLISH');
  const hasBearish = members.some((m) => m.reading === 'BEARISH');
  // A family that disagrees with itself cannot confidently vote either way -- collapses to NEUTRAL for its own contribution, never silently picks a side.
  const reading: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = hasBullish && hasBearish ? 'NEUTRAL' : hasBullish ? 'BULLISH' : hasBearish ? 'BEARISH' : 'NEUTRAL';
  const relevant = reading === 'NEUTRAL' ? members : members.filter((m) => m.reading === reading);
  const strength = relevant.length > 0 ? relevant.reduce((sum, m) => sum + m.strength, 0) / relevant.length : 0;
  const representative = [...relevant].sort((a, b) => b.strength - a.strength)[0] ?? members[0];
  // groupByFamily guarantees every member of a group shares the same truthy methodologyFamily (or is a singleton with none) -- safe to read from any member.
  return { representativeProviderId: representative.providerId, methodologyFamily: representative.methodologyFamily, reading, strength, weight: 1 };
}

/**
 * Aggregates one dimension's contributions across participating
 * Providers (S1-012 Sprint Brief, Scope item 7; resolves Finding C,
 * `22_ANALYSIS_ENGINE_ARCHITECTURE.md`). Family-aware (Scope item 6):
 * Providers sharing a `methodologyFamily` are combined into one vote
 * before cross-family aggregation, so correlated Providers are never
 * counted as independent confirmation. **A single pass over the
 * participating Providers for this one dimension — `O(Providers)`, never
 * a nested Provider comparison** — called once per dimension by the
 * caller (`O(Providers x 7)` overall, never `O(Providers^2)`).
 */
export function aggregateDimension(dimension: NormalizedDimension, contributions: readonly DimensionContribution[], weightStrategy: ConfluenceWeightStrategy): DimensionConfluence {
  const applicable = contributions.filter((c) => c.reading !== 'NOT_APPLICABLE');

  if (applicable.length === 0) {
    return { dimension, aggregateReading: 'NOT_APPLICABLE', disagreement: false, bullishContributors: [], bearishContributors: [] };
  }

  const familyGroups = groupByFamily(applicable);
  const votes = familyGroups.map(combineFamily).map((vote) => ({ ...vote, weight: weightStrategy.computeWeight(vote.representativeProviderId, vote.methodologyFamily).weight }));

  const bullishScore = votes.filter((v) => v.reading === 'BULLISH').reduce((sum, v) => sum + v.weight * v.strength, 0);
  const bearishScore = votes.filter((v) => v.reading === 'BEARISH').reduce((sum, v) => sum + v.weight * v.strength, 0);
  const hasBullishVote = votes.some((v) => v.reading === 'BULLISH');
  const hasBearishVote = votes.some((v) => v.reading === 'BEARISH');

  const aggregateReading = bullishScore > bearishScore ? 'BULLISH' : bearishScore > bullishScore ? 'BEARISH' : 'NEUTRAL';
  const disagreement = hasBullishVote && hasBearishVote;

  const toContributor = (vote: FamilyVote): DimensionContributor => ({ providerId: vote.representativeProviderId, reading: vote.reading as 'BULLISH' | 'BEARISH', confidence: vote.strength });
  const bullishContributors = votes
    .filter((v) => v.reading === 'BULLISH')
    .sort((a, b) => b.strength - a.strength)
    .slice(0, MAX_CONTRIBUTORS_PER_SIDE)
    .map(toContributor);
  const bearishContributors = votes
    .filter((v) => v.reading === 'BEARISH')
    .sort((a, b) => b.strength - a.strength)
    .slice(0, MAX_CONTRIBUTORS_PER_SIDE)
    .map(toContributor);

  return { dimension, aggregateReading, disagreement, bullishContributors, bearishContributors };
}
