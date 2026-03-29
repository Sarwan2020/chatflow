/**
 * Chat-related TypeScript type definitions.
 */

/** Possible message roles. */
export type MessageRole = 'user' | 'assistant' | 'system';

/** Possible content types for a message. */
export type ContentType = 'text' | 'code' | 'image';

/** Metadata attached to a message (e.g., code language, image URL). */
export interface MessageMetadata {
  language?: string;
  image_url?: string;
  [key: string]: unknown;
}

/** A single message in a conversation. */
export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  content_type: ContentType;
  metadata: MessageMetadata | null;
  token_count: number | null;
  created_at: string;
}

/** A conversation containing messages. */
export interface Conversation {
  id: string;
  user_id: number;
  title: string | null;
  created_at: string;
  updated_at: string;
  messages?: Message[];
  message_count?: number;
}

/** Request payload for creating a new conversation. */
export interface ConversationCreateRequest {
  title?: string;
}

/** Request payload for updating a conversation. */
export interface ConversationUpdateRequest {
  title: string;
}

/** Request payload for sending a new message. */
export interface MessageCreateRequest {
  content: string;
  content_type?: ContentType;
  metadata?: MessageMetadata;
}

/** Request payload for a chat completion. */
export interface ChatRequest {
  conversation_id: string;
  message: string;
  model: string;
  provider: string;
  stream?: boolean;
}

/** A single chunk from a streaming chat response. */
export interface ChatStreamChunk {
  content: string;
  done: boolean;
  token_count?: number;
}

/** Chat context state. */
export interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
}
