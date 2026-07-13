import { Prisma } from '@zenith/database';
import type { MarketSeries } from '../../market-series/market-series.types';
import type {
  AnalysisProvider,
  AnalysisProviderResult,
  ProviderLifecycleState,
  ProviderTier,
} from '../analysis-provider.types';

export type FixtureBehavior = 'SUCCEED' | 'THROW' | 'HANG';

export interface FixtureProviderConfig {
  readonly id: string;
  readonly tier?: ProviderTier;
  readonly lifecycleState?: ProviderLifecycleState;
  readonly dependsOn?: readonly string[];
  readonly timeoutMs?: number;
  readonly delayMs?: number;
  readonly behavior?: FixtureBehavior;
}

/**
 * Test-only `AnalysisProvider` implementation used to exercise the
 * Execution Engine (S1-008 Sprint Brief, Scope item 7). Never registered
 * in `AnalysisEngineModule` and carries no methodology content — the same
 * role synthetic bars play in S1-007's tests.
 */
export class FixtureProvider implements AnalysisProvider {
  readonly id: string;
  readonly computationVersion = '1.0.0';
  readonly lifecycleState: ProviderLifecycleState;
  readonly tier: ProviderTier;
  readonly dependsOn?: readonly string[];
  readonly timeoutMs?: number;

  invocationCount = 0;

  constructor(private readonly config: FixtureProviderConfig) {
    this.id = config.id;
    this.tier = config.tier ?? 'FAST';
    this.lifecycleState = config.lifecycleState ?? 'ACTIVE';
    this.dependsOn = config.dependsOn;
    this.timeoutMs = config.timeoutMs;
  }

  async analyze(_series: MarketSeries): Promise<AnalysisProviderResult> {
    this.invocationCount += 1;
    if (this.config.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, this.config.delayMs));
    }
    const behavior = this.config.behavior ?? 'SUCCEED';
    if (behavior === 'HANG') {
      await new Promise<never>(() => {
        /* never resolves — exercises the Execution Engine's own timeout */
      });
    }
    if (behavior === 'THROW') {
      throw new Error(`${this.id} fixture configured to throw`);
    }
    return {
      contractVersion: '1.0.0',
      evidence: { detectedConditions: [], missingConditions: [], supporting: [], conflicting: [] },
      interpretation: [
        {
          summary: `${this.id} fixture interpretation`,
          confidence: { kind: 'INTERPRETATION', value: new Prisma.Decimal(50), explanation: 'Fixture stub confidence.' },
          regimeAdjustedConfidence: { kind: 'REGIME_ADJUSTED', value: new Prisma.Decimal(50), explanation: 'Fixture stub confidence.' },
        },
      ],
      limitations: { dataQuality: 'COMPLETE', assumptions: [], notes: [] },
      traceability: {
        rawDataReferences: [],
        intermediateCalculations: [],
        conditionDerivations: [],
        confidenceDerivation: 'Fixture stub — not a real Provider.',
      },
      detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(50), explanation: 'Fixture stub confidence.' },
      methodologyConfidenceCeiling: { kind: 'METHODOLOGY_CEILING', value: new Prisma.Decimal(100), explanation: 'Fixture stub — no real ceiling.' },
    };
  }

  normalize(): void {
    // No-op placeholder — see AnalysisProvider.normalize()'s doc comment.
  }
}
