/**
 * SettingsContext - Global settings state management.
 *
 * Provides API key management, model preferences, and UI settings.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type FontSize = 'small' | 'medium' | 'large'

export interface UIPreferences {
  theme: Theme
  fontSize: FontSize
  compactMode: boolean
  showTokenCount: boolean
  enableSoundEffects: boolean
}

export interface MemorySettings {
  autoSaveMemories: boolean
  memoryRetentionDays: number
  maxMemoriesPerConversation: number
  enableExplicitMemoryOnly: boolean
}

export interface ModelPreferences {
  defaultProvider: string | null
  defaultModel: string | null
  temperature: number
  maxTokens: number | null
  streamResponses: boolean
}

export interface SettingsState {
  uiPreferences: UIPreferences
  memorySettings: MemorySettings
  modelPreferences: ModelPreferences
  isLoading: boolean
}

export interface SettingsContextType extends SettingsState {
  updateUIPreferences: (preferences: Partial<UIPreferences>) => void
  updateMemorySettings: (settings: Partial<MemorySettings>) => void
  updateModelPreferences: (preferences: Partial<ModelPreferences>) => void
  resetToDefaults: () => void
  exportSettings: () => string
  importSettings: (jsonString: string) => boolean
}

const defaultUIPreferences: UIPreferences = {
  theme: 'system',
  fontSize: 'medium',
  compactMode: false,
  showTokenCount: true,
  enableSoundEffects: false,
}

const defaultMemorySettings: MemorySettings = {
  autoSaveMemories: true,
  memoryRetentionDays: 90,
  maxMemoriesPerConversation: 10,
  enableExplicitMemoryOnly: false,
}

const defaultModelPreferences: ModelPreferences = {
  defaultProvider: null,
  defaultModel: null,
  temperature: 0.7,
  maxTokens: null,
  streamResponses: true,
}

const SettingsContext = createContext<SettingsContextType | null>(null)

const STORAGE_KEY = 'webflow_settings'

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [uiPreferences, setUIPreferences] = useState<UIPreferences>(defaultUIPreferences)
  const [memorySettings, setMemorySettings] = useState<MemorySettings>(defaultMemorySettings)
  const [modelPreferences, setModelPreferences] = useState<ModelPreferences>(defaultModelPreferences)
  const [isLoading, setIsLoading] = useState(true)

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.uiPreferences) setUIPreferences({ ...defaultUIPreferences, ...parsed.uiPreferences })
        if (parsed.memorySettings) setMemorySettings({ ...defaultMemorySettings, ...parsed.memorySettings })
        if (parsed.modelPreferences) setModelPreferences({ ...defaultModelPreferences, ...parsed.modelPreferences })
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      const settings = {
        uiPreferences,
        memorySettings,
        modelPreferences,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    }
  }, [uiPreferences, memorySettings, modelPreferences, isLoading])

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    
    if (uiPreferences.theme === 'dark') {
      root.classList.add('dark')
    } else if (uiPreferences.theme === 'light') {
      root.classList.remove('dark')
    } else {
      // System preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (prefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    // Apply font size
    root.style.fontSize = {
      small: '14px',
      medium: '16px',
      large: '18px',
    }[uiPreferences.fontSize]
  }, [uiPreferences.theme, uiPreferences.fontSize])

  const updateUIPreferences = (preferences: Partial<UIPreferences>) => {
    setUIPreferences(prev => ({ ...prev, ...preferences }))
  }

  const updateMemorySettings = (settings: Partial<MemorySettings>) => {
    setMemorySettings(prev => ({ ...prev, ...settings }))
  }

  const updateModelPreferences = (preferences: Partial<ModelPreferences>) => {
    setModelPreferences(prev => ({ ...prev, ...preferences }))
  }

  const resetToDefaults = () => {
    setUIPreferences(defaultUIPreferences)
    setMemorySettings(defaultMemorySettings)
    setModelPreferences(defaultModelPreferences)
  }

  const exportSettings = (): string => {
    const settings = {
      uiPreferences,
      memorySettings,
      modelPreferences,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    }
    return JSON.stringify(settings, null, 2)
  }

  const importSettings = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString)
      
      // Validate structure
      if (!parsed.uiPreferences && !parsed.memorySettings && !parsed.modelPreferences) {
        throw new Error('Invalid settings format')
      }

      if (parsed.uiPreferences) {
        setUIPreferences({ ...defaultUIPreferences, ...parsed.uiPreferences })
      }
      if (parsed.memorySettings) {
        setMemorySettings({ ...defaultMemorySettings, ...parsed.memorySettings })
      }
      if (parsed.modelPreferences) {
        setModelPreferences({ ...defaultModelPreferences, ...parsed.modelPreferences })
      }

      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }

  const value: SettingsContextType = {
    uiPreferences,
    memorySettings,
    modelPreferences,
    isLoading,
    updateUIPreferences,
    updateMemorySettings,
    updateModelPreferences,
    resetToDefaults,
    exportSettings,
    importSettings,
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export { SettingsContext }
