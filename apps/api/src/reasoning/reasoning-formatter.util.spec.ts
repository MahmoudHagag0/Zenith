import { Prisma } from '@zenith/database';
import { formatFailureResponse, formatReasoningResponse } from './reasoning-formatter.util';
import type { ReasoningContext, ReasoningDraft, WorkspaceSnapshot } from './reasoning.types';

function draft(overrides: Partial<ReasoningDraft> = {}): ReasoningDraft {
  return {
    reasoning: 'TREND and MOMENTUM agree on a bullish reading.',
    referencedDimensions: ['TREND', 'MOMENTUM'],
    contradictions: [],
    suggestedNextSteps: [],
    uncertaintyNotes: [],
    behaviorNotes: [],
    ...overrides,
  };
}

function instrumentContext(asset: WorkspaceSnapshot): ReasoningContext {
  return {
    kind: 'INSTRUMENT',
    scopeDescription: 'EURUSD',
    modulesUsed: ['Confluence Engine'],
    generatedAt: new Date().toISOString(),
    asset,
  };
}

describe('formatReasoningResponse', () => {
  it("passes through the lead contributor's full four-part Confidence taxonomy, never collapsed", () => {
    const asset = {
      assetId: 'asset-1',
      symbol: 'EURUSD',
      name: 'Euro / US Dollar',
      readingFailureReason: null,
      reading: {
        assetId: 'asset-1',
        computedAt: new Date().toISOString(),
        dimensions: [],
        participation: { participatingCount: 9, totalRegistered: 9, nonParticipating: [] },
        topContributors: [
          {
            providerId: 'WYCKOFF',
            methodologyFamily: 'WYCKOFF',
            interpretationSummary: 'A Spring event.',
            detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(80), explanation: 'd' },
            interpretationConfidence: { kind: 'INTERPRETATION', value: new Prisma.Decimal(75), explanation: 'i' },
            regimeAdjustedConfidence: { kind: 'REGIME_ADJUSTED', value: new Prisma.Decimal(70), explanation: 'r' },
            methodologyConfidenceCeiling: { kind: 'METHODOLOGY_CEILING', value: new Prisma.Decimal(85), explanation: 'c' },
            uncertainty: { dataQuality: 'COMPLETE', assumptions: [], notes: [] },
            traceability: { rawDataReferences: ['ref-1'], intermediateCalculations: [], conditionDerivations: [], confidenceDerivation: 'x' },
          },
        ],
        netDirection: 'BULLISH',
        relevanceScore: 50,
        agreeingDimensions: 2,
        disagreementDimensions: [],
      },
      news: [],
      upcomingEvents: [],
      cotReports: [],
      alerts: [],
      journalEntries: [],
    } as unknown as WorkspaceSnapshot;

    const response = formatReasoningResponse(draft(), instrumentContext(asset));

    expect(response.confidence).toHaveLength(4);
    expect(response.confidence.map((c) => c.kind)).toEqual(['DETECTION', 'INTERPRETATION', 'REGIME_ADJUSTED', 'METHODOLOGY_CEILING']);
    expect(response.evidence).toHaveLength(1);
    expect(response.failureReason).toBeNull();
  });

  it('discloses a MISSING data quality when the Confluence reading itself failed, never fabricating Confidence', () => {
    const asset = {
      assetId: 'asset-1',
      symbol: 'EURUSD',
      name: 'Euro / US Dollar',
      readingFailureReason: 'MarketSeries unavailable',
      reading: null,
      news: [],
      upcomingEvents: [],
      cotReports: [],
      alerts: [],
      journalEntries: [],
    } as unknown as WorkspaceSnapshot;

    const response = formatReasoningResponse(draft({ referencedDimensions: [] }), instrumentContext(asset));

    expect(response.confidence).toEqual([]);
    expect(response.uncertainty.dataQuality).toBe('MISSING');
  });
});

describe('formatFailureResponse', () => {
  it('discloses the failure reason and leaves every other field empty/neutral', () => {
    const response = formatFailureResponse('The LLM provider request failed');

    expect(response.failureReason).toBe('The LLM provider request failed');
    expect(response.reasoning).toBe('');
    expect(response.confidence).toEqual([]);
    expect(response.evidence).toEqual([]);
  });
});
