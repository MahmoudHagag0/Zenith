import type { AnalysisProviderResult } from '../analysis-provider.types';
import type { NormalizedDimension, NormalizedProviderOutput, NormalizedReading, NormalizedSignal } from '../normalized-vocabulary.types';

const VOCABULARY_SCHEMA_VERSION = '1.0.0';

/**
 * ICT/SMC's own `normalize()` mapping (S1-012 Sprint Brief, Scope item
 * 3) -- decentralized by implementation (ADR-007): this file uses only
 * the generic `AnalysisProviderResult` fields `IctSmcProvider.analyze()`
 * already produces, never an ICT-internal type.
 *
 * Dimension mapping, disclosed here (S1-012 Sprint Brief, Missing
 * Decisions):
 *   TREND         -- from the primary bias hypothesis's own direction; NOT_APPLICABLE when no hypothesis survived (the Limitations path) -- "nothing evaluated" is a different state from "evaluated and balanced."
 *   LIQUIDITY     -- BULLISH/BEARISH only from a detected Liquidity Sweep's own direction -- this Provider's native strength.
 *   STRUCTURE     -- BULLISH/BEARISH only from a detected Order Block's own direction.
 *   CONFIRMATION  -- BULLISH/BEARISH only from a detected Fair Value Gap's own direction.
 *   MOMENTUM, VOLATILITY, VOLUME -- always NOT_APPLICABLE; this Provider's V1 scope has no native concept for them (and never uses volume at all).
 */
export function normalizeIctSmcResult(providerId: string, methodologyFamily: string, result: AnalysisProviderResult): NormalizedProviderOutput {
  const detected = result.evidence.detectedConditions;
  const primarySummary = result.interpretation[0]?.summary ?? '';
  const strength = result.detectionConfidence.value.toNumber();

  const directionFrom = (bullishPrefix: string, bearishPrefix: string): NormalizedReading => {
    const hasBullish = detected.some((c) => c.startsWith(bullishPrefix));
    const hasBearish = detected.some((c) => c.startsWith(bearishPrefix));
    return hasBullish && !hasBearish ? 'BULLISH' : hasBearish && !hasBullish ? 'BEARISH' : hasBullish && hasBearish ? 'NEUTRAL' : 'NOT_APPLICABLE';
  };

  const trendReading: NormalizedReading =
    result.interpretation.length === 0
      ? 'NOT_APPLICABLE'
      : primarySummary.includes('Bullish bias')
        ? 'BULLISH'
        : primarySummary.includes('Bearish bias')
          ? 'BEARISH'
          : 'NEUTRAL';
  const liquidityReading = directionFrom('BULLISH Liquidity Sweep', 'BEARISH Liquidity Sweep');
  const structureReading = directionFrom('BULLISH Order Block', 'BEARISH Order Block');
  const confirmationReading = directionFrom('BULLISH Fair Value Gap', 'BEARISH Fair Value Gap');

  const build = (dimension: NormalizedDimension, reading: NormalizedReading, explanation: string): NormalizedSignal =>
    reading === 'NOT_APPLICABLE' ? { dimension, reading, strength: 0, explanation: '' } : { dimension, reading, strength, explanation };

  return {
    providerId,
    methodologyFamily,
    vocabularySchemaVersion: VOCABULARY_SCHEMA_VERSION,
    signals: [
      build('TREND', trendReading, 'The primary bias hypothesis (Order Blocks/Fair Value Gaps/Liquidity Sweeps synthesis) implies this directional bias.'),
      build('MOMENTUM', 'NOT_APPLICABLE', ''),
      build('LIQUIDITY', liquidityReading, "A detected Liquidity Sweep is this Provider's own native liquidity-event evidence."),
      build('STRUCTURE', structureReading, "A detected Order Block is this Provider's own structural (Institutional Reaction) evidence."),
      build('VOLATILITY', 'NOT_APPLICABLE', ''),
      build('VOLUME', 'NOT_APPLICABLE', ''),
      build('CONFIRMATION', confirmationReading, "A detected Fair Value Gap is this Provider's own confirming imbalance evidence."),
    ],
  };
}
