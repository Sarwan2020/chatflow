/**
 * API-related TypeScript type definitions.
 */

/** Supported LLM providers. */
export type LLMProvider = 'openai' | 'anthropic' | 'ollama' | 'router_api';

/** A stored API key (masked in responses). */
export interface APIKey {
  id: number;
  provider: LLMProvider;
  api_key_masked: string;
  is_active: boolean;
  created_at: string;
}

/** Request payload for adding a new API key. */
export interface APIKeyCreateRequest {
  provider: LLMProvider;
  api_key: string;
}

/** Request payload for updating an API key. */
export interface APIKeyUpdateRequest {
  api_key?: string;
  is_active?: boolean;
}

/** An available LLM model. */
export interface LLMModel {
  id: string;
  name: string;
  provider: LLMProvider;
  context_length: number;
}

/** Token usage for a single message. */
export interface TokenUsage {
  id: number;
  user_id: number;
  conversation_id: string;
  message_id: string;
  provider: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  created_at: string;
}

/** Summary of token usage. */
export interface TokenUsageSummary {
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  by_provider: Record<string, number>;
  by_model: Record<string, number>;
}

/** Standard API error response. */
export interface APIError {
  detail: string;
  status_code?: number;
}

/** Paginated response wrapper. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}
