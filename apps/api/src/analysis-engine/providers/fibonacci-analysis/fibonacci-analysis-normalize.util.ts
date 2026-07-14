import type { AnalysisProviderResult } from '../analysis-provider.types';
import type { NormalizedDimension, NormalizedProviderOutput, NormalizedReading, NormalizedSignal } from '../normalized-vocabulary.types';

const VOCABULARY_SCHEMA_VERSION = '1.0.0';
const ALL_DIMENSIONS: readonly NormalizedDimension[] = ['TREND', 'MOMENTUM', 'LIQUIDITY', 'STRUCTURE', 'VOLATILITY', 'VOLUME', 'CONFIRMATION'];

/**
 * Fibonacci Analysis's own `normalize()` mapping (S1-017 Sprint Brief,
 * Scope item 11) -- decentralized by implementation (ADR-007): this file
 * uses only the generic `AnalysisProviderResult` fields
 * `FibonacciAnalysisProvider.analyze()` already produces, never a
 * Fibonacci-Analysis-internal type, since `normalize()`'s signature takes
 * only the public contract result.
 *
 * `interpretation[0].summary` embeds machine-parseable `[DIRECTION:...]`
 * and `[REACTION:...]` tags, the same bracketed-tag technique adopted at
 * S1-015 to close off the recurring substring-superset bug class by
 * construction, rather than string-matching bare words that could
 * collide with each other.
 *
 * Dimension mapping, disclosed here (S1-017 Sprint Brief, Missing
 * Decisions):
 *   TREND, STRUCTURE -- both directly from the primary reading's own
 *     direction (already flipped when `reactionState === 'BROKEN'`, a
 *     bias-flip signal computed inside `FibonacciAnalysisProvider` itself,
 *     never re-derived here) -- these necessarily always agree with each
 *     other, since the same ratio-derived level is both this Provider's
 *     directional read and its structural evidence.
 *   CONFIRMATION -- matches TREND's direction only when the primary
 *     reading's own reaction reads `RESPECTED` (a level proven to hold
 *     at least once), never for `UNTESTED` or `BROKEN`.
 *   MOMENTUM, LIQUIDITY, VOLATILITY, VOLUME -- always `NOT_APPLICABLE`;
 *     MOMENTUM and VOLUME deliberately, to preserve independence from
 *     two other registered methodologies' own native concepts.
 */
export function normalizeFibonacciAnalysisResult(providerId: string, methodologyFamily: string, result: AnalysisProviderResult): NormalizedProviderOutput {
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

  const direction: NormalizedReading = primarySummary.includes('[DIRECTION:BULLISH]') ? 'BULLISH' : primarySummary.includes('[DIRECTION:BEARISH]') ? 'BEARISH' : 'NEUTRAL';
  const isRespected = primarySummary.includes('[REACTION:RESPECTED]');

  const build = (dimension: NormalizedDimension, reading: NormalizedReading, explanation: string): NormalizedSignal =>
    reading === 'NOT_APPLICABLE' ? { dimension, reading, strength: 0, explanation: '' } : { dimension, reading, strength, explanation };

  return {
    providerId,
    methodologyFamily,
    vocabularySchemaVersion: VOCABULARY_SCHEMA_VERSION,
    signals: [
      build('TREND', direction, "This reading's own implied bias -- which side of the Fibonacci level/zone current price is expected to respect."),
      build('MOMENTUM', 'NOT_APPLICABLE', ''),
      build('LIQUIDITY', 'NOT_APPLICABLE', ''),
      build('STRUCTURE', direction, "This reading's own ratio-derived level/zone geometry is this Provider's own structural evidence."),
      build('VOLATILITY', 'NOT_APPLICABLE', ''),
      build('VOLUME', 'NOT_APPLICABLE', ''),
      build('CONFIRMATION', isRespected ? direction : 'NOT_APPLICABLE', 'A level or zone already proven to hold at least once is this reading\'s own confirming signal.'),
    ],
  };
}
