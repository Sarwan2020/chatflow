/**
 * Authentication API service.
 *
 * Functions for register, login, logout, and token management.
 * Stores JWT in localStorage for persistence across page refreshes.
 */

import api from './api'
import type { TokenResponse, User, UserLoginRequest, UserRegisterRequest } from '../types/auth'

const TOKEN_KEY = 'access_token'

/** Get the stored access token. */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

/** Store the access token. */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/** Remove the stored access token. */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/** Register a new user. */
export async function register(data: UserRegisterRequest): Promise<User> {
  const response = await api.post<User>('/auth/register', data)
  return response.data
}

/** Login and receive an access token. Stores the token automatically. */
export async function login(data: UserLoginRequest): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>('/auth/login', data)
  setToken(response.data.access_token)
  return response.data
}

/** Logout the current user. Removes the stored token. */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } catch {
    // Even if the server call fails, clear the local token
  }
  removeToken()
}

/** Get the currently authenticated user. */
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<User>('/auth/me')
  return response.data
}
