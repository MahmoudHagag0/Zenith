import { Inject, Injectable, Logger } from '@nestjs/common';
import { LLM_PROVIDER, type LLMProvider } from './llm/llm-provider.interface';
import { ReasoningContextService } from './reasoning-context.service';
import { ReasoningPromptBuilderService } from './reasoning-prompt-builder.service';
import { ReasoningValidatorService } from './reasoning-validator.service';
import { ReasoningFormatterService } from './reasoning-formatter.service';
import type { ReasoningContext, ReasoningResponse, ReasoningScope } from './reasoning.types';

/**
 * The Reasoning Pipeline's own top-level entry point (implementation
 * architecture §5-§7 `ReasoningService.answer()`), orchestrating every
 * stage: Context Assembly -> Prompt Construction -> LLM Request ->
 * Response Validation -> Safety Validation -> Structured Response.
 * Mirrors `WorkspaceService`/`MorningBriefService`'s own thin-orchestrator
 * shape -- no stage's logic lives here, only sequencing and honest
 * failure disclosure at every step (Constitution §4.1, matching
 * `WorkspaceService.readingFailureReason`).
 */
@Injectable()
export class ReasoningService {
  private readonly logger = new Logger(ReasoningService.name);

  constructor(
    private readonly contextService: ReasoningContextService,
    private readonly promptBuilder: ReasoningPromptBuilderService,
    @Inject(LLM_PROVIDER) private readonly llmProvider: LLMProvider,
    private readonly validator: ReasoningValidatorService,
    private readonly formatter: ReasoningFormatterService,
  ) {}

  async answer(userId: string, question: string, scope: ReasoningScope): Promise<ReasoningResponse> {
    let context: ReasoningContext;
    try {
      context = await this.buildContext(userId, scope);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Failed to assemble context';
      this.logger.warn(`Reasoning: context assembly failed for user ${userId}: ${reason}`);
      return this.formatter.formatFailure(reason);
    }

    const request = this.promptBuilder.build(context, question);

    let rawText: string;
    try {
      rawText = await this.llmProvider.generateStructured(request);
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'The LLM provider request failed';
      this.logger.warn(`Reasoning: LLM request failed (${this.llmProvider.name}) for user ${userId}: ${reason}`);
      return this.formatter.formatFailure(reason, context);
    }

    const validation = this.validator.validate(rawText, context);
    if (!validation.ok) {
      this.logger.warn(`Reasoning: response rejected for user ${userId}: ${validation.reason}`);
      return this.formatter.formatFailure(validation.reason, context);
    }

    return this.formatter.format(validation.draft, context);
  }

  private buildContext(userId: string, scope: ReasoningScope): Promise<ReasoningContext> {
    if (scope.assetId) {
      return this.contextService.buildInstrumentContext(userId, scope.assetId);
    }
    if (scope.portfolioId) {
      return this.contextService.buildPortfolioContext(userId, scope.portfolioId);
    }
    return this.contextService.buildTrackedAssetsContext(userId);
  }
}
