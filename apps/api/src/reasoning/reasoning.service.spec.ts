import { Test, TestingModule } from '@nestjs/testing';
import { ReasoningService } from './reasoning.service';
import { ReasoningContextService } from './reasoning-context.service';
import { ReasoningPromptBuilderService } from './reasoning-prompt-builder.service';
import { ReasoningValidatorService } from './reasoning-validator.service';
import { ReasoningFormatterService } from './reasoning-formatter.service';
import { LLM_PROVIDER } from './llm/llm-provider.interface';
import type { ReasoningContext } from './reasoning.types';

const FAKE_CONTEXT: ReasoningContext = {
  kind: 'INSTRUMENT',
  scopeDescription: 'EURUSD',
  modulesUsed: [],
  generatedAt: new Date().toISOString(),
  asset: { assetId: 'a', symbol: 'EURUSD', name: 'Euro / US Dollar', readingFailureReason: null, reading: null, news: [], upcomingEvents: [], cotReports: [], alerts: [], journalEntries: [] } as never,
};

describe('ReasoningService', () => {
  let service: ReasoningService;
  let contextService: { buildInstrumentContext: jest.Mock; buildPortfolioContext: jest.Mock; buildTrackedAssetsContext: jest.Mock };
  let promptBuilder: { build: jest.Mock };
  let llmProvider: { name: string; generateStructured: jest.Mock };
  let validator: { validate: jest.Mock };
  let formatter: { format: jest.Mock; formatFailure: jest.Mock };

  beforeEach(async () => {
    contextService = {
      buildInstrumentContext: jest.fn().mockResolvedValue(FAKE_CONTEXT),
      buildPortfolioContext: jest.fn().mockResolvedValue(FAKE_CONTEXT),
      buildTrackedAssetsContext: jest.fn().mockResolvedValue(FAKE_CONTEXT),
    };
    promptBuilder = { build: jest.fn().mockReturnValue({ systemInstruction: 's', userContent: 'u', responseSchema: { type: 'object', properties: {}, required: [] } }) };
    llmProvider = { name: 'gemini', generateStructured: jest.fn().mockResolvedValue('{"reasoning":"x"}') };
    validator = { validate: jest.fn().mockReturnValue({ ok: true, draft: { reasoning: 'x', referencedDimensions: [], contradictions: [], suggestedNextSteps: [], uncertaintyNotes: [], behaviorNotes: [] } }) };
    formatter = {
      format: jest.fn().mockReturnValue({ reasoning: 'x', failureReason: null }),
      formatFailure: jest.fn().mockImplementation((reason: string) => ({ reasoning: '', failureReason: reason })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReasoningService,
        { provide: ReasoningContextService, useValue: contextService },
        { provide: ReasoningPromptBuilderService, useValue: promptBuilder },
        { provide: LLM_PROVIDER, useValue: llmProvider },
        { provide: ReasoningValidatorService, useValue: validator },
        { provide: ReasoningFormatterService, useValue: formatter },
      ],
    }).compile();

    service = module.get<ReasoningService>(ReasoningService);
  });

  it('defaults to tracked-assets scope when neither assetId nor portfolioId is given', async () => {
    await service.answer('user-1', 'What looks interesting today?', {});
    expect(contextService.buildTrackedAssetsContext).toHaveBeenCalledWith('user-1');
  });

  it('builds instrument scope when assetId is given', async () => {
    await service.answer('user-1', 'q', { assetId: 'asset-1' });
    expect(contextService.buildInstrumentContext).toHaveBeenCalledWith('user-1', 'asset-1');
  });

  it('builds portfolio scope when portfolioId is given', async () => {
    await service.answer('user-1', 'q', { portfolioId: 'portfolio-1' });
    expect(contextService.buildPortfolioContext).toHaveBeenCalledWith('user-1', 'portfolio-1');
  });

  it('returns a formatted response on the happy path', async () => {
    const result = await service.answer('user-1', 'q', { assetId: 'asset-1' });
    expect(result).toEqual({ reasoning: 'x', failureReason: null });
    expect(formatter.format).toHaveBeenCalled();
  });

  it('discloses failure, never throws, when context assembly fails', async () => {
    contextService.buildInstrumentContext.mockRejectedValue(new Error('Asset not found'));
    const result = await service.answer('user-1', 'q', { assetId: 'missing' });
    expect(result).toEqual({ reasoning: '', failureReason: 'Asset not found' });
    expect(llmProvider.generateStructured).not.toHaveBeenCalled();
  });

  it('discloses failure, never throws, when the LLM provider call fails', async () => {
    llmProvider.generateStructured.mockRejectedValue(new Error('Gemini rate limit exceeded'));
    const result = await service.answer('user-1', 'q', { assetId: 'asset-1' });
    expect(result).toEqual({ reasoning: '', failureReason: 'Gemini rate limit exceeded' });
    expect(validator.validate).not.toHaveBeenCalled();
  });

  it('discloses failure, never throws, when validation rejects the response', async () => {
    validator.validate.mockReturnValue({ ok: false, reason: 'prohibited recommendation language' });
    const result = await service.answer('user-1', 'q', { assetId: 'asset-1' });
    expect(result).toEqual({ reasoning: '', failureReason: 'prohibited recommendation language' });
    expect(formatter.format).not.toHaveBeenCalled();
  });
});
