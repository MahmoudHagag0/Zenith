import { Prisma } from '@zenith/database';
import { MAX_MORNING_BRIEF_ENTRIES, buildConfidenceExplanation, buildStory, buildUncertaintyExplanation, buildWhy, composeMorningBrief } from './narrative-composer.util';
import type { ContributingProviderView, DecisionCenterResponse, InstrumentReading, RankedOpportunity } from '../dashboard/dashboard.types';

function confidence(value: number, explanation: string): ContributingProviderView['interpretationConfidence'] {
  return { kind: 'INTERPRETATION', value: new Prisma.Decimal(value), explanation };
}

function contributor(overrides: Partial<ContributingProviderView> = {}): ContributingProviderView {
  return {
    providerId: 'WYCKOFF',
    methodologyFamily: 'WYCKOFF',
    interpretationSummary: 'A Spring event in the trading range.',
    detectionConfidence: { kind: 'DETECTION', value: new Prisma.Decimal(80), explanation: 'detection explanation' },
    interpretationConfidence: confidence(75, 'interpretation explanation'),
    regimeAdjustedConfidence: { kind: 'REGIME_ADJUSTED', value: new Prisma.Decimal(70), explanation: 'regime explanation' },
    methodologyConfidenceCeiling: { kind: 'METHODOLOGY_CEILING', value: new Prisma.Decimal(85), explanation: 'ceiling explanation' },
    uncertainty: { dataQuality: 'COMPLETE', assumptions: [], notes: [] },
    traceability: { rawDataReferences: [], intermediateCalculations: [], conditionDerivations: [], confidenceDerivation: '' },
    ...overrides,
  };
}

function reading(overrides: Partial<InstrumentReading> = {}): InstrumentReading {
  return {
    assetId: 'asset-1',
    computedAt: new Date().toISOString(),
    dimensions: [],
    participation: { participatingCount: 9, totalRegistered: 9, nonParticipating: [] },
    topContributors: [contributor()],
    netDirection: 'BULLISH',
    relevanceScore: 50,
    agreeingDimensions: 4,
    disagreementDimensions: [],
    ...overrides,
  };
}

function opportunity(overrides: Partial<RankedOpportunity> = {}): RankedOpportunity {
  return {
    assetId: 'asset-1',
    symbol: 'AAPL',
    marketName: 'NASDAQ',
    netDirection: 'BULLISH',
    relevanceScore: 50,
    agreeingDimensions: 4,
    disagreementPresent: false,
    reading: reading(),
    ...overrides,
  };
}

function decisionCenter(overrides: Partial<DecisionCenterResponse> = {}): DecisionCenterResponse {
  return {
    readiness: 'OPPORTUNITIES_AVAILABLE',
    generatedAt: new Date().toISOString(),
    instrumentsConsidered: 1,
    instrumentsFailed: [],
    opportunities: [opportunity()],
    ...overrides,
  };
}

