import { REASONING_RESPONSE_SCHEMA, REASONING_SYSTEM_INSTRUCTION, buildReasoningRequest } from './reasoning-prompt-builder.util';
import type { ReasoningContext, WorkspaceSnapshot } from './reasoning.types';

function instrumentContext(overrides: Partial<WorkspaceSnapshot> = {}): ReasoningContext {
  const asset = {
    assetId: 'asset-1',
    symbol: 'EURUSD',
    name: 'Euro / US Dollar',
    readingFailureReason: null,
    reading: {
      assetId: 'asset-1',
      computedAt: new Date().toISOString(),
      dimensions: [{ dimension: 'TREND', aggregateReading: 'BULLISH', disagreement: false }],
      participation: { participatingCount: 9, totalRegistered: 9, nonParticipating: [] },
      topContributors: [],
      netDirection: 'BULLISH',
      relevanceScore: 50,
      agreeingDimensions: 1,
      disagreementDimensions: [],
    },
    news: [],
    upcomingEvents: [],
    cotReports: [],
    alerts: [],
    journalEntries: [],
    ...overrides,
  } as unknown as WorkspaceSnapshot;

  return {
    kind: 'INSTRUMENT',
    scopeDescription: 'EURUSD (Euro / US Dollar) -- single instrument',
    modulesUsed: ['Confluence Engine'],
    generatedAt: new Date().toISOString(),
    asset,
  };
}

describe('REASONING_SYSTEM_INSTRUCTION', () => {
  it('states the BUY/SELL/recommendation prohibition explicitly (Constitution §3.1)', () => {
    expect(REASONING_SYSTEM_INSTRUCTION).toMatch(/never produces BUY\/SELL recommendations/i);
  });

  it('instructs the model never to invent facts outside the supplied context', () => {
    expect(REASONING_SYSTEM_INSTRUCTION).toMatch(/never invent a fact/i);
  });
});

describe('REASONING_RESPONSE_SCHEMA', () => {
  it('requires every ReasoningDraft field and never requests a Confidence value from the model', () => {
    expect(REASONING_RESPONSE_SCHEMA.required).toEqual(
      expect.arrayContaining(['reasoning', 'referencedDimensions', 'contradictions', 'suggestedNextSteps', 'uncertaintyNotes', 'behaviorNotes']),
    );
    expect(REASONING_RESPONSE_SCHEMA.properties).not.toHaveProperty('confidence');
    expect(REASONING_RESPONSE_SCHEMA.properties).not.toHaveProperty('traceability');
  });
});

describe('buildReasoningRequest', () => {
  it('embeds the trader question and the context scope description in the user content', () => {
    const request = buildReasoningRequest(instrumentContext(), 'What does the current reading say?');

    expect(request.userContent).toContain('What does the current reading say?');
    expect(request.userContent).toContain('EURUSD');
    expect(request.systemInstruction).toBe(REASONING_SYSTEM_INSTRUCTION);
    expect(request.responseSchema).toBe(REASONING_RESPONSE_SCHEMA);
  });

  it('discloses a failed Confluence reading in the context text rather than omitting it silently', () => {
    const context = instrumentContext({ readingFailureReason: 'MarketSeries unavailable', reading: null } as Partial<WorkspaceSnapshot>);
    const request = buildReasoningRequest(context, 'Anything to know?');

    expect(request.userContent).toContain('MarketSeries unavailable');
  });
});
