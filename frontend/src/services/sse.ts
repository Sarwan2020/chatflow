/**
 * Server-Sent Events (SSE) client utility.
 *
 * Handles SSE connections for streaming chat responses.
 * To be implemented in Phase 6 (Chat Interface).
 */

export interface SSECallbacks {
  onMessage: (data: string) => void;
  onError: (error: Event) => void;
  onComplete: () => void;
}

/**
 * Create an SSE connection to the specified URL.
 * Returns a cleanup function to close the connection.
 */
export function createSSEConnection(
  _url: string,
  _callbacks: SSECallbacks
): () => void {
  // Placeholder - will use EventSource or fetch with ReadableStream
  return () => {
    // Cleanup
  }
}
