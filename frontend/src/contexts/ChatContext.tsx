/**
 * ChatContext - Global chat state management.
 *
 * Provides conversation list, active conversation, messages,
 * and streaming state across the application.
 * To be implemented in Phase 6 (Chat Interface).
 */

import { createContext } from 'react'
import type { ChatState } from '../types/chat'

export const ChatContext = createContext<ChatState | null>(null)
