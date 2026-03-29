/**
 * Authentication API service.
 *
 * Functions for register, login, logout, and token management.
 * To be implemented in Phase 3 (Authentication).
 */

import api from './api'
import type { TokenResponse, User, UserLoginRequest, UserRegisterRequest } from '../types/auth'

/** Register a new user. */
export async function register(data: UserRegisterRequest): Promise<User> {
  const response = await api.post<User>('/auth/register', data)
  return response.data
}

/** Login and receive an access token. */
export async function login(data: UserLoginRequest): Promise<TokenResponse> {
  const response = await api.post<TokenResponse>('/auth/login', data)
  return response.data
}

/** Logout the current user. */
export async function logout(): Promise<void> {
  await api.post('/auth/logout')
  localStorage.removeItem('access_token')
}

/** Get the currently authenticated user. */
export async function getCurrentUser(): Promise<User> {
  const response = await api.get<User>('/auth/me')
  return response.data
}
