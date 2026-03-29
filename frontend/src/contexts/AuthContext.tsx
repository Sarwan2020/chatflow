/**
 * AuthContext - Global authentication state management.
 *
 * Provides user state, login/register/logout methods, and
 * token validation across the application.
 * To be implemented in Phase 3 (Authentication).
 */

import { createContext } from 'react'
import type { AuthState } from '../types/auth'

export const AuthContext = createContext<AuthState | null>(null)
