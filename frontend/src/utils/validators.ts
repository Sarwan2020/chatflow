/**
 * Validation utility functions.
 */

/** Validate an email address format. */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/** Validate password meets minimum requirements. */
export function isValidPassword(password: string): { valid: boolean; message: string } {
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters' }
  }
  return { valid: true, message: '' }
}

/** Validate an API key is not empty and has reasonable length. */
export function isValidApiKey(key: string): boolean {
  return key.trim().length >= 10
}
