/**
 * useChat hook.
 *
 * Custom hook for chat operations and state management.
 * To be implemented in Phase 6 (Chat Interface).
 */

export function useChat() {
  // Placeholder - will use ChatContext
  return {
    conversations: [],
    activeConversation: null,
    messages: [],
    isLoading: false,
    isStreaming: false,
    error: null,
  }
}
