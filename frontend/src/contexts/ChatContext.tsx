/**
 * ChatContext - Global chat state management.
 *
 * Provides conversation list, active conversation, messages,
 * and streaming state across the application.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type {
  ChatState,
  Conversation,
  Message,
  ChatRequest,
  Provider
} from '../types/chat'
import * as chatService from '../services/chat'
import { useAuth } from '../hooks/useAuth'

interface ChatContextValue extends ChatState {
  loadConversations: () => Promise<void>
  createNewConversation: (title?: string, model?: string, provider?: string) => Promise<Conversation>
  switchConversation: (conversationId: string) => Promise<void>
  sendMessage: (message: string, model: string, provider: string, temperature?: number) => Promise<void>
  deleteConversation: (conversationId: string) => Promise<void>
  updateConversationTitle: (conversationId: string, title: string) => Promise<void>
  setSelectedModel: (model: string | null) => void
  setSelectedProvider: (provider: Provider | null) => void
  clearError: () => void
}

const ChatContext = createContext<ChatContextValue | null>(null)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true)
      const convs = await chatService.getConversations()
      setConversations(convs)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load conversations')
      console.error('Error loading conversations:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createNewConversation = useCallback(async (
    title?: string,
    model?: string,
    provider?: string
  ): Promise<Conversation> => {
    try {
      setIsLoading(true)
      const newConv = await chatService.createConversation({
        title: title || 'New Conversation',
        model,
        provider
      })
      setConversations(prev => [newConv, ...prev])
      setActiveConversation(newConv)
      setMessages([])
      setError(null)
      return newConv
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create conversation')
      console.error('Error creating conversation:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const switchConversation = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true)
      const conv = await chatService.getConversation(conversationId)
      setActiveConversation(conv)
      setMessages(conv.messages || [])
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load conversation')
      console.error('Error switching conversation:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const sendMessage = useCallback(async (
    message: string,
    model: string,
    provider: string,
    temperature: number = 0.7
  ) => {
    try {
      setIsLoading(true)
      setError(null)

      const request: ChatRequest = {
        conversation_id: activeConversation?.id || null,
        message,
        model,
        provider,
        temperature
      }

      const response = await chatService.sendMessage(request)

      // Update messages
      const userMessage: Message = {
        id: `temp-${Date.now()}`, // Temporary ID
        conversation_id: response.conversation_id,
        role: 'user',
        content: message,
        model,
        provider,
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev, userMessage, response.message])

      // Update or create conversation
      if (!activeConversation || activeConversation.id !== response.conversation_id) {
        const conv = await chatService.getConversation(response.conversation_id)
        setActiveConversation(conv)
        setConversations(prev => {
          const filtered = prev.filter(c => c.id !== response.conversation_id)
          return [conv, ...filtered]
        })
      } else {
        // Update conversation in list
        setConversations(prev =>
          prev.map(c =>
            c.id === response.conversation_id
              ? { ...c, updated_at: new Date().toISOString() }
              : c
          )
        )
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send message')
      console.error('Error sending message:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [activeConversation])

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true)
      await chatService.deleteConversation(conversationId)
      setConversations(prev => prev.filter(c => c.id !== conversationId))
      
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null)
        setMessages([])
      }
      
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete conversation')
      console.error('Error deleting conversation:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [activeConversation])

  const updateConversationTitle = useCallback(async (conversationId: string, title: string) => {
    try {
      const updated = await chatService.updateConversation(conversationId, { title })
      setConversations(prev =>
        prev.map(c => (c.id === conversationId ? updated : c))
      )
      if (activeConversation?.id === conversationId) {
        setActiveConversation(updated)
      }
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update conversation')
      console.error('Error updating conversation:', err)
      throw err
    }
  }, [activeConversation])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value: ChatContextValue = {
    conversations,
    activeConversation,
    messages,
    isLoading,
    isStreaming,
    error,
    selectedModel,
    selectedProvider,
    loadConversations,
    createNewConversation,
    switchConversation,
    sendMessage,
    deleteConversation,
    updateConversationTitle,
    setSelectedModel,
    setSelectedProvider,
    clearError
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

export { ChatContext }
