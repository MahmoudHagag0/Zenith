import { Injectable } from '@nestjs/common';
import type { LLMStructuredRequest } from './llm/llm-provider.interface';
import { buildReasoningRequest } from './reasoning-prompt-builder.util';
import type { ReasoningContext } from './reasoning.types';

/**
 * Thin injectable wrapper around the pure `buildReasoningRequest()`
 * function -- mirroring `NarrativeComposerService`'s own wrapper around
 * `composeMorningBrief()`. Keeps the deterministic prompt-construction
 * logic independently unit-testable without any NestJS DI machinery.
 */
@Injectable()
export class ReasoningPromptBuilderService {
  build(context: ReasoningContext, question: string): LLMStructuredRequest {
    return buildReasoningRequest(context, question);
  }
}
