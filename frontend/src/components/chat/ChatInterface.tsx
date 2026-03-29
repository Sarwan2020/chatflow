/**
 * ChatInterface component.
 *
 * Main chat container that combines MessageList and MessageInput.
 */

import React, { useState, useEffect } from 'react'
import { useChat } from '../../contexts/ChatContext'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import { getAvailableModels } from '../../services/chat'
import type { ModelInfo, Provider } from '../../types/chat'

export default function ChatInterface() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    selectedModel,
    selectedProvider,
    setSelectedModel,
    setSelectedProvider,
    clearError
  } = useChat()

  const [models, setModels] = useState<ModelInfo[]>([])
  const [loadingModels, setLoadingModels] = useState(false)

  // Load available models
  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    try {
      setLoadingModels(true)
      const response = await getAvailableModels()
      setModels(response.models)
      
      // Set default model if not selected
      if (!selectedModel && response.models.length > 0) {
        setSelectedModel(response.models[0].id)
        setSelectedProvider(response.models[0].provider as Provider)
      }
    } catch (err) {
      console.error('Error loading models:', err)
    } finally {
      setLoadingModels(false)
    }
  }

  const handleSendMessage = async (message: string) => {
    if (!selectedModel || !selectedProvider) {
      alert('Please select a model first')
      return
    }

    try {
      await sendMessage(message, selectedModel, selectedProvider)
    } catch (err) {
      console.error('Error sending message:', err)
    }
  }

  const handleModelChange = (modelId: string) => {
    const model = models.find(m => m.id === modelId)
    if (model) {
      setSelectedModel(model.id)
      setSelectedProvider(model.provider as Provider)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header with model selector */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Chat
          </h2>
          
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">Model:</label>
            <select
              value={selectedModel || ''}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={loadingModels || models.length === 0}
              className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {models.length === 0 ? (
                <option value="">No models available</option>
              ) : (
                models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name} ({model.provider})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {models.length === 0 && !loadingModels && (
          <div className="mt-2 text-sm text-amber-600 dark:text-amber-400">
            No models available. Please add API keys in settings.
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Input */}
      <MessageInput
        onSend={handleSendMessage}
        disabled={isLoading || !selectedModel || models.length === 0}
        placeholder={
          models.length === 0
            ? 'Add API keys to start chatting...'
            : 'Type your message...'
        }
      />
    </div>
  )
}
