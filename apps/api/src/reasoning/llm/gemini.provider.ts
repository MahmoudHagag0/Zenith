import { GoogleGenAI, ApiError } from '@google/genai';
import { Injectable, Logger } from '@nestjs/common';
import type { LLMProvider, LLMStructuredRequest } from './llm-provider.interface';
import { withRetry } from '../../market-data/retry.util';
import { ProviderRateLimitedError, ProviderUnavailableError } from '../../market-data/providers/provider-errors';

const DEFAULT_MODEL_ID = 'gemini-2.0-flash';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_BASE_DELAY_MS = 500;

/**
 * The sole `LLMProvider` implementation for the development phase
 * (Architecture Team decision: Google Gemini API, Free Tier -- provider
 * selection only, the `LLMProvider` abstraction itself remains
 * provider-agnostic). Every Gemini-specific detail -- the `@google/genai`
 * SDK, its request/response envelope, its own `responseJsonSchema`/
 * `responseMimeType` config fields, and its default model ID -- is
 * isolated inside this one file. Nothing outside `reasoning/llm/` may
 * import `@google/genai` directly (enforced by convention, mirroring
 * every prior Live Data provider's own vendor-isolation precedent, e.g.
 * `FinnhubCorporateActionsProvider`).
 *
 * Reuses the existing vendor-agnostic `withRetry` (S1-005) and the
 * existing `ProviderRateLimitedError`/`ProviderUnavailableError`
 * classification (L1-001) rather than duplicating retry/backoff logic --
 * the same failure-isolation reasoning `MarketDataHttpClient` already
 * documents applies identically to an outbound call to a generative
 * model.
 */
@Injectable()
export class GeminiProvider implements LLMProvider {
  readonly name = 'gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenAI;

  constructor(
    apiKey: string,
    private readonly modelId: string = DEFAULT_MODEL_ID,
  ) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateStructured(request: LLMStructuredRequest): Promise<string> {
    const result = await withRetry(() => this.callModel(request), {
      retries: DEFAULT_RETRIES,
      baseDelayMs: DEFAULT_BASE_DELAY_MS,
      isRetryable: (error) => error instanceof ProviderRateLimitedError || error instanceof ProviderUnavailableError,
      onRetry: () => this.logger.warn('Retrying Gemini request after a retryable failure'),
    });
    return result;
  }

  private async callModel(request: LLMStructuredRequest): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
    try {
      const response = await this.client.models.generateContent({
        model: this.modelId,
        contents: request.userContent,
        config: {
          systemInstruction: request.systemInstruction,
          responseMimeType: 'application/json',
          // A raw JSON Schema object is accepted as-is (Gemini SDK's own
          // `responseJsonSchema` field) -- `LLMStructuredRequest.responseSchema`
          // is deliberately defined as a valid JSON Schema subset already,
          // so no provider-specific translation is needed here.
          responseJsonSchema: request.responseSchema,
          abortSignal: controller.signal,
        },
      });
      const text = response.text;
      if (!text) {
        throw new ProviderUnavailableError('Gemini returned an empty response');
      }
      return text;
    } catch (error) {
      throw this.classifyError(error);
    } finally {
      clearTimeout(timeout);
    }
  }

  private classifyError(error: unknown): Error {
    if (error instanceof ProviderUnavailableError || error instanceof ProviderRateLimitedError) {
      return error;
    }
    if (error instanceof ApiError) {
      if (error.status === 429) {
        return new ProviderRateLimitedError(`Gemini rate limit exceeded: ${error.message}`);
      }
      if (error.status >= 500) {
        return new ProviderUnavailableError(`Gemini temporarily unavailable (${error.status}): ${error.message}`);
      }
      // 4xx other than 429 (bad request, invalid key, permission denied) is
      // never retryable -- surfaced as-is rather than reclassified.
      return error;
    }
    if (error instanceof Error && error.name === 'AbortError') {
      return new ProviderUnavailableError('Gemini request timed out');
    }
    return error instanceof Error ? error : new Error('Unknown Gemini provider error');
  }
}
