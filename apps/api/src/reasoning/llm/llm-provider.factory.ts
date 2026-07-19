import type { LLMProvider } from './llm-provider.interface';
import { GeminiProvider } from './gemini.provider';

export interface LlmProviderFactoryLogger {
  error(message: string): void;
}

/**
 * Selects which `LLMProvider` implementation is bound at the LLM_PROVIDER
 * token. Deliberately does NOT follow the Live Data Sprints'
 * mode-flag-with-Simulated-fallback precedent (`createCorporateActionsProvider`
 * et al.) -- the Reasoning Layer's own explicit engineering rules forbid a
 * mocked/fake AI provider under any circumstance. A missing GEMINI_API_KEY
 * is a hard startup failure, disclosed loudly, not a silent degrade to a
 * fabricated response.
 *
 * `LLM_PROVIDER_MODE` exists only so a future second real provider can be
 * added without changing this factory's shape or any consumer -- today
 * `'gemini'` is the only accepted value, per the Architecture Team's
 * development-phase provider selection.
 */
export function createLLMProvider(mode: string | undefined, apiKey: string | undefined, modelId: string | undefined, logger: LlmProviderFactoryLogger): LLMProvider {
  const resolvedMode = mode ?? 'gemini';
  if (resolvedMode !== 'gemini') {
    throw new Error(`Unsupported LLM_PROVIDER_MODE "${resolvedMode}" -- only "gemini" is implemented`);
  }
  if (!apiKey) {
    logger.error('GEMINI_API_KEY is not set -- the Reasoning Layer cannot start without a real LLM provider (no mocked/fake provider is permitted)');
    throw new Error('GEMINI_API_KEY is required to start the Reasoning Layer');
  }
  return new GeminiProvider(apiKey, modelId);
}
