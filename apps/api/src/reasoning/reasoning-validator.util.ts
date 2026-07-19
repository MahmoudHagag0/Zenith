import { z } from 'zod';
import type { ReasoningContext, ReasoningDraft } from './reasoning.types';

const reasoningDraftSchema = z.object({
  reasoning: z.string().min(1),
  referencedDimensions: z.array(z.string()),
  contradictions: z.array(z.string()),
  suggestedNextSteps: z.array(z.string()),
  uncertaintyNotes: z.array(z.string()),
  behaviorNotes: z.array(z.string()),
});

export type ParseResult = { readonly ok: true; readonly draft: ReasoningDraft } | { readonly ok: false; readonly reason: string };

/** Stage 5a: the model's raw JSON text must parse and conform to the exact shape `REASONING_RESPONSE_SCHEMA` requested -- malformed output is a disclosed failure, never a best-effort partial read. */
export function parseReasoningDraft(rawText: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, reason: 'The model response was not valid JSON' };
  }
  const result = reasoningDraftSchema.safeParse(parsed);
  if (!result.success) {
    return { ok: false, reason: `The model response did not match the required structure: ${result.error.message}` };
  }
  return { ok: true, draft: result.data };
}

/**
 * Stage 5b: Evidence-groundedness (implementation architecture §5).
 * For INSTRUMENT scope, every dimension the model claims to have used must
 * actually be one of the dimensions present in the supplied Confluence
 * reading -- a model naming a dimension that was never in its own context
 * is treated as an ungrounded claim and rejected, never silently dropped.
 * PORTFOLIO/TRACKED_ASSETS scope have no per-dimension breakdown at this
 * layer, so groundedness there is limited to requiring non-empty reasoning
 * -- deliberately not a claim-by-claim fact-checker (that scope of
 * validation is out of scope for this Sprint; disclosed as a known
 * limitation, not silently assumed solved).
 */
export function validateEvidence(draft: ReasoningDraft, context: ReasoningContext): { readonly ok: true } | { readonly ok: false; readonly reason: string } {
  if (draft.reasoning.trim().length === 0) {
    return { ok: false, reason: 'The model produced empty reasoning' };
  }
  if (context.kind === 'INSTRUMENT') {
    if (context.asset.readingFailureReason) {
      // No Confluence reading was available at all -- any referenced dimension is by definition ungrounded.
      if (draft.referencedDimensions.length > 0) {
        return { ok: false, reason: 'The model referenced dimensions despite no Confluence reading being available for this instrument' };
      }
      return { ok: true };
    }
    // Grounded against dimension names AND the lead contributor's own
    // providerId/methodologyFamily -- live verification against the real
    // Gemini API (4/4 runs) showed the model consistently and legitimately
    // cites which Provider/methodology it drew on (e.g. "WYCKOFF",
    // "PRICE_ACTION") in this same field alongside true dimension names.
    // That citation IS grounded (the Provider really is in
    // topContributors) -- rejecting it was a false positive from too
    // narrow a definition of "grounded", not evidence of fabrication.
    const validDimensions = new Set<string>((context.asset.reading?.dimensions ?? []).map((d) => d.dimension));
    for (const contributor of context.asset.reading?.topContributors ?? []) {
      validDimensions.add(contributor.providerId);
      if (contributor.methodologyFamily) validDimensions.add(contributor.methodologyFamily);
    }
    const ungrounded = draft.referencedDimensions.filter((dimension) => !validDimensions.has(dimension));
    if (ungrounded.length > 0) {
      return { ok: false, reason: `The model referenced dimension(s)/provider(s) not present in the supplied context: ${ungrounded.join(', ')}` };
    }
  }
  return { ok: true };
}

// Deliberately conservative and imperative-phrasing-focused rather than a
// bare "buy"/"sell" word ban -- a blanket ban would also reject Zenith's
// own legitimate "no buy or sell signal is present" disclosures (Product
// Rule 9: no-trade is a valid outcome). Every pattern below targets an
// actual recommendation, price level, or advisory framing, matching the
// six categories the Architecture Team named explicitly: BUY, SELL, Entry
// Price, Exit Price, Financial Advice, Trading Signals. False positives
// (over-rejection) are the accepted failure mode, per Constitution §3.1's
// zero-tolerance framing -- never false negatives.
const PROHIBITED_PATTERNS: readonly RegExp[] = [
  /\b(you should|we recommend|i recommend|recommended?)\s+(buy|sell|buying|selling|go(ing)? long|go(ing)? short|enter(ing)?|exit(ing)?)\b/i,
  /\b(buy|sell)\s+(now|this|it|here|immediately)\b/i,
  /\bit(?:'s|\s+is)\s+(a good|the right)\s+time\s+to\s+(buy|sell)\b/i,
  /\bshould\s+(buy|sell)\b/i,
  /\bgo(?:ing)?\s+(long|short)\b/i,
  /\bentry\s*price\b/i,
  /\bexit\s*price\b/i,
  /\btake[\s-]?profit\b/i,
  /\bstop[\s-]?loss\b/i,
  /\bposition\s*siz(e|ing)\b/i,
  /\bfinancial\s+advice\b/i,
  /\btrading\s+signal(s)?\b/i,
  /\b(buy|sell)\s+signal(s)?\b/i,
  /\b(buy|sell|long|short)\s+rating\b/i,
  /\bplace\s+a\s+(buy|sell)\s+order\b/i,
];

/**
 * Stage 6: Safety validation (Constitution §3.1, implementation
 * architecture §5). Deterministic, independent of model behavior -- runs
 * on every response unconditionally, regardless of how well-behaved the
 * system prompt made the model. A single match anywhere rejects the
 * entire response; nothing is silently edited or redacted.
 */
export function validateSafety(draft: ReasoningDraft): { readonly ok: true } | { readonly ok: false; readonly reason: string } {
  const fields: readonly (readonly [string, string])[] = [
    ['reasoning', draft.reasoning],
    ['contradictions', draft.contradictions.join(' ')],
    ['suggestedNextSteps', draft.suggestedNextSteps.join(' ')],
    ['uncertaintyNotes', draft.uncertaintyNotes.join(' ')],
    ['behaviorNotes', draft.behaviorNotes.join(' ')],
  ];
  for (const [fieldName, text] of fields) {
    for (const pattern of PROHIBITED_PATTERNS) {
      if (pattern.test(text)) {
        return { ok: false, reason: `The model's "${fieldName}" field contained prohibited recommendation/advisory language (Constitution §3.1)` };
      }
    }
  }
  return { ok: true };
}
