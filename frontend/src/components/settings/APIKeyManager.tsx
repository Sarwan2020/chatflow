/**
 * APIKeyManager component.
 *
 * Manage API keys for different providers.
 */

import React, { useState, useEffect } from 'react'
import type { APIKey, Provider, APIKeyCreateRequest } from '../../types/chat'
import * as chatService from '../../services/chat'

export default function APIKeyManager() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  
  // Form state
  const [provider, setProvider] = useState<Provider>('openai')
  const [keyValue, setKeyValue] = useState('')
  const [keyName, setKeyName] = useState('')

  useEffect(() => {
    loadAPIKeys()
  }, [])

  const loadAPIKeys = async () => {
    try {
      setIsLoading(true)
      const keys = await chatService.getAPIKeys()
      setApiKeys(keys)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load API keys')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!keyValue.trim()) {
      setError('API key is required')
      return
    }

    try {
      setIsLoading(true)
      const request: APIKeyCreateRequest = {
        provider,
        key_value: keyValue.trim(),
        name: keyName.trim() || undefined
      }
      
      await chatService.createAPIKey(request)
      await loadAPIKeys()
      
      // Reset form
      setKeyValue('')
      setKeyName('')
      setShowAddForm(false)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to add API key')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteKey = async (keyId: number) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return
    }

    try {
      setIsLoading(true)
      await chatService.deleteAPIKey(keyId)
      await loadAPIKeys()
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete API key')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (keyId: number, isActive: boolean) => {
    try {
      setIsLoading(true)
      await chatService.updateAPIKey(keyId, { is_active: !isActive })
      await loadAPIKeys()
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update API key')
    } finally {
      setIsLoading(false)
    }
  }

  const getProviderName = (provider: string) => {
    const names: Record<string, string> = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      ollama: 'Ollama',
      router: 'Router API'
    }
    return names[provider] || provider
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            API Keys
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage your API keys for different AI providers
          </p>
        </div>
        
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add API Key
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Add Key Form */}
      {showAddForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Add New API Key
          </h3>
          
          <form onSubmit={handleAddKey} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as Provider)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="ollama">Ollama (Local)</option>
                <option value="router">Router API</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder="sk-..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Name (Optional)
              </label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="My API Key"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Add Key
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setKeyValue('')
                  setKeyName('')
                  setError(null)
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* API Keys List */}
      <div className="space-y-3">
        {apiKeys.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-4xl mb-2">🔑</div>
            <p className="text-gray-600 dark:text-gray-400">
              No API keys configured yet
            </p>
          </div>
        ) : (
          apiKeys.map((key) => (
            <div
              key={key.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {getProviderName(key.provider)}
                    </h3>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        key.is_active
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      {key.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {key.name && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {key.name}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 font-mono">
                    {key.key_preview}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(key.id, key.is_active)}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                  >
                    {key.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => handleDeleteKey(key.id)}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
