/**
 * Server-Sent Events (SSE) service for streaming chat responses.
 * 
 * Provides utilities for creating and managing SSE connections,
 * parsing event data, and handling reconnection logic.
 */

export interface SSEMessage {
  type: string;
  [key: string]: any;
}

export interface SSECallbacks {
  onMessage: (message: SSEMessage) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  onOpen?: () => void;
}

export interface SSEConnection {
  close: () => void;
  isConnected: () => boolean;
}

/**
 * Create a Server-Sent Events connection.
 * 
 * @param url - The SSE endpoint URL
 * @param callbacks - Event callbacks
 * @param options - Connection options
 * @returns SSEConnection object with close method
 */
export function createSSEConnection(
  url: string,
  callbacks: SSECallbacks,
  options: {
    maxRetries?: number;
    retryDelay?: number;
    headers?: Record<string, string>;
  } = {}
): SSEConnection {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    headers = {},
  } = options;

  let eventSource: EventSource | null = null;
  let retryCount = 0;
  let isClosed = false;
  let isConnected = false;

  const connect = () => {
    if (isClosed) return;

    try {
      // EventSource doesn't support custom headers directly
      // For authenticated requests, we'll use query params or cookies
      const urlWithAuth = new URL(url);
      
      // Add auth token from localStorage if available
      const token = localStorage.getItem('token');
      if (token && !urlWithAuth.searchParams.has('token')) {
        urlWithAuth.searchParams.set('token', token);
      }

      eventSource = new EventSource(urlWithAuth.toString());

      eventSource.onopen = () => {
        isConnected = true;
        retryCount = 0;
        callbacks.onOpen?.();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callbacks.onMessage(data);

          // Check for completion
          if (data.type === 'done' || data.type === 'complete') {
            callbacks.onComplete?.();
            close();
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
          callbacks.onError?.(error as Error);
        }
      };

      eventSource.onerror = (event) => {
        isConnected = false;
        
        if (isClosed) return;

        const error = new Error('SSE connection error');
        callbacks.onError?.(error);

        // Attempt reconnection
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Reconnecting SSE (attempt ${retryCount}/${maxRetries})...`);
          
          setTimeout(() => {
            eventSource?.close();
            connect();
          }, retryDelay * retryCount);
        } else {
          console.error('Max SSE reconnection attempts reached');
          close();
        }
      };
    } catch (error) {
      console.error('Error creating SSE connection:', error);
      callbacks.onError?.(error as Error);
    }
  };

  const close = () => {
    isClosed = true;
    isConnected = false;
    
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  const getIsConnected = () => isConnected;

  // Start connection
  connect();

  return {
    close,
    isConnected: getIsConnected,
  };
}

/**
 * Parse SSE data format.
 * 
 * @param data - Raw SSE data string
 * @returns Parsed message object
 */
export function parseSSEData(data: string): SSEMessage | null {
  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing SSE data:', error);
    return null;
  }
}

/**
 * Create a fetch-based SSE connection (alternative to EventSource).
 * Useful when you need custom headers or more control.
 * 
 * @param url - The SSE endpoint URL
 * @param callbacks - Event callbacks
 * @param options - Connection options
 * @returns SSEConnection object with close method
 */
export async function createFetchSSEConnection(
  url: string,
  callbacks: SSECallbacks,
  options: {
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {}
): Promise<SSEConnection> {
  const { headers = {}, signal } = options;
  
  let isClosed = false;
  let isConnected = false;
  const abortController = new AbortController();

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        ...headers,
      },
      signal: signal || abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`SSE request failed: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    isConnected = true;
    callbacks.onOpen?.();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const processStream = async () => {
      try {
        while (!isClosed) {
          const { done, value } = await reader.read();

          if (done) {
            callbacks.onComplete?.();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              const message = parseSSEData(data);
              
              if (message) {
                callbacks.onMessage(message);

                if (message.type === 'done' || message.type === 'complete') {
                  callbacks.onComplete?.();
                  isClosed = true;
                  break;
                }
              }
            }
          }
        }
      } catch (error) {
        if (!isClosed) {
          callbacks.onError?.(error as Error);
        }
      } finally {
        reader.releaseLock();
        isConnected = false;
      }
    };

    processStream();
  } catch (error) {
    isConnected = false;
    callbacks.onError?.(error as Error);
  }

  const close = () => {
    isClosed = true;
    isConnected = false;
    abortController.abort();
  };

  const getIsConnected = () => isConnected;

  return {
    close,
    isConnected: getIsConnected,
  };
}
