/**
 * Application constants.
 */

/** Supported LLM providers with display names. */
export const LLM_PROVIDERS = {
  openai: { name: 'OpenAI', icon: '🤖' },
  anthropic: { name: 'Anthropic', icon: '🧠' },
  ollama: { name: 'Ollama (Local)', icon: '🏠' },
  router_api: { name: 'Router API', icon: '🔀' },
} as const

/** Default model context lengths. */
export const MODEL_CONTEXT_LENGTHS: Record<string, number> = {
  'gpt-4': 8192,
  'gpt-4-turbo': 128000,
  'gpt-3.5-turbo': 16385,
  'claude-3-opus': 200000,
  'claude-3-sonnet': 200000,
  'claude-3-haiku': 200000,
}

/** Local storage keys. */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  DEFAULT_PROVIDER: 'default_provider',
  DEFAULT_MODEL: 'default_model',
  THEME: 'theme',
} as const

/** API routes. */
export const API_ROUTES = {
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  CONVERSATIONS: '/conversations',
  CHAT: {
    STREAM: '/chat/stream',
    COMPLETE: '/chat/complete',
  },
  MEMORY: '/memory',
  KEYS: '/keys',
  USAGE: '/usage',
  MODELS: '/models',
} as const
