import type { AnalysisProviderResult } from '../analysis-provider.types';
import type { NormalizedDimension, NormalizedProviderOutput, NormalizedReading, NormalizedSignal } from '../normalized-vocabulary.types';

const VOCABULARY_SCHEMA_VERSION = '1.0.0';
const ALL_DIMENSIONS: readonly NormalizedDimension[] = ['TREND', 'MOMENTUM', 'LIQUIDITY', 'STRUCTURE', 'VOLATILITY', 'VOLUME', 'CONFIRMATION'];

/**
 * Supply & Demand's own `normalize()` mapping (S1-016 Sprint Brief,
 * Scope item 12) -- decentralized by implementation (ADR-007): this file
 * uses only the generic `AnalysisProviderResult` fields
 * `SupplyDemandProvider.analyze()` already produces, never a Supply-
 * and-Demand-internal type, since `normalize()`'s signature takes only
 * the public contract result.
 *
 * `interpretation[0].summary` embeds machine-parseable `[TYPE:...]`,
 * `[FRESHNESS:...]`, and `[MITIGATION:...]` tags specifically so this
 * mapping never has to string-match a bare word that could collide with
 * another as a substring (the recurring bug class named at every prior
 * sprint's own self-review since S1-013/S1-014) -- the same bracketed-
 * tag technique adopted at S1-015.
 *
 * Dimension mapping, disclosed here (S1-016 Sprint Brief, Missing
 * Decisions):
 *   TREND, STRUCTURE -- both directly from this zone's own type
 *     (`DEMAND` implies `BULLISH`, `SUPPLY` implies `BEARISH`) -- these
 *     necessarily always agree with each other, since the zone itself is
 *     both this Provider's directional read and its structural evidence.
 *   LIQUIDITY -- also matches the same direction: an unmitigated zone
 *     represents a concentration of resting institutional orders. This
 *     legitimately shares the `LIQUIDITY` dimension with another
 *     registered Provider's own use of it -- deliberate and expected,
 *     since two Providers populating the same dimension from their own
 *     independent methodologies is exactly how the Confluence Engine
 *     detects genuine cross-methodology agreement, not a violation of
 *     independence.
 *   CONFIRMATION -- matches TREND's direction only when the primary
 *     zone is both `FRESH` and `UNMITIGATED` (the strongest possible
 *     zone state: untested and unmitigated), else `NOT_APPLICABLE`.
 *   MOMENTUM, VOLATILITY, VOLUME -- always `NOT_APPLICABLE`; MOMENTUM
 *     and VOLUME deliberately, to preserve independence from two other
 *     registered methodologies' own native concepts.
 */
export function normalizeSupplyDemandResult(providerId: string, methodologyFamily: string, result: AnalysisProviderResult): NormalizedProviderOutput {
  if (result.interpretation.length === 0) {
    return {
      providerId,
      methodologyFamily,
      vocabularySchemaVersion: VOCABULARY_SCHEMA_VERSION,
      signals: ALL_DIMENSIONS.map((dimension) => ({ dimension, reading: 'NOT_APPLICABLE' as const, strength: 0, explanation: '' })),
    };
  }

  const primarySummary = result.interpretation[0].summary;
  const strength = result.detectionConfidence.value.toNumber();

  const direction: NormalizedReading = primarySummary.includes('[TYPE:DEMAND]') ? 'BULLISH' : primarySummary.includes('[TYPE:SUPPLY]') ? 'BEARISH' : 'NEUTRAL';
  const isFreshUnmitigated = primarySummary.includes('[FRESHNESS:FRESH]') && primarySummary.includes('[MITIGATION:UNMITIGATED]');

  const build = (dimension: NormalizedDimension, reading: NormalizedReading, explanation: string): NormalizedSignal =>
    reading === 'NOT_APPLICABLE' ? { dimension, reading, strength: 0, explanation: '' } : { dimension, reading, strength, explanation };

  return {
    providerId,
    methodologyFamily,
    vocabularySchemaVersion: VOCABULARY_SCHEMA_VERSION,
    signals: [
      build('TREND', direction, "This zone's own type (DEMAND/SUPPLY) is this Provider's own directional read."),
      build('MOMENTUM', 'NOT_APPLICABLE', ''),
      build('LIQUIDITY', direction, 'An unmitigated zone represents a concentration of resting institutional orders.'),
      build('STRUCTURE', direction, "This zone's own base-and-departure geometry is this Provider's own structural evidence."),
      build('VOLATILITY', 'NOT_APPLICABLE', ''),
      build('VOLUME', 'NOT_APPLICABLE', ''),
      build('CONFIRMATION', isFreshUnmitigated ? direction : 'NOT_APPLICABLE', 'An untested, unmitigated zone is this reading\'s own strongest possible confirming state.'),
    ],
  };
}
