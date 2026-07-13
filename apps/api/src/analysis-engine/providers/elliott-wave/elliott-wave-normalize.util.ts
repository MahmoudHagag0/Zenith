import type { AnalysisProviderResult } from '../analysis-provider.types';
import type { NormalizedDimension, NormalizedProviderOutput, NormalizedReading, NormalizedSignal } from '../normalized-vocabulary.types';

const VOCABULARY_SCHEMA_VERSION = '1.0.0';

/** Interpretation Confidence (Fibonacci-guideline proximity) at or above this threshold reads as a MOMENTUM confirmation in the wave's own direction. */
const MOMENTUM_CONFIDENCE_THRESHOLD = 60;
/** Detection Confidence (weakest Rule margin) at or above this threshold reads as a CONFIRMATION signal in the wave's own direction. */
const CONFIRMATION_MARGIN_THRESHOLD = 50;

/**
 * Elliott Wave's own `normalize()` mapping (S1-012 Sprint Brief, Scope
 * item 3) -- decentralized by implementation (ADR-007): this file uses
 * only the generic `AnalysisProviderResult` fields
 * `ElliottWaveProvider.analyze()` already produces (the primary
 * hypothesis's own direction word embedded in `interpretation[0].summary`,
 * its Interpretation/Detection Confidence values), never an
 * Elliott-Wave-internal type.
 *
 * Dimension mapping, disclosed here (S1-012 Sprint Brief, Missing
 * Decisions):
 *   TREND, STRUCTURE -- both from the primary wave count's own direction (NOT_APPLICABLE when no candidate survived -- the Limitations path); the wave count itself is this Provider's structural evidence.
 *   MOMENTUM         -- matches TREND's direction only when Interpretation Confidence (Fibonacci-guideline proximity) clears a disclosed threshold, else NOT_APPLICABLE.
 *   CONFIRMATION     -- matches TREND's direction only when Detection Confidence (the weakest Rule margin) clears a disclosed threshold, else NOT_APPLICABLE.
 *   LIQUIDITY, VOLATILITY, VOLUME -- always NOT_APPLICABLE; this Provider's V1 scope has no native concept for them (and never uses volume at all).
 */
export function normalizeElliottWaveResult(providerId: string, methodologyFamily: string, result: AnalysisProviderResult): NormalizedProviderOutput {
  const summary = result.interpretation[0]?.summary ?? '';
  const trendReading: NormalizedReading =
    result.interpretation.length === 0 ? 'NOT_APPLICABLE' : summary.includes('BULLISH') ? 'BULLISH' : summary.includes('BEARISH') ? 'BEARISH' : 'NEUTRAL';

  const interpretationConfidence = result.interpretation[0]?.confidence.value.toNumber() ?? 0;
  const detectionConfidence = result.detectionConfidence.value.toNumber();

  const momentumReading: NormalizedReading = trendReading !== 'NEUTRAL' && interpretationConfidence >= MOMENTUM_CONFIDENCE_THRESHOLD ? trendReading : 'NOT_APPLICABLE';
  const confirmationReading: NormalizedReading = trendReading !== 'NEUTRAL' && detectionConfidence >= CONFIRMATION_MARGIN_THRESHOLD ? trendReading : 'NOT_APPLICABLE';

  const build = (dimension: NormalizedDimension, reading: NormalizedReading, strength: number, explanation: string): NormalizedSignal =>
    reading === 'NOT_APPLICABLE' ? { dimension, reading, strength: 0, explanation: '' } : { dimension, reading, strength, explanation };

  return {
    providerId,
    methodologyFamily,
    vocabularySchemaVersion: VOCABULARY_SCHEMA_VERSION,
    signals: [
      build('TREND', trendReading, detectionConfidence, "This Provider's primary wave count's own direction."),
      build('MOMENTUM', momentumReading, interpretationConfidence, 'A strong Fibonacci-guideline (Wave 3 extension) match implies confirming momentum in this direction.'),
      build('LIQUIDITY', 'NOT_APPLICABLE', 0, ''),
      build('STRUCTURE', trendReading, detectionConfidence, 'The 5-wave motive count itself is this Provider\'s own structural evidence.'),
      build('VOLATILITY', 'NOT_APPLICABLE', 0, ''),
      build('VOLUME', 'NOT_APPLICABLE', 0, ''),
      build('CONFIRMATION', confirmationReading, detectionConfidence, "A comfortable Rule margin (this Provider's own Detection Confidence) implies confirmation in this direction."),
    ],
  };
}
