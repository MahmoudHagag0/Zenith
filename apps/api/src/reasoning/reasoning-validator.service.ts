import { Injectable } from '@nestjs/common';
import { parseReasoningDraft, validateEvidence, validateSafety } from './reasoning-validator.util';
import type { ReasoningContext, ReasoningDraft } from './reasoning.types';

export type ValidationResult = { readonly ok: true; readonly draft: ReasoningDraft } | { readonly ok: false; readonly reason: string };

/**
 * Thin injectable wrapper around the pure validator functions -- mirrors
 * `NarrativeComposerService`'s wrapper pattern. Runs Stage 5 (parse +
 * evidence-groundedness) then Stage 6 (safety) in sequence; the first
 * failure short-circuits, and the model's own raw text is never partially
 * trusted past the stage that rejected it.
 */
@Injectable()
export class ReasoningValidatorService {
  validate(rawText: string, context: ReasoningContext): ValidationResult {
    const parsed = parseReasoningDraft(rawText);
    if (!parsed.ok) {
      return { ok: false, reason: parsed.reason };
    }
    const evidence = validateEvidence(parsed.draft, context);
    if (!evidence.ok) {
      return { ok: false, reason: evidence.reason };
    }
    const safety = validateSafety(parsed.draft);
    if (!safety.ok) {
      return { ok: false, reason: safety.reason };
    }
    return { ok: true, draft: parsed.draft };
  }
}
