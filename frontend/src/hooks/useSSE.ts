/**
 * Custom React hook for managing Server-Sent Events (SSE) connections.
 * 
 * Provides state management for streaming responses, connection lifecycle,
 * error handling, and automatic cleanup.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createSSEConnection, SSEMessage, SSEConnection } from '../services/sse';

export interface UseSSEOptions {
  onMessage?: (message: SSEMessage) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  onOpen?: () => void;
  autoConnect?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export interface UseSSEReturn {
  messages: SSEMessage[];
  accumulatedContent: string;
  isConnected: boolean;
  isComplete: boolean;
  error: Error | null;
  connect: (url: string) => void;
  disconnect: () => void;
  reset: () => void;
}

/**
 * Hook for managing SSE connections with React state.
 * 
 * @param options - Configuration options
 * @returns SSE connection state and control methods
 */
export function useSSE(options: UseSSEOptions = {}): UseSSEReturn {
  const {
    onMessage: externalOnMessage,
    onError: externalOnError,
    onComplete: externalOnComplete,
    onOpen: externalOnOpen,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  const [messages, setMessages] = useState<SSEMessage[]>([]);
  const [accumulatedContent, setAccumulatedContent] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const connectionRef = useRef<SSEConnection | null>(null);
  const urlRef = useRef<string>('');

  const handleMessage = useCallback((message: SSEMessage) => {
    setMessages(prev => [...prev, message]);

    // Accumulate content chunks
    if (message.type === 'content' && message.content) {
      setAccumulatedContent(prev => prev + message.content);
    }

    // Call external handler
    externalOnMessage?.(message);
  }, [externalOnMessage]);

  const handleError = useCallback((err: Error) => {
    setError(err);
    setIsConnected(false);
    externalOnError?.(err);
  }, [externalOnError]);

  const handleComplete = useCallback(() => {
    setIsComplete(true);
    setIsConnected(false);
    externalOnComplete?.();
  }, [externalOnComplete]);

  const handleOpen = useCallback(() => {
    setIsConnected(true);
    setError(null);
    externalOnOpen?.();
  }, [externalOnOpen]);

  const connect = useCallback((url: string) => {
    // Disconnect existing connection
    if (connectionRef.current) {
      connectionRef.current.close();
    }

    // Reset state
    setMessages([]);
    setAccumulatedContent('');
    setIsComplete(false);
    setError(null);

    urlRef.current = url;

    // Create new connection
    connectionRef.current = createSSEConnection(
      url,
      {
        onMessage: handleMessage,
        onError: handleError,
        onComplete: handleComplete,
        onOpen: handleOpen,
      },
      {
        maxRetries,
        retryDelay,
      }
    );
  }, [handleMessage, handleError, handleComplete, handleOpen, maxRetries, retryDelay]);

  const disconnect = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const reset = useCallback(() => {
    disconnect();
    setMessages([]);
    setAccumulatedContent('');
    setIsComplete(false);
    setError(null);
  }, [disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
      }
    };
  }, []);

  return {
    messages,
    accumulatedContent,
    isConnected,
    isComplete,
    error,
    connect,
    disconnect,
    reset,
  };
}

/**
 * Simplified hook for streaming a single response.
 * Automatically connects and manages the stream lifecycle.
 */
export function useStreamResponse() {
  const [content, setContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [usage, setUsage] = useState<any>(null);

  const connectionRef = useRef<SSEConnection | null>(null);

  const startStream = useCallback((url: string) => {
    // Reset state
    setContent('');
    setIsStreaming(true);
    setError(null);
    setUsage(null);

    // Close existing connection
    if (connectionRef.current) {
      connectionRef.current.close();
    }

    // Create new connection
    connectionRef.current = createSSEConnection(
      url,
      {
        onMessage: (message) => {
          if (message.type === 'content') {
            setContent(prev => prev + message.content);
          } else if (message.type === 'complete') {
            setUsage(message.usage);
          }
        },
        onError: (err) => {
          setError(err);
          setIsStreaming(false);
        },
        onComplete: () => {
          setIsStreaming(false);
        },
      }
    );
  }, []);

  const stopStream = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stopStream();
    setContent('');
    setError(null);
    setUsage(null);
  }, [stopStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
      }
    };
  }, []);

  return {
    content,
    isStreaming,
    error,
    usage,
    startStream,
    stopStream,
    reset,
  };
}
