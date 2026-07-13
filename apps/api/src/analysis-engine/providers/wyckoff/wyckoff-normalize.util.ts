import type { AnalysisProviderResult } from '../analysis-provider.types';
import type { NormalizedDimension, NormalizedProviderOutput, NormalizedReading, NormalizedSignal } from '../normalized-vocabulary.types';

const VOCABULARY_SCHEMA_VERSION = '1.0.0';

/**
 * Wyckoff's own `normalize()` mapping (S1-012 Sprint Brief, Scope item 3)
 * — decentralized by implementation (ADR-007): this file uses only the
 * generic `AnalysisProviderResult` fields `WyckoffProvider.analyze()`
 * already produces (`evidence.detectedConditions`'s event-description
 * strings, `detectionConfidence`), never a Wyckoff-internal type, since
 * `normalize()`'s signature takes only the public contract result.
 *
 * Dimension mapping, disclosed here (S1-012 Sprint Brief, Missing
 * Decisions):
 *   TREND         -- BULLISH once an Accumulation-side event is detected (Selling Climax, Sign of Strength, or Last Point of Support), BEARISH for the symmetric Distribution-side events, NEUTRAL when both sides' events are genuinely present (ambiguous), NOT_APPLICABLE when no schematic was identified at all (the Limitations path) -- "nothing evaluated" is a different state from "evaluated and balanced."
 *   STRUCTURE     -- BULLISH/BEARISH only once the Sign of Strength/Weakness (the structural breakout event) is specifically detected -- a stricter bar than TREND, genuinely distinct from it.
 *   VOLUME        -- BULLISH/BEARISH only from the Selling/Buying Climax's own volume-spike criterion -- Wyckoff's own native use of volume.
 *   CONFIRMATION  -- BULLISH/BEARISH only once the Last Point of Support/Supply (the final confirming event) is detected.
 *   MOMENTUM, LIQUIDITY, VOLATILITY -- always NOT_APPLICABLE; this Provider's V1 scope has no native concept for them.
 */
export function normalizeWyckoffResult(providerId: string, methodologyFamily: string, result: AnalysisProviderResult): NormalizedProviderOutput {
  const detected = result.evidence.detectedConditions;
  const isAccumulation = detected.some((c) => c.includes('Selling Climax') || c.includes('Sign of Strength') || c.includes('Last Point of Support'));
  const isDistribution = detected.some((c) => c.includes('Buying Climax') || c.includes('Sign of Weakness') || c.includes('Last Point of Supply'));
  const strength = result.detectionConfidence.value.toNumber();

  const trendReading: NormalizedReading =
    detected.length === 0 ? 'NOT_APPLICABLE' : isAccumulation && !isDistribution ? 'BULLISH' : isDistribution && !isAccumulation ? 'BEARISH' : 'NEUTRAL';

  const structureReading: NormalizedReading = detected.some((c) => c.includes('Sign of Strength'))
    ? 'BULLISH'
    : detected.some((c) => c.includes('Sign of Weakness'))
      ? 'BEARISH'
      : 'NOT_APPLICABLE';

  const volumeReading: NormalizedReading = detected.some((c) => c.includes('Selling Climax'))
    ? 'BULLISH'
    : detected.some((c) => c.includes('Buying Climax'))
      ? 'BEARISH'
      : 'NOT_APPLICABLE';

  const confirmationReading: NormalizedReading = detected.some((c) => c.includes('Last Point of Support'))
    ? 'BULLISH'
    : detected.some((c) => c.includes('Last Point of Supply'))
      ? 'BEARISH'
      : 'NOT_APPLICABLE';

  const build = (dimension: NormalizedDimension, reading: NormalizedReading, sourceExplanation: string): NormalizedSignal =>
    reading === 'NOT_APPLICABLE'
      ? { dimension, reading, strength: 0, explanation: '' }
      : { dimension, reading, strength, explanation: sourceExplanation };

  return {
    providerId,
    methodologyFamily,
    vocabularySchemaVersion: VOCABULARY_SCHEMA_VERSION,
    signals: [
      build('TREND', trendReading, 'Accumulation/Distribution-side events detected imply this directional bias.'),
      build('MOMENTUM', 'NOT_APPLICABLE', ''),
      build('LIQUIDITY', 'NOT_APPLICABLE', ''),
      build('STRUCTURE', structureReading, 'Sign of Strength/Weakness is this Provider\'s own structural breakout event.'),
      build('VOLATILITY', 'NOT_APPLICABLE', ''),
      build('VOLUME', volumeReading, 'Selling/Buying Climax is this Provider\'s own native volume-spike criterion.'),
      build('CONFIRMATION', confirmationReading, 'Last Point of Support/Supply is this Provider\'s own final confirming event.'),
    ],
  };
}