describe('narrative-composer.util (S1-020 WP1)', () => {
  describe('buildStory', () => {
    it('leads with direction and evidence-count, no disagreement clause when none present', () => {
      expect(buildStory(opportunity({ netDirection: 'BULLISH', agreeingDimensions: 4, disagreementPresent: false })))
        .toBe('AAPL is showing a bullish bias, agreeing across 4 of the seven Confluence dimensions.');
    });

    it('appends a disagreement clause when disagreementPresent is true', () => {
      expect(buildStory(opportunity({ netDirection: 'BEARISH', agreeingDimensions: 3, disagreementPresent: true })))
        .toBe('AAPL is showing a bearish bias, agreeing across 3 of the seven Confluence dimensions, with at least one dimension in disagreement.');
    });
  });

  describe('buildWhy', () => {
    it('quotes the lead contributor own interpretationSummary verbatim, naming its methodology family', () => {
      expect(buildWhy(contributor({ methodologyFamily: 'ICT_SMC', interpretationSummary: 'Bullish Order Block reaction.' })))
        .toBe('The strongest currently-available evidence comes from ICT_SMC: Bullish Order Block reaction.');
    });

    it('falls back to providerId when methodologyFamily is undefined', () => {
      expect(buildWhy(contributor({ providerId: 'VSA', methodologyFamily: undefined }))).toContain('from VSA:');
    });

    it('discloses the absence of any contributor honestly, never fabricating a reading', () => {
      expect(buildWhy(undefined)).toBe('No contributing Provider produced an interpretation for this instrument.');
    });
  });

  describe('buildConfidenceExplanation', () => {
    it('names the INTERPRETATION confidence and quotes its own explanation, plus the methodology ceiling', () => {
      const text = buildConfidenceExplanation(contributor());
      expect(text).toContain('Interpretation confidence is rated 75 out of 100 -- interpretation explanation');
      expect(text).toContain('methodology confidence ceiling is 85 -- ceiling explanation');
    });

    it('discloses the absence of any contributor honestly, never fabricating a confidence value', () => {
      expect(buildConfidenceExplanation(undefined)).toBe('No confidence figure is available without a contributing Provider.');
    });
  });

  describe('buildUncertaintyExplanation', () => {
    it('discloses disagreement dimensions when present', () => {
      const r = reading({ disagreementDimensions: ['TREND', 'MOMENTUM'] });
      expect(buildUncertaintyExplanation(r, contributor())).toContain('2 of 7 dimensions disagree with this reading\'s own net direction (TREND, MOMENTUM).');
    });

    it('discloses non-participating Provider counts when present', () => {
      const r = reading({ participation: { participatingCount: 7, totalRegistered: 9, nonParticipating: [{ providerId: 'X', reason: 'TIMEOUT', detail: 'slow' }, { providerId: 'Y', reason: 'ERROR', detail: 'boom' }] } });
      expect(buildUncertaintyExplanation(r, contributor())).toContain('2 of 9 registered Providers did not participate in this reading.');
    });

    it('discloses non-COMPLETE data quality and Limitations notes', () => {
      const c = contributor({ uncertainty: { dataQuality: 'GAPS_PRESENT', assumptions: [], notes: ['Recent history has missing candles.'] } });
      const text = buildUncertaintyExplanation(reading(), c);
      expect(text).toContain('Underlying data quality is gaps present.');
      expect(text).toContain('Recent history has missing candles.');
    });

    it('falls back to an explicit "no material uncertainty" statement when nothing else applies, never leaving uncertainty silently blank', () => {
      expect(buildUncertaintyExplanation(reading(), contributor())).toBe('No material uncertainty beyond the disclosed confidence figures above was reported.');
    });

    it('handles a missing lead contributor without crashing', () => {
      expect(() => buildUncertaintyExplanation(reading(), undefined)).not.toThrow();
    });
  });

  describe('composeMorningBrief', () => {
    it('bounds entries to MAX_MORNING_BRIEF_ENTRIES, reusing the existing rank order verbatim, never re-ranking', () => {
      const opportunities = Array.from({ length: 7 }, (_, i) => opportunity({ assetId: `a${i}`, symbol: `SYM${i}` }));
      const result = composeMorningBrief(decisionCenter({ opportunities, instrumentsConsidered: 7 }));
      expect(result.entries).toHaveLength(MAX_MORNING_BRIEF_ENTRIES);
      expect(result.entries.map((e) => e.symbol)).toEqual(['SYM0', 'SYM1', 'SYM2', 'SYM3', 'SYM4']);
    });

    it('omits noTradeNarrative when opportunities are available', () => {
      const result = composeMorningBrief(decisionCenter());
      expect(result.noTradeNarrative).toBeUndefined();
      expect(result.headline).toContain('directional bias worth reviewing');
    });

    it('produces a calm, first-class No Trade narrative for NO_CLEAR_OPPORTUNITY with tracked instruments', () => {
      const result = composeMorningBrief(decisionCenter({ readiness: 'NO_CLEAR_OPPORTUNITY', opportunities: [], instrumentsConsidered: 3 }));
      expect(result.entries).toEqual([]);
      expect(result.noTradeNarrative).toContain('No trade is the correct decision right now.');
      expect(result.headline).toContain('none of your 3 tracked instrument(s)');
    });

    it('produces a distinct narrative for zero tracked instruments, never conflated with "nothing qualifies"', () => {
      const result = composeMorningBrief(decisionCenter({ readiness: 'NO_CLEAR_OPPORTUNITY', opportunities: [], instrumentsConsidered: 0 }));
      expect(result.noTradeNarrative).toContain('not currently tracking any instruments');
      expect(result.headline).toBe('No instruments are currently tracked.');
    });

    it('produces a DEGRADED narrative distinct from NO_CLEAR_OPPORTUNITY, never implying "no trade" was the finding', () => {
      const result = composeMorningBrief(decisionCenter({ readiness: 'DEGRADED', opportunities: [], instrumentsConsidered: 0, instrumentsFailed: [{ assetId: 'a1', reason: 'db timeout' }] }));
      expect(result.noTradeNarrative).toContain('evidence could not be computed');
      expect(result.noTradeNarrative).not.toContain('No trade is the correct decision');
      expect(result.headline).toContain("Unable to generate today's Morning Brief");
    });

    it('appends an honest failure note to the headline whenever any instrument failed, regardless of readiness', () => {
      const result = composeMorningBrief(decisionCenter({ instrumentsFailed: [{ assetId: 'a9', reason: 'boom' }] }));
      expect(result.headline).toContain('1 instrument(s) could not be evaluated this session.');
    });

    it('passes generatedAt/instrumentsConsidered/instrumentsFailed through unmodified', () => {
      const dc = decisionCenter({ generatedAt: '2026-01-01T00:00:00.000Z', instrumentsConsidered: 42, instrumentsFailed: [{ assetId: 'z', reason: 'r' }] });
      const result = composeMorningBrief(dc);
      expect(result.generatedAt).toBe('2026-01-01T00:00:00.000Z');
      expect(result.instrumentsConsidered).toBe(42);
      expect(result.instrumentsFailed).toEqual([{ assetId: 'z', reason: 'r' }]);
    });
  });
});
