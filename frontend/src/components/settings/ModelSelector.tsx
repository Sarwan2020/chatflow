/**
 * ModelSelector component.
 *
 * Dropdown for selecting default LLM provider and model with detailed info.
 */

import React, { useState, useEffect } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import * as chatService from '../../services/chat'
import type { ModelInfo, ModelsResponse } from '../../types/chat'

export default function ModelSelector() {
  const { modelPreferences, updateModelPreferences } = useSettings()
  const [models, setModels] = useState<ModelInfo[]>([])
  const [providers, setProviders] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState<string>(
    modelPreferences.defaultProvider || ''
  )
  const [selectedModel, setSelectedModel] = useState<string>(
    modelPreferences.defaultModel || ''
  )

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    try {
      setIsLoading(true)
      const response: ModelsResponse = await chatService.getAvailableModels()
      setModels(response.models)
      setProviders(response.providers)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load models')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredModels = selectedProvider
    ? models.filter((m) => m.provider === selectedProvider)
    : models

  const selectedModelInfo = models.find((m) => m.id === selectedModel)

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider)
    setSelectedModel('') // Reset model when provider changes
  }

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId)
  }

  const handleSave = () => {
    updateModelPreferences({
      defaultProvider: selectedProvider || null,
      defaultModel: selectedModel || null,
    })
  }

  const formatContextLength = (length: number | null | undefined): string => {
    if (!length) return 'N/A'
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`
    if (length >= 1000) return `${(length / 1000).toFixed(0)}K`
    return length.toString()
  }

  const getProviderDisplayName = (provider: string): string => {
    const names: Record<string, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      ollama: 'Ollama (Local)',
      router: 'Router API',
    }
    return names[provider] || provider
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Default Model Selection
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Choose your preferred AI provider and model for new conversations
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading models...</p>
        </div>
      ) : (
        <>
          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Provider
            </label>
            <select
              value={selectedProvider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a provider...</option>
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {getProviderDisplayName(provider)}
                </option>
              ))}
            </select>
          </div>

          {/* Model Selection */}
          {selectedProvider && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a model...</option>
                {filteredModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''} available
              </p>
            </div>
          )}

          {/* Model Info Card */}
          {selectedModelInfo && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Model Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Name:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {selectedModelInfo.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Provider:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {getProviderDisplayName(selectedModelInfo.provider)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Context Length:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatContextLength(selectedModelInfo.context_length)} tokens
                  </span>
                </div>
                {selectedModelInfo.supports_vision !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Vision Support:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedModelInfo.supports_vision ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                )}
                {selectedModelInfo.supports_function_calling !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Function Calling:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedModelInfo.supports_function_calling ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Advanced Settings
            </h4>
            
            <div className="space-y-4">
              {/* Temperature */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temperature: {modelPreferences.temperature.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={modelPreferences.temperature}
                  onChange={(e) =>
                    updateModelPreferences({ temperature: parseFloat(e.target.value) })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Precise (0.0)</span>
                  <span>Balanced (1.0)</span>
                  <span>Creative (2.0)</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Tokens (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="200000"
                  value={modelPreferences.maxTokens || ''}
                  onChange={(e) =>
                    updateModelPreferences({
                      maxTokens: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  placeholder="Auto (model default)"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Leave empty to use model's default maximum
                </p>
              </div>

              {/* Stream Responses */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stream Responses
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Show responses as they're generated
                  </p>
                </div>
                <button
                  onClick={() =>
                    updateModelPreferences({ streamResponses: !modelPreferences.streamResponses })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    modelPreferences.streamResponses
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      modelPreferences.streamResponses ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!selectedProvider || !selectedModel}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Preferences
            </button>
            <button
              onClick={loadModels}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Refresh Models
            </button>
          </div>
        </>
      )}
    </div>
  )
}
