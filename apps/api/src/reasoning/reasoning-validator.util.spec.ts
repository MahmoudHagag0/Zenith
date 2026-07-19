import { parseReasoningDraft, validateEvidence, validateSafety } from './reasoning-validator.util';
import type { ReasoningContext, ReasoningDraft, WorkspaceSnapshot } from './reasoning.types';

function draft(overrides: Partial<ReasoningDraft> = {}): ReasoningDraft {
  return {
    reasoning: 'TREND and MOMENTUM agree on a bullish reading, supported by two Providers.',
    referencedDimensions: ['TREND', 'MOMENTUM'],
    contradictions: [],
    suggestedNextSteps: ['Review your Journal entries for this instrument.'],
    uncertaintyNotes: ['One dimension has no participating Provider.'],
    behaviorNotes: [],
    ...overrides,
  };
}

function workspaceSnapshot(overrides: Partial<WorkspaceSnapshot> = {}): WorkspaceSnapshot {
  return {
    assetId: 'asset-1',
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    readingFailureReason: null,
    reading: {
      assetId: 'asset-1',
      computedAt: new Date().toISOString(),
      dimensions: [
        { dimension: 'TREND', aggregateReading: 'BULLISH', disagreement: false },
        { dimension: 'MOMENTUM', aggregateReading: 'BULLISH', disagreement: false },
      ],
      participation: { participatingCount: 9, totalRegistered: 9, nonParticipating: [] },
      topContributors: [],
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
    ...overrides,
  } as WorkspaceSnapshot;
}

function instrumentContext(overrides: Partial<WorkspaceSnapshot> = {}): ReasoningContext {
  return {
    kind: 'INSTRUMENT',
    scopeDescription: 'EURUSD -- single instrument',
    modulesUsed: ['Confluence Engine'],
    generatedAt: new Date().toISOString(),
    asset: workspaceSnapshot(overrides),
  };
}

describe('parseReasoningDraft', () => {
  it('rejects text that is not valid JSON', () => {
    const result = parseReasoningDraft('not json');
    expect(result.ok).toBe(false);
  });

  it('rejects JSON missing a required field', () => {
    const result = parseReasoningDraft(JSON.stringify({ reasoning: 'x' }));
    expect(result.ok).toBe(false);
  });

  it('accepts well-formed JSON matching the draft shape', () => {
    const result = parseReasoningDraft(JSON.stringify(draft()));
    expect(result.ok).toBe(true);
  });
});

describe('validateEvidence', () => {
  it('accepts dimensions that are present in the supplied context', () => {
    const result = validateEvidence(draft(), instrumentContext());
    expect(result.ok).toBe(true);
  });

  it('rejects a dimension the model named that was never in its own context', () => {
    const result = validateEvidence(draft({ referencedDimensions: ['TREND', 'LIQUIDITY'] }), instrumentContext());
    expect(result.ok).toBe(false);
  });

  it('rejects any referenced dimension when the Confluence reading itself failed', () => {
    const context = instrumentContext({ readingFailureReason: 'MarketSeries unavailable', reading: null });
    const result = validateEvidence(draft(), context);
    expect(result.ok).toBe(false);
  });

  it('rejects empty reasoning regardless of scope', () => {
    const result = validateEvidence(draft({ reasoning: '   ' }), instrumentContext());
    expect(result.ok).toBe(false);
  });
});

describe('validateSafety', () => {
  it('accepts calm, evidence-only reasoning with no recommendation language', () => {
    const result = validateSafety(draft());
    expect(result.ok).toBe(true);
  });

  it('accepts an honest "no clear opportunity" disclosure that merely mentions buy/sell as nouns', () => {
    const result = validateSafety(draft({ reasoning: 'No clear buy or sell signal is present; the dimensions disagree.' }));
    // "trading signal"/"buy signal"/"sell signal" phrasing is intentionally
    // still rejected even in a negation, per the Architecture Team's
    // explicit zero-tolerance instruction -- documented as a deliberate
    // over-rejection trade-off in reasoning-validator.util.ts.
    expect(result.ok).toBe(false);
  });

  it.each([
    'You should buy EURUSD now.',
    'We recommend selling this instrument.',
    'It is a good time to buy.',
    'Consider going long here.',
    'Set your entry price at 1.0950.',
    'Your exit price should be 1.1050.',
    'Use a stop loss of 20 pips.',
    'Take profit at the next resistance level.',
    'This is not financial advice, but you should buy.',
    'Position sizing should be 2% of your account.',
    'Place a buy order immediately.',
  ])('rejects prohibited recommendation language: %s', (reasoning) => {
    const result = validateSafety(draft({ reasoning }));
    expect(result.ok).toBe(false);
  });

  it('checks every field, not only reasoning', () => {
    const result = validateSafety(draft({ suggestedNextSteps: ['You should buy this instrument.'] }));
    expect(result.ok).toBe(false);
  });
});
