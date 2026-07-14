import type { AnalysisProviderResult } from '../analysis-provider.types';
import type { NormalizedDimension, NormalizedProviderOutput, NormalizedReading, NormalizedSignal } from '../normalized-vocabulary.types';

const VOCABULARY_SCHEMA_VERSION = '1.0.0';
const ALL_DIMENSIONS: readonly NormalizedDimension[] = ['TREND', 'MOMENTUM', 'LIQUIDITY', 'STRUCTURE', 'VOLATILITY', 'VOLUME', 'CONFIRMATION'];

/**
 * VSA's own `normalize()` mapping (S1-018 Sprint Brief, Scope item 9) --
 * decentralized by implementation (ADR-007): this file uses only the
 * generic `AnalysisProviderResult` fields `VsaProvider.analyze()` already
 * produces, never a VSA-internal type, since `normalize()`'s signature
 * takes only the public contract result.
 *
 * `interpretation[0].summary` embeds machine-parseable `[SIGNAL:...]`,
 * `[CATEGORY:...]`, and `[DIRECTION:...]` tags specifically so this
 * mapping never has to string-match a bare word that could collide with
 * another as a substring (the recurring bug class named at every prior
 * sprint's own self-review since S1-013/S1-014) -- the same bracketed-
 * tag technique adopted at S1-015.
 *
 * Dimension mapping, disclosed here (S1-018 Sprint Brief, Missing
 * Decisions):
 *   TREND, STRUCTURE -- both from this signal's own implied direction.
 *   VOLUME -- also matches the same direction. This is the first
 *     Provider to populate `VOLUME` natively (every prior Provider
 *     deliberately left it `NOT_APPLICABLE` to preserve independence
 *     from this Provider's own future territory) -- the disclosed,
 *     anticipated exception, since this is the one Provider whose
 *     native methodology genuinely is volume.
 *   CONFIRMATION -- matches direction only for a climax-type signal
 *     (Upthrust, Shakeout, Stopping Volume) -- a genuine turning-point
 *     event, a stronger confirming claim than a quiet-type signal's own
 *     mere absence of participation.
 *   MOMENTUM, LIQUIDITY, VOLATILITY -- always `NOT_APPLICABLE`,
 *     deliberately, to preserve independence from every prior
 *     Provider's own native use of those dimensions.
 */
export function normalizeVsaResult(providerId: string, methodologyFamily: string, result: AnalysisProviderResult): NormalizedProviderOutput {
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

  const isClimax = primarySummary.includes('[CATEGORY:CLIMAX]');
  const direction: NormalizedReading = primarySummary.includes('[DIRECTION:BULLISH]') ? 'BULLISH' : primarySummary.includes('[DIRECTION:BEARISH]') ? 'BEARISH' : 'NEUTRAL';

  const build = (dimension: NormalizedDimension, reading: NormalizedReading, explanation: string): NormalizedSignal =>
    reading === 'NOT_APPLICABLE' ? { dimension, reading, strength: 0, explanation: '' } : { dimension, reading, strength, explanation };

  return {
    providerId,
    methodologyFamily,
    vocabularySchemaVersion: VOCABULARY_SCHEMA_VERSION,
    signals: [
      build('TREND', direction, "This signal's own implied bias is this Provider's own directional read."),
      build('MOMENTUM', 'NOT_APPLICABLE', ''),
      build('LIQUIDITY', 'NOT_APPLICABLE', ''),
      build('STRUCTURE', direction, "This signal's own bar-level volume/spread/close-position geometry is this Provider's own structural evidence."),
      build('VOLATILITY', 'NOT_APPLICABLE', ''),
      build('VOLUME', direction, "This Provider's own native methodology is volume itself -- the first Provider to populate this dimension natively."),
      build('CONFIRMATION', isClimax ? direction : 'NOT_APPLICABLE', 'A climax-type signal (Upthrust/Shakeout/Stopping Volume) is a genuine turning-point event, this reading\'s own strongest possible confirming state.'),
    ],
  };
}
