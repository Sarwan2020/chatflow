/**
 * Chat-related TypeScript type definitions.
 */

/** Possible message roles. */
export type MessageRole = 'user' | 'assistant' | 'system';

/** Possible content types for a message. */
export type ContentType = 'text' | 'code' | 'image';

/** AI Provider types */
export type Provider = 'openai' | 'anthropic' | 'ollama' | 'router';

/** Metadata attached to a message (e.g., code language, image URL). */
export interface MessageMetadata {
  language?: string;
  image_url?: string;
  [key: string]: unknown;
}

/** A single message in a conversation. */
export interface Message {
  id: number;
  conversation_id: number;
  role: MessageRole;
  content: string;
  model?: string | null;
  provider?: string | null;
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
  created_at: string;
}

/** Token usage information */
export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

/** A conversation containing messages. */
export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  model?: string | null;
  provider?: string | null;
  created_at: string;
  updated_at: string;
  messages?: Message[];
  message_count?: number;
  last_message?: string | null;
}

/** Request payload for creating a new conversation. */
export interface ConversationCreateRequest {
  title?: string;
  model?: string;
  provider?: string;
}

/** Request payload for updating a conversation. */
export interface ConversationUpdateRequest {
  title?: string;
}

/** Request payload for a chat completion. */
export interface ChatRequest {
  conversation_id?: number | null;
  message: string;
  model: string;
  provider: string;
  temperature?: number;
  max_tokens?: number | null;
  system_prompt?: string | null;
}

/** Response from chat completion */
export interface ChatResponse {
  message: Message;
  conversation_id: number;
  usage: TokenUsage;
}

/** A single chunk from a streaming chat response. */
export interface ChatStreamChunk {
  content: string;
  done: boolean;
  token_count?: number;
}

/** Model information */
export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  context_length?: number | null;
  supports_vision?: boolean;
  supports_function_calling?: boolean;
}

/** Models response */
export interface ModelsResponse {
  models: ModelInfo[];
  providers: string[];
}

/** API Key information */
export interface APIKey {
  id: number;
  user_id: number;
  provider: Provider;
  name?: string | null;
  key_preview: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Request payload for creating an API key */
export interface APIKeyCreateRequest {
  provider: Provider;
  key_value: string;
  name?: string;
}

/** Request payload for updating an API key */
export interface APIKeyUpdateRequest {
  is_active?: boolean;
  name?: string;
}

/** Chat context state. */
export interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  selectedModel: string | null;
  selectedProvider: Provider | null;
}
