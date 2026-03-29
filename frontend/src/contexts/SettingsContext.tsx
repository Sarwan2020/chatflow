/**
 * SettingsContext - Global settings state management.
 *
 * Provides API key management, model preferences, and UI settings.
 * To be implemented in Phase 8 (Settings and Configuration).
 */

import { createContext } from 'react'

export interface SettingsState {
  defaultProvider: string | null;
  defaultModel: string | null;
  theme: 'light' | 'dark';
}

export const SettingsContext = createContext<SettingsState | null>(null)
