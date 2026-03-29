/**
 * Authentication-related TypeScript type definitions.
 */

/** User object returned from the API. */
export interface User {
  id: number;
  email: string;
  created_at: string;
  updated_at: string;
}

/** Request payload for user registration. */
export interface UserRegisterRequest {
  email: string;
  password: string;
}

/** Request payload for user login. */
export interface UserLoginRequest {
  email: string;
  password: string;
}

/** Response from login endpoint containing the access token. */
export interface TokenResponse {
  access_token: string;
  token_type: string;
}

/** Authentication context state. */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
