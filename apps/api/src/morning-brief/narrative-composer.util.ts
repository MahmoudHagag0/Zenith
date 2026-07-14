import type { ContributingProviderView, DecisionCenterResponse, InstrumentReading, RankedOpportunity } from '../dashboard/dashboard.types';
import type { MorningBriefEntry, MorningBriefResponse } from './morning-brief.types';

/**
 * The Narrative Composer (S1-020 Sprint Brief, Scope item 2) -- a
 * deterministic, template-based synthesis over `DashboardService.getDecisionCenter()`'s
 * (S1-019) own already-computed output. This is explicitly NOT the
 * generative AI Reasoning Layer (`25_PRODUCT_BLUEPRINT.md` §6, §8): every
 * function below is a pure mapping from already-existing structured
 * fields to a sentence -- no field is invented, no confidence value is
 * computed here, and no judgment is made that S1-019 did not already
 * make. Language follows `27_ZENITH_EXPERIENCE_LANGUAGE.md` §8: never
 * exciting, dramatic, persuasive, or predictive; always calm,
 * evidence-based, and professional.
 */

// Missing Decision 1 (S1-020 Sprint Brief): bounds Morning Brief's own
// information density (`27_ZENITH_EXPERIENCE_LANGUAGE.md` §3.1), reusing
// Decision Center's own existing rank order verbatim -- never re-ranked here.
export const MAX_MORNING_BRIEF_ENTRIES = 5;

function directionWord(direction: 'BULLISH' | 'BEARISH'): string {
  return direction === 'BULLISH' ? 'bullish' : 'bearish';
}

/** Story before numbers (Constitution §12.1): leads with direction and evidence-count, never a bare price or chart figure. */
export function buildStory(opportunity: RankedOpportunity): string {
  const { symbol, netDirection, agreeingDimensions, disagreementPresent } = opportunity;
  const base = `${symbol} is showing a ${directionWord(netDirection)} bias, agreeing across ${agreeingDimensions} of the seven Confluence dimensions`;
  return disagreementPresent ? `${base}, with at least one dimension in disagreement.` : `${base}.`;
}

/** Quotes the lead contributor's own interpretationSummary verbatim -- never re-derived or paraphrased. */
export function buildWhy(leadContributor: ContributingProviderView | undefined): string {
  if (!leadContributor) {
    return 'No contributing Provider produced an interpretation for this instrument.';
  }
  const family = leadContributor.methodologyFamily ?? leadContributor.providerId;
  return `The strongest currently-available evidence comes from ${family}: ${leadContributor.interpretationSummary}`;
}

/** Names which Confidence kind is reported and quotes its own explanation (Constitution §12.6) -- never a bare number. */
export function buildConfidenceExplanation(leadContributor: ContributingProviderView | undefined): string {
  if (!leadContributor) {
    return 'No confidence figure is available without a contributing Provider.';
  }
  const { interpretationConfidence, methodologyConfidenceCeiling } = leadContributor;
  return (
    `Interpretation confidence is rated ${interpretationConfidence.value.toString()} out of 100 -- ${interpretationConfidence.explanation} ` +
    `This reading's own methodology confidence ceiling is ${methodologyConfidenceCeiling.value.toString()} -- ${methodologyConfidenceCeiling.explanation}`
  );
}

/** Quotes Limitations, disclosed disagreement, and non-participation counts (Constitution §12.7) -- never hidden or softened. */
export function buildUncertaintyExplanation(reading: InstrumentReading, leadContributor: ContributingProviderView | undefined): string {
  const parts: string[] = [];

  if (reading.disagreementDimensions.length > 0) {
    parts.push(`${reading.disagreementDimensions.length} of 7 dimensions disagree with this reading's own net direction (${reading.disagreementDimensions.join(', ')}).`);
  }
  if (reading.participation.nonParticipating.length > 0) {
    parts.push(`${reading.participation.nonParticipating.length} of ${reading.participation.totalRegistered} registered Providers did not participate in this reading.`);
  }
  if (leadContributor) {
    if (leadContributor.uncertainty.dataQuality !== 'COMPLETE') {
      parts.push(`Underlying data quality is ${leadContributor.uncertainty.dataQuality.toLowerCase().replace('_', ' ')}.`);
    }
    for (const note of leadContributor.uncertainty.notes) {
      parts.push(note);
    }
  }

  return parts.length > 0 ? parts.join(' ') : 'No material uncertainty beyond the disclosed confidence figures above was reported.';
}

