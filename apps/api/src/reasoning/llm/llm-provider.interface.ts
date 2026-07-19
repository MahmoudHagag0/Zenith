/**
 * A JSON-Schema-like shape describing what a structured LLM response must
 * conform to. Deliberately a small subset of real JSON Schema (object,
 * string, string-array properties only) -- enough to describe every
 * response shape the Reasoning Pipeline needs (`reasoning-prompt-builder.util.ts`),
 * without leaking any provider-specific schema type system (e.g. Gemini's
 * own `Type` enum) outside `GeminiProvider`.
 */
export type LLMJsonSchemaProperty = { readonly type: 'string' } | { readonly type: 'array'; readonly items: { readonly type: 'string' } };

export interface LLMJsonSchema {
  readonly type: 'object';
  readonly properties: Readonly<Record<string, LLMJsonSchemaProperty>>;
  readonly required: readonly string[];
}

/** A single structured-generation request. Provider-agnostic: no field here is Gemini-specific. */
export interface LLMStructuredRequest {
  readonly systemInstruction: string;
  readonly userContent: string;
  readonly responseSchema: LLMJsonSchema;
}

/**
 * The LLM Adapter abstraction (Blueprint Step 8 implementation architecture,
 * §6-§7). Every AI request in Zenith passes through this interface --
 * nothing outside the `llm/` directory is permitted to import a provider
 * SDK directly. `generateStructured()` returns the model's raw JSON text
 * verbatim; parsing, evidence validation, and safety validation all happen
 * one layer up in `ReasoningValidator`/`ReasoningFormatterService`, which
 * never see which provider produced it.
 */
export interface LLMProvider {
  readonly name: string;
  generateStructured(request: LLMStructuredRequest): Promise<string>;
}

export const LLM_PROVIDER = 'LLM_PROVIDER';
