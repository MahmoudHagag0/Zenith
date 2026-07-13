import type { AnalysisProviderResult } from '../analysis-provider.types';
import type { NormalizedDimension, NormalizedProviderOutput, NormalizedReading, NormalizedSignal } from '../normalized-vocabulary.types';

const VOCABULARY_SCHEMA_VERSION = '1.0.0';

/**
 * Classical Chart Patterns' own `normalize()` mapping (S1-014 Sprint
 * Brief, Scope item 11) -- decentralized by implementation (ADR-007):
 * this file uses only the generic `AnalysisProviderResult` fields
 * `ClassicalChartPatternsProvider.analyze()` already produces
 * (`interpretation[0].summary`'s direction/confirmation wording), never
 * a Classical-Chart-Patterns-internal type, since `normalize()`'s
 * signature takes only the public contract result.
 *
 * Dimension mapping, disclosed here (S1-014 Sprint Brief, Missing
 * Decisions):
 *   TREND, STRUCTURE -- both directly from the primary matched pattern's
 *     own anticipated reversal direction word (`'BULLISH'`/`'BEARISH'`)
 *     embedded in `interpretation[0].summary` -- these necessarily
 *     always agree with each other for this Provider, since both derive
 *     from the same underlying pattern match.
 *   CONFIRMATION -- matches TREND's direction only when the primary
 *     hypothesis's own summary does NOT disclose the pattern as "still
 *     forming" (this Provider's own unconfirmed-state marker) -- i.e.
 *     only for a `CONFIRMED`/`VOLUME_CONFIRMED` reading, never for
 *     `UNCONFIRMED`.
 *   MOMENTUM, LIQUIDITY, VOLATILITY, VOLUME -- always NOT_APPLICABLE;
 *     this Provider's V1 scope has no native concept for them.
 */
export function normalizeClassicalChartPatternsResult(providerId: string, methodologyFamily: string, result: AnalysisProviderResult): NormalizedProviderOutput {
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

  const confirmationReading: NormalizedReading = direction !== 'NOT_APPLICABLE' && !primarySummary.includes('still forming') ? direction : 'NOT_APPLICABLE';

  const build = (dimension: NormalizedDimension, reading: NormalizedReading, explanation: string): NormalizedSignal =>
    reading === 'NOT_APPLICABLE' ? { dimension, reading, strength: 0, explanation: '' } : { dimension, reading, strength, explanation };

  return {
    providerId,
    methodologyFamily,
    vocabularySchemaVersion: VOCABULARY_SCHEMA_VERSION,
    signals: [
      build('TREND', direction, 'The primary matched pattern (Head and Shoulders/Double Top/Double Bottom) implies this anticipated reversal direction.'),
      build('MOMENTUM', 'NOT_APPLICABLE', ''),
      build('LIQUIDITY', 'NOT_APPLICABLE', ''),
      build('STRUCTURE', direction, "The matched pattern's own shape geometry is this Provider's own structural evidence."),
      build('VOLATILITY', 'NOT_APPLICABLE', ''),
      build('VOLUME', 'NOT_APPLICABLE', ''),
      build('CONFIRMATION', confirmationReading, "A confirmed neckline break is this Provider's own secondary confirming signal, distinct from shape conformance alone."),
    ],
  };
}
