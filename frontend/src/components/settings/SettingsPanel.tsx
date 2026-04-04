/**
 * SettingsPanel component.
 *
 * Main settings container with API keys, model preferences, and UI settings.
 */

import React, { useState, useRef } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import APIKeyManager from './APIKeyManager'
import ModelSelector from './ModelSelector'

export default function SettingsPanel() {
  const {
    uiPreferences,
    memorySettings,
    updateUIPreferences,
    updateMemorySettings,
    resetToDefaults,
    exportSettings,
    importSettings,
  } = useSettings()

  const [activeTab, setActiveTab] = useState<'api-keys' | 'models' | 'ui' | 'memory' | 'data'>('api-keys')
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tabs = [
    { id: 'api-keys' as const, label: 'API Keys', icon: '🔑' },
    { id: 'models' as const, label: 'Models', icon: '🤖' },
    { id: 'ui' as const, label: 'UI Preferences', icon: '🎨' },
    { id: 'memory' as const, label: 'Memory', icon: '🧠' },
    { id: 'data' as const, label: 'Data', icon: '💾' },
  ]

  const handleExport = () => {
    const settingsJson = exportSettings()
    const blob = new Blob([settingsJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `webflow-settings-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const success = importSettings(content)
        
        if (success) {
          setImportSuccess(true)
          setImportError(null)
          setTimeout(() => setImportSuccess(false), 3000)
        } else {
          setImportError('Invalid settings file format')
        }
      } catch (error) {
        setImportError('Failed to read settings file')
      }
    }
    reader.readAsText(file)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      resetToDefaults()
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8" aria-label="Settings tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {/* API Keys Tab */}
        {activeTab === 'api-keys' && <APIKeyManager />}

        {/* Models Tab */}
        {activeTab === 'models' && <ModelSelector />}

        {/* UI Preferences Tab */}
        {activeTab === 'ui' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                UI Preferences
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Customize the appearance and behavior of the interface
              </p>
            </div>

            {/* Theme */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['light', 'dark', 'system'] as const).map((theme) => (
                  <button
                    key={theme}
                    onClick={() => updateUIPreferences({ theme })}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${
                        uiPreferences.theme === theme
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div className="text-2xl mb-2">
                      {theme === 'light' && '☀️'}
                      {theme === 'dark' && '🌙'}
                      {theme === 'system' && '💻'}
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                      {theme}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Font Size
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateUIPreferences({ fontSize: size })}
                    className={`
                      p-4 rounded-lg border-2 transition-all
                      ${
                        uiPreferences.fontSize === size
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    <div className={`font-medium text-gray-900 dark:text-gray-100 capitalize ${
                      size === 'small' ? 'text-sm' : size === 'large' ? 'text-lg' : 'text-base'
                    }`}>
                      {size}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle Options */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Compact Mode */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Compact Mode
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Reduce spacing and padding for a denser layout
                  </p>
                </div>
                <button
                  onClick={() => updateUIPreferences({ compactMode: !uiPreferences.compactMode })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    uiPreferences.compactMode
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      uiPreferences.compactMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Show Token Count */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Show Token Count
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Display token usage information in messages
                  </p>
                </div>
                <button
                  onClick={() => updateUIPreferences({ showTokenCount: !uiPreferences.showTokenCount })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    uiPreferences.showTokenCount
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      uiPreferences.showTokenCount ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sound Effects
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Play sounds for notifications and events
                  </p>
                </div>
                <button
                  onClick={() => updateUIPreferences({ enableSoundEffects: !uiPreferences.enableSoundEffects })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    uiPreferences.enableSoundEffects
                      ? 'bg-blue-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      uiPreferences.enableSoundEffects ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Memory Settings Tab */}
        {activeTab === 'memory' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Memory Settings
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Configure how the AI remembers and uses information from conversations
              </p>
            </div>

            {/* Auto-save Memories */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto-save Memories
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Automatically extract and save important information
                </p>
              </div>
              <button
                onClick={() => updateMemorySettings({ autoSaveMemories: !memorySettings.autoSaveMemories })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  memorySettings.autoSaveMemories
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    memorySettings.autoSaveMemories ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Explicit Memory Only */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Explicit Memory Only
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Only save memories when explicitly requested
                </p>
              </div>
              <button
                onClick={() => updateMemorySettings({ enableExplicitMemoryOnly: !memorySettings.enableExplicitMemoryOnly })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  memorySettings.enableExplicitMemoryOnly
                    ? 'bg-blue-600'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    memorySettings.enableExplicitMemoryOnly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Memory Retention Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Memory Retention: {memorySettings.memoryRetentionDays} days
              </label>
              <input
                type="range"
                min="7"
                max="365"
                step="7"
                value={memorySettings.memoryRetentionDays}
                onChange={(e) =>
                  updateMemorySettings({ memoryRetentionDays: parseInt(e.target.value) })
                }
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>1 week</span>
                <span>6 months</span>
                <span>1 year</span>
              </div>
            </div>

            {/* Max Memories Per Conversation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max Memories Per Conversation
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={memorySettings.maxMemoriesPerConversation}
                onChange={(e) =>
                  updateMemorySettings({ maxMemoriesPerConversation: parseInt(e.target.value) || 10 })
                }
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-4 py-2 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Number of relevant memories to inject into each conversation
              </p>
            </div>
          </div>
        )}

        {/* Data Management Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Data Management
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Export, import, or reset your settings and data
              </p>
            </div>

            {/* Export Settings */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Export Settings
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Download your current settings as a JSON file for backup or transfer
                  </p>
                </div>
                <button
                  onClick={handleExport}
                  className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Export
                </button>
              </div>
            </div>

            {/* Import Settings */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Import Settings
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Restore settings from a previously exported JSON file
                  </p>
                </div>
                <div className="ml-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                    id="import-settings"
                  />
                  <label
                    htmlFor="import-settings"
                    className="cursor-pointer px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors inline-block"
                  >
                    Import
                  </label>
                </div>
              </div>
              
              {importError && (
                <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">{importError}</p>
                </div>
              )}
              
              {importSuccess && (
                <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Settings imported successfully!
                  </p>
                </div>
              )}
            </div>

            {/* Reset to Defaults */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                    Reset to Defaults
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Reset all settings to their default values. This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={handleResetToDefaults}
                  className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Note:</strong> Exported settings only include preferences and configuration. 
                    API keys, conversations, and messages are not included for security reasons.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
