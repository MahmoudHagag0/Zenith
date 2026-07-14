import type { AnalysisProviderResult } from '../analysis-provider.types';
import type { NormalizedDimension, NormalizedProviderOutput, NormalizedReading, NormalizedSignal } from '../normalized-vocabulary.types';

const VOCABULARY_SCHEMA_VERSION = '1.0.0';
const ALL_DIMENSIONS: readonly NormalizedDimension[] = ['TREND', 'MOMENTUM', 'LIQUIDITY', 'STRUCTURE', 'VOLATILITY', 'VOLUME', 'CONFIRMATION'];
const BREAKOUT_FAMILY_STATES = ['BREAKOUT_UNCONFIRMED', 'BREAKOUT_CONFIRMED', 'BREAKOUT_FAILED'];

/**
 * Price Action's own `normalize()` mapping (S1-015 Sprint Brief, Scope
 * item 12) -- decentralized by implementation (ADR-007): this file uses
 * only the generic `AnalysisProviderResult` fields
 * `PriceActionProvider.analyze()` already produces, never a Price-
 * Action-internal type, since `normalize()`'s signature takes only the
 * public contract result.
 *
 * `interpretation[0].summary` embeds machine-parseable `[STATE:...]`,
 * `[DIRECTION:...]`, and `[MOMENTUM_SCORE:...]` tags specifically so this
 * mapping never has to string-match a bare state/direction word. A prior
 * Provider's own normalize() once risked a substring-superset bug from
 * matching bare confirmation-status words against each other (e.g. an
 * "UNCONFIRMED" reading's own text literally containing "CONFIRMED" as a
 * substring); bracketed, prefixed tags close that whole bug class off by
 * construction rather than requiring careful wording review each time.
 *
 * Dimension mapping, disclosed here (S1-015 Sprint Brief, Missing
 * Decisions):
 *   TREND, STRUCTURE -- both directly from this reading's own direction
 *     (a failed breakout's own direction is already flipped to the
 *     opposite of the original breakout by `PriceActionProvider`, so no
 *     special-casing is needed here) -- these necessarily always agree
 *     with each other, since candle interaction with the key level is
 *     both this Provider's trend read and its structural evidence.
 *   MOMENTUM -- the first Provider to populate a genuine, natively-
 *     computed momentum strength (this reading's own momentum score, not
 *     a proxy or reused Detection Confidence value) -- only for the three
 *     directional (breakout) states; NOT_APPLICABLE otherwise, since
 *     momentum is not computed for a non-directional reading.
 *   CONFIRMATION -- matches TREND's direction only for `BREAKOUT_CONFIRMED`
 *     (a held retest beyond the key level), never for any other state.
 *   LIQUIDITY, VOLATILITY, VOLUME -- always NOT_APPLICABLE; this
 *     Provider's V1 scope has no native concept for them (VOLUME is
 *     deliberately excluded, not merely unimplemented -- Non-Scope).
 */
export function normalizePriceActionResult(providerId: string, methodologyFamily: string, result: AnalysisProviderResult): NormalizedProviderOutput {
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
  const isBreakoutFamily = BREAKOUT_FAMILY_STATES.some((state) => primarySummary.includes(`[STATE:${state}]`));
  const isBreakoutConfirmed = primarySummary.includes('[STATE:BREAKOUT_CONFIRMED]');

  const momentumMatch = /\[MOMENTUM_SCORE:(\d+(?:\.\d+)?)\]/.exec(primarySummary);
  const momentumStrength = momentumMatch ? Number(momentumMatch[1]) : 0;

  const build = (dimension: NormalizedDimension, reading: NormalizedReading, signalStrength: number, explanation: string): NormalizedSignal =>
    reading === 'NOT_APPLICABLE' ? { dimension, reading, strength: 0, explanation: '' } : { dimension, reading, strength: signalStrength, explanation };

  return {
    providerId,
    methodologyFamily,
    vocabularySchemaVersion: VOCABULARY_SCHEMA_VERSION,
    signals: [
      build('TREND', direction, strength, "This reading's own direction -- how price is currently behaving relative to its single key level."),
      build('MOMENTUM', isBreakoutFamily ? direction : 'NOT_APPLICABLE', momentumStrength, "This reading's own ATR-relative momentum score, natively computed only once a breakout has actually occurred."),
      build('LIQUIDITY', 'NOT_APPLICABLE', 0, ''),
      build('STRUCTURE', direction, strength, "This reading's own candle interaction with its single key level is its structural evidence."),
      build('VOLATILITY', 'NOT_APPLICABLE', 0, ''),
      build('VOLUME', 'NOT_APPLICABLE', 0, ''),
      build('CONFIRMATION', isBreakoutConfirmed ? direction : 'NOT_APPLICABLE', strength, "A held retest beyond the key level is this reading's own confirming signal."),
    ],
  };
}
