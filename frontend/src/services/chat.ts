/**
 * Chat API service.
 *
 * Functions for conversation and message management.
 */

import api from './api'
import { createFetchSSEConnection, type SSEConnection, type SSECallbacks } from './sse'
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
export async function getConversation(conversationId: string): Promise<Conversation> {
  const response = await api.get<Conversation>(`/conversations/${conversationId}`)
  return response.data
}

/** Update a conversation (e.g., change title). */
export async function updateConversation(
  conversationId: string,
  data: ConversationUpdateRequest
): Promise<Conversation> {
  const response = await api.patch<Conversation>(`/conversations/${conversationId}`, data)
  return response.data
}

/** Delete a conversation. */
export async function deleteConversation(conversationId: string): Promise<void> {
  await api.delete(`/conversations/${conversationId}`)
}

// ============================================================================
// Messages
// ============================================================================

/** Get messages for a conversation. */
export async function getMessages(conversationId: string): Promise<Message[]> {
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

/**
 * Stream a chat message and get real-time response chunks.
 *
 * @param request - Chat request data
 * @param callbacks - SSE event callbacks
 * @returns Promise<SSEConnection> object to manage the stream
 */
export async function streamMessage(
  request: ChatRequest,
  callbacks: SSECallbacks
): Promise<SSEConnection> {
  const token = localStorage.getItem('token')
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  
  // For POST requests with SSE, we need to use fetch directly
  // since EventSource doesn't support POST
  const url = `${baseURL}/chat/stream`
  
  const abortController = new AbortController()
  let isClosed = false
  let isConnected = false

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(request),
      signal: abortController.signal,
    })

    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.statusText}`)
    }

    if (!response.body) {
      throw new Error('Response body is null')
    }

    isConnected = true
    callbacks.onOpen?.()

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    // Process stream in background
    const processStream = async () => {
      try {
        while (!isClosed) {
          const { done, value } = await reader.read()

          if (done) {
            callbacks.onComplete?.()
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              try {
                const message = JSON.parse(data)
                callbacks.onMessage(message)

                if (message.type === 'done' || message.type === 'complete') {
                  callbacks.onComplete?.()
                  isClosed = true
                  break
                }
              } catch (error) {
                console.error('Error parsing SSE message:', error)
              }
            }
          }
        }
      } catch (error) {
        if (!isClosed) {
          callbacks.onError?.(error as Error)
        }
      }
    }

    // Start processing
    processStream()

    return {
      close: () => {
        isClosed = true
        isConnected = false
        abortController.abort()
        reader.cancel()
      },
      isConnected: () => isConnected,
    }
  } catch (error) {
    callbacks.onError?.(error as Error)
    throw error
  }
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
