import type { LLMJsonSchema, LLMStructuredRequest } from './llm/llm-provider.interface';
import type { ReasoningContext } from './reasoning.types';

/**
 * The engineering translation of Constitution §11 (AI Personality) into a
 * concrete system prompt (implementation architecture §9 Task 3; Constitution
 * §15.6: "§11 itself is not implementation-ready text to paste into a model
 * prompt without engineering translation"). Each numbered rule below maps to
 * one §11 subsection, one §13 Product Rule, or Product DNA §3.1 -- cited
 * inline so a future reviewer can check this translation against the
 * Constitution clause it implements, not just against this file's prose.
 *
 * Deliberately NOT a place where Confidence/Evidence/Traceability values
 * are asked for -- the model is only ever asked to write prose and name
 * which already-computed dimensions it drew on (Constitution §12.6: a model
 * must never invent a Confidence number).
 */
export const REASONING_SYSTEM_INSTRUCTION = `You are the reasoning component of Zenith, an explainable trading intelligence platform. You are given already-computed analysis data about one instrument, portfolio, or set of tracked instruments, and a trader's question about it. Follow these rules exactly:

1. Zenith never produces BUY/SELL recommendations, entry prices, exit prices, position sizes, or trading signals of any kind, under any phrasing (Constitution §3.1). This is not a style preference -- it is what "Zenith" means. You produce evidence, interpretation, and disclosed limitations only. If the trader's question asks for a recommendation, explain what the evidence shows without recommending any action.
2. Lead with the trader-relevant conclusion, then disclose the evidence and reasoning behind it (§11.2, §12.1). Never bury the conclusion at the end.
3. Be calm, precise, and non-alarmist. Never use urgency language ("act now", "don't miss") regardless of how time-sensitive the evidence is (§11.1, §11.5).
4. State what you do not know as plainly and as prominently as what you do know (§11.3, §13 Rule 7).
5. Only reference dimensions, providers, or facts that are actually present in the supplied context. Never invent a fact, a price, a date, or a data point that is not in the context you were given.
6. Where providers or data sources disagree, report the disagreement honestly. Never resolve disagreement into a false consensus (§3.2 Principle 3).
7. "No clear opportunity" or "insufficient evidence" is a fully legitimate answer, never something to minimize or talk around (§13 Rule 9).
8. Never use unexplained jargon -- write for a general trader audience.
9. Teach the trader why, not merely what (§11.6).

Respond only with the structured JSON fields requested. Do not include a Confidence number, an evidence citation, or a traceability record of your own -- those are attached separately from data you were given; you only write "referencedDimensions" naming which of the dimensions present in the supplied context your reasoning actually used.`;

export const REASONING_RESPONSE_SCHEMA: LLMJsonSchema = {
  type: 'object',
  properties: {
    reasoning: { type: 'string' },
    referencedDimensions: { type: 'array', items: { type: 'string' } },
    contradictions: { type: 'array', items: { type: 'string' } },
    suggestedNextSteps: { type: 'array', items: { type: 'string' } },
    uncertaintyNotes: { type: 'array', items: { type: 'string' } },
    behaviorNotes: { type: 'array', items: { type: 'string' } },
  },
  required: ['reasoning', 'referencedDimensions', 'contradictions', 'suggestedNextSteps', 'uncertaintyNotes', 'behaviorNotes'],
};

function describeInstrumentContext(context: Extract<ReasoningContext, { kind: 'INSTRUMENT' }>): string {
  const { asset } = context;
  const dimensions = asset.reading?.dimensions.map((d) => `${d.dimension}: ${d.aggregateReading}${d.disagreement ? ' (disagreement present)' : ''}`).join('; ') ?? 'unavailable';
  const topContributor = asset.reading?.topContributors[0];
  const contributorSummary = topContributor
    ? `Lead contributor ${topContributor.providerId} (${topContributor.methodologyFamily ?? 'unlabeled methodology'}): "${topContributor.interpretationSummary}"`
    : 'No contributing Provider produced an interpretation.';
  const newsSummary = asset.news.length > 0 ? `${asset.news.length} recent news item(s)` : 'no recent news';
  const eventsSummary = asset.upcomingEvents.length > 0 ? `${asset.upcomingEvents.length} upcoming calendar event(s)` : 'no upcoming calendar events';
  const cotSummary = asset.cotReports.length > 0 ? `${asset.cotReports.length} COT category report(s)` : 'no COT data';
  const journalSummary = asset.journalEntries.length > 0 ? `${asset.journalEntries.length} trader Journal entry(ies) on this instrument` : 'no Journal entries on this instrument';
  const alertsSummary = asset.alerts.length > 0 ? `${asset.alerts.length} active alert(s)` : 'no active alerts';
  const readingFailure = asset.readingFailureReason ? `Confluence reading FAILED: ${asset.readingFailureReason}` : null;

  return [
    `Instrument: ${asset.symbol} (${asset.name})`,
    readingFailure ?? `Net direction: ${asset.reading?.netDirection ?? 'unknown'}, agreeing across ${asset.reading?.agreeingDimensions ?? 0} of 7 dimensions.`,
    readingFailure ? null : `Dimensions: ${dimensions}`,
    readingFailure ? null : contributorSummary,
    `News: ${newsSummary}. Calendar: ${eventsSummary}. COT: ${cotSummary}. Journal: ${journalSummary}. Alerts: ${alertsSummary}.`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

function describePortfolioContext(context: Extract<ReasoningContext, { kind: 'PORTFOLIO' }>): string {
  const { portfolio, analytics } = context.portfolio;
  return `Portfolio: ${portfolio.name}\nAnalytics: ${JSON.stringify(analytics)}`;
}

function describeTrackedAssetsContext(context: Extract<ReasoningContext, { kind: 'TRACKED_ASSETS' }>): string {
  const { trackedAssets } = context;
  if (trackedAssets.entries.length === 0) {
    return `Readiness: ${trackedAssets.readiness}. ${trackedAssets.noTradeNarrative ?? 'No ranked opportunities are currently available.'}`;
  }
  const entries = trackedAssets.entries
    .map((entry) => `${entry.symbol} (${entry.marketName}): ${entry.story} ${entry.why} ${entry.confidenceExplanation} ${entry.uncertaintyExplanation}`)
    .join('\n');
  return `Readiness: ${trackedAssets.readiness}\n${entries}`;
}

/** Serializes a `ReasoningContext` into the text block the model reads -- the only place context data is turned into prose the model sees. */
export function describeContext(context: ReasoningContext): string {
  switch (context.kind) {
    case 'INSTRUMENT':
      return describeInstrumentContext(context);
    case 'PORTFOLIO':
      return describePortfolioContext(context);
    case 'TRACKED_ASSETS':
      return describeTrackedAssetsContext(context);
  }
}

/** Builds the complete, provider-agnostic structured request for `LLMProvider.generateStructured()`. */
export function buildReasoningRequest(context: ReasoningContext, question: string): LLMStructuredRequest {
  const userContent = `CONTEXT DATA (this is the only information you may draw on):\n${context.scopeDescription}\n${describeContext(context)}\n\nTRADER'S QUESTION:\n${question}`;
  return {
    systemInstruction: REASONING_SYSTEM_INSTRUCTION,
    userContent,
    responseSchema: REASONING_RESPONSE_SCHEMA,
  };
}
