/**
 * Chat API service.
 *
 * Functions for conversation and message management.
 * To be implemented in Phase 6 (Chat Interface).
 */

import api from './api'
import type { Conversation, ConversationCreateRequest, Message } from '../types/chat'

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

/** Get messages for a conversation. */
export async function getMessages(conversationId: string): Promise<Message[]> {
  const response = await api.get<Message[]>(`/conversations/${conversationId}/messages`)
  return response.data
}

/** Delete a conversation. */
export async function deleteConversation(conversationId: string): Promise<void> {
  await api.delete(`/conversations/${conversationId}`)
}
