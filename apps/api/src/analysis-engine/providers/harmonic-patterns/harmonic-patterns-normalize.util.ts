import type { AnalysisProviderResult } from '../analysis-provider.types';
import type { NormalizedDimension, NormalizedProviderOutput, NormalizedReading, NormalizedSignal } from '../normalized-vocabulary.types';

const VOCABULARY_SCHEMA_VERSION = '1.0.0';

/**
 * Harmonic Patterns' own `normalize()` mapping (S1-013 Sprint Brief,
 * Scope item 13) -- decentralized by implementation (ADR-007): this file
 * uses only the generic `AnalysisProviderResult` fields
 * `HarmonicPatternsProvider.analyze()` already produces
 * (`interpretation[0].summary`'s direction/pattern-type/time-symmetry
 * wording), never a Harmonic-Patterns-internal type, since `normalize()`'s
 * signature takes only the public contract result.
 *
 * Dimension mapping, disclosed here (S1-013 Sprint Brief, Missing
 * Decisions):
 *   TREND, STRUCTURE -- both directly from the primary matched pattern's
 *     own completion direction word (`'BULLISH'`/`'BEARISH'`) embedded in
 *     `interpretation[0].summary` -- these necessarily always agree with
 *     each other for this Provider, since both derive from the same
 *     underlying pattern match.
 *   CONFIRMATION -- matches TREND's direction only when the primary
 *     hypothesis's own summary discloses "confirmed AB=CD time symmetry"
 *     (a genuinely distinct signal from the price-ratio match itself),
 *     else NOT_APPLICABLE.
 *   MOMENTUM, LIQUIDITY, VOLATILITY, VOLUME -- always NOT_APPLICABLE;
 *     this Provider's V1 scope has no native concept for them.
 */
export function normalizeHarmonicPatternsResult(providerId: string, methodologyFamily: string, result: AnalysisProviderResult): NormalizedProviderOutput {
  const primarySummary = result.interpretation[0]?.summary ?? '';
  const strength = result.detectionConfidence.value.toNumber();

  const direction: NormalizedReading =
    result.interpretation.length === 0
      ? 'NOT_APPLICABLE'
      : primarySummary.includes('BULLISH')
        ? 'BULLISH'
        : primarySummary.includes('BEARISH')
          ? 'BEARISH'
          : 'NEUTRAL';

  const confirmationReading: NormalizedReading = direction !== 'NOT_APPLICABLE' && primarySummary.includes('confirmed AB=CD time symmetry') ? direction : 'NOT_APPLICABLE';

  const build = (dimension: NormalizedDimension, reading: NormalizedReading, explanation: string): NormalizedSignal =>
    reading === 'NOT_APPLICABLE' ? { dimension, reading, strength: 0, explanation: '' } : { dimension, reading, strength, explanation };

  return {
    providerId,
    methodologyFamily,
    vocabularySchemaVersion: VOCABULARY_SCHEMA_VERSION,
    signals: [
      build('TREND', direction, 'The primary matched pattern (Gartley/Bat/Butterfly/Crab) implies this directional bias at its own D-point completion.'),
      build('MOMENTUM', 'NOT_APPLICABLE', ''),
      build('LIQUIDITY', 'NOT_APPLICABLE', ''),
      build('STRUCTURE', direction, "The matched pattern's own five-point (X-A-B-C-D) geometry is this Provider's own structural evidence."),
      build('VOLATILITY', 'NOT_APPLICABLE', ''),
      build('VOLUME', 'NOT_APPLICABLE', ''),
      build('CONFIRMATION', confirmationReading, "Confirmed AB=CD time symmetry is this Provider's own secondary confirming signal, distinct from price-ratio conformance alone."),
    ],
  };
}