function composeEntry(opportunity: RankedOpportunity): MorningBriefEntry {
  const leadContributor = opportunity.reading.topContributors[0];
  return {
    assetId: opportunity.assetId,
    symbol: opportunity.symbol,
    marketName: opportunity.marketName,
    netDirection: opportunity.netDirection,
    story: buildStory(opportunity),
    why: buildWhy(leadContributor),
    confidenceExplanation: buildConfidenceExplanation(leadContributor),
    uncertaintyExplanation: buildUncertaintyExplanation(opportunity.reading, leadContributor),
    disagreementPresent: opportunity.disagreementPresent,
  };
}

/**
 * An explicit statement of why "No Trade" is the correct decision right
 * now (Product Rule 9, Constitution §12.4) -- a calm, first-class,
 * fully-supported outcome, never styled as a failure. Distinct in
 * wording from the `DEGRADED` case: "answered: nothing qualifies" is not
 * the same claim as "unable to compute at all."
 */
function buildNoTradeNarrative(decisionCenter: DecisionCenterResponse): string {
  if (decisionCenter.readiness === 'DEGRADED') {
    return (
      'Unable to generate a Morning Brief for any tracked instrument this session -- the evidence could not be computed. ' +
      'This differs from "no clear opportunity": the analysis itself is temporarily unavailable, not complete.'
    );
  }
  if (decisionCenter.instrumentsConsidered === 0) {
    return 'You are not currently tracking any instruments. Add an instrument to your Watchlist or Portfolio to receive a Morning Brief.';
  }
  return (
    'No clear opportunity is identified across your tracked instruments this session. ' +
    'This is a valid, fully-supported outcome -- the evidence does not currently support a directional bias, not a gap in analysis. ' +
    'No trade is the correct decision right now.'
  );
}

function buildHeadline(decisionCenter: DecisionCenterResponse): string {
  const { readiness, instrumentsConsidered, opportunities, instrumentsFailed } = decisionCenter;
  let headline: string;
  if (readiness === 'DEGRADED') {
    headline = "Unable to generate today's Morning Brief -- evidence could not be computed for any tracked instrument.";
  } else if (readiness === 'NO_CLEAR_OPPORTUNITY') {
    headline =
      instrumentsConsidered === 0
        ? 'No instruments are currently tracked.'
        : `This morning, none of your ${instrumentsConsidered} tracked instrument(s) show a clear directional bias.`;
  } else {
    headline = `This morning, ${opportunities.length} of your ${instrumentsConsidered} tracked instrument(s) show a directional bias worth reviewing.`;
  }
  if (instrumentsFailed.length > 0) {
    headline += ` Note: ${instrumentsFailed.length} instrument(s) could not be evaluated this session.`;
  }
  return headline;
}

/** The Narrative Composer's own single entry point -- a pure function of `DecisionCenterResponse`. */
export function composeMorningBrief(decisionCenter: DecisionCenterResponse): MorningBriefResponse {
  const entries = decisionCenter.opportunities.slice(0, MAX_MORNING_BRIEF_ENTRIES).map(composeEntry);

  return {
    generatedAt: decisionCenter.generatedAt,
    readiness: decisionCenter.readiness,
    headline: buildHeadline(decisionCenter),
    entries,
    noTradeNarrative: decisionCenter.readiness === 'OPPORTUNITIES_AVAILABLE' ? undefined : buildNoTradeNarrative(decisionCenter),
    instrumentsConsidered: decisionCenter.instrumentsConsidered,
    instrumentsFailed: decisionCenter.instrumentsFailed,
  };
}
