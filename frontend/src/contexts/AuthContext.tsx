/**
 * AuthContext - Global authentication state management.
 *
 * Provides user state, login/register/logout methods, and
 * token validation across the application.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AuthState, User, UserLoginRequest, UserRegisterRequest } from '../types/auth'
import * as authService from '../services/auth'

interface AuthContextValue extends AuthState {
  login: (data: UserLoginRequest) => Promise<void>
  register: (data: UserRegisterRequest) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = user !== null

  /**
   * Check for an existing token on mount and validate it.
   * If valid, populate the user state so the user stays logged in
   * after a page refresh.
   */
  const checkAuth = useCallback(async () => {
    const token = authService.getToken()
    if (!token) {
      setIsLoading(false)
      return
    }

    try {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch {
      // Token is invalid or expired — clear it
      authService.removeToken()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  /** Login with email and password. */
  const login = useCallback(async (data: UserLoginRequest) => {
    setError(null)
    setIsLoading(true)
    try {
      await authService.login(data)
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
    } catch (err: unknown) {
      const message = extractErrorMessage(err, 'Login failed. Please check your credentials.')
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /** Register a new account. Does NOT auto-login. */
  const register = useCallback(async (data: UserRegisterRequest) => {
    setError(null)
    setIsLoading(true)
    try {
      await authService.register(data)
    } catch (err: unknown) {
      const message = extractErrorMessage(err, 'Registration failed. Please try again.')
      setError(message)
      throw new Error(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /** Logout and clear all auth state. */
  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authService.logout()
    } finally {
      setUser(null)
      setError(null)
      setIsLoading(false)
    }
  }, [])

  /** Clear the current error message. */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError,
    }),
    [user, isAuthenticated, isLoading, error, login, register, logout, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Custom hook to consume the AuthContext.
 * Throws if used outside of an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract a human-readable error message from an Axios error or generic Error. */
function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as { response?: { data?: { detail?: string } } }
    const detail = axiosErr.response?.data?.detail
    if (typeof detail === 'string') return detail
  }
  if (err instanceof Error) return err.message
  return fallback
}
