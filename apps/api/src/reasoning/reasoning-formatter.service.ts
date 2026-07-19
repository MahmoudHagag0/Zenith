import { Injectable } from '@nestjs/common';
import { formatFailureResponse, formatReasoningResponse } from './reasoning-formatter.util';
import type { ReasoningContext, ReasoningDraft, ReasoningResponse } from './reasoning.types';

/** Thin injectable wrapper around the pure formatter functions -- mirrors `NarrativeComposerService`'s wrapper pattern. */
@Injectable()
export class ReasoningFormatterService {
  format(draft: ReasoningDraft, context: ReasoningContext): ReasoningResponse {
    return formatReasoningResponse(draft, context);
  }

  formatFailure(reason: string, context?: ReasoningContext): ReasoningResponse {
    return formatFailureResponse(reason, context);
  }
}
