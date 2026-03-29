/**
 * Chat API service.
 *
 * Functions for conversation and message management.
 */

import api from './api'
import type {
  Conversation,
  ConversationCreateRequest,
  ConversationUpdateRequest,
  Message,
  ChatRequest,
  ChatResponse,
  ModelsResponse,
  APIKey,
  APIKeyCreateRequest,
  APIKeyUpdateRequest
} from '../types/chat'

// ============================================================================
// Conversations
// ============================================================================

/** List all conversations for the current user. */
export async function getConversations(): Promise<Conversation[]> {
  const response = await api.get<Conversation[]>('/conversations')
  return response.data
}

/** Create a new conversation. */
export async function createConversation(data: ConversationCreateRequest): Promise<Conversation> {
  const response = await api.post<Conversation>('/conversations', data)
  return response.data
}

/** Get a specific conversation with all messages. */
export async function getConversation(conversationId: number): Promise<Conversation> {
  const response = await api.get<Conversation>(`/conversations/${conversationId}`)
  return response.data
}

/** Update a conversation (e.g., change title). */
export async function updateConversation(
  conversationId: number,
  data: ConversationUpdateRequest
): Promise<Conversation> {
  const response = await api.patch<Conversation>(`/conversations/${conversationId}`, data)
  return response.data
}

/** Delete a conversation. */
export async function deleteConversation(conversationId: number): Promise<void> {
  await api.delete(`/conversations/${conversationId}`)
}

// ============================================================================
// Messages
// ============================================================================

/** Get messages for a conversation. */
export async function getMessages(conversationId: number): Promise<Message[]> {
  const conversation = await getConversation(conversationId)
  return conversation.messages || []
}

// ============================================================================
// Chat
// ============================================================================

/** Send a chat message and get a response. */
export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  const response = await api.post<ChatResponse>('/chat/complete', request)
  return response.data
}

/** Get available models based on user's API keys. */
export async function getAvailableModels(): Promise<ModelsResponse> {
  const response = await api.get<ModelsResponse>('/chat/models')
  return response.data
}

// ============================================================================
// API Keys
// ============================================================================

/** List all API keys for the current user (with masked values). */
export async function getAPIKeys(): Promise<APIKey[]> {
  const response = await api.get<APIKey[]>('/keys')
  return response.data
}

/** Add a new API key. */
export async function createAPIKey(data: APIKeyCreateRequest): Promise<APIKey> {
  const response = await api.post<APIKey>('/keys', data)
  return response.data
}

/** Update an API key (toggle active status or change name). */
export async function updateAPIKey(keyId: number, data: APIKeyUpdateRequest): Promise<APIKey> {
  const response = await api.patch<APIKey>(`/keys/${keyId}`, data)
  return response.data
}

/** Delete an API key. */
export async function deleteAPIKey(keyId: number): Promise<void> {
  await api.delete(`/keys/${keyId}`)
}
