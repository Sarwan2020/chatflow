/**
 * Custom hook for tracking and managing token usage.
 * 
 * Provides real-time token counting, usage statistics,
 * and context limit monitoring.
 */

import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ConversationUsage {
  conversation_id: string;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  message_count: number;
}

export interface UsageSummary {
  user_id: number;
  time_range: string;
  total_prompt_tokens: number;
  total_completion_tokens: number;
  total_tokens: number;
  total_requests: number;
  by_provider: Array<{
    provider: string;
    total_tokens: number;
    total_requests: number;
    models: Record<string, {
      model: string;
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
      request_count: number;
    }>;
  }>;
}

export interface UseTokenUsageReturn {
  conversationUsage: ConversationUsage | null;
  usageSummary: UsageSummary | null;
  isLoading: boolean;
  error: Error | null;
  fetchConversationUsage: (conversationId: string) => Promise<void>;
  fetchUsageSummary: (timeRange?: string) => Promise<void>;
  estimateTokens: (text: string) => number;
  calculatePercentage: (used: number, limit: number) => number;
  getUsageColor: (percentage: number) => string;
}

/**
 * Estimate token count for text (simple heuristic).
 * ~4 characters per token on average.
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate percentage of tokens used.
 */
function calculatePercentage(used: number, limit: number): number {
  if (limit === 0) return 0;
  return Math.min((used / limit) * 100, 100);
}

/**
 * Get color based on usage percentage.
 */
function getUsageColor(percentage: number): string {
  if (percentage < 50) return 'green';
  if (percentage < 80) return 'yellow';
  return 'red';
}

/**
 * Hook for managing token usage tracking.
 */
export function useTokenUsage(): UseTokenUsageReturn {
  const [conversationUsage, setConversationUsage] = useState<ConversationUsage | null>(null);
  const [usageSummary, setUsageSummary] = useState<UsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchConversationUsage = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(`/usage/conversation/${conversationId}`);
      setConversationUsage(response.data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error fetching conversation usage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUsageSummary = useCallback(async (timeRange: string = 'all') => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/usage/summary', {
        params: { time_range: timeRange },
      });
      setUsageSummary(response.data);
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Error fetching usage summary:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    conversationUsage,
    usageSummary,
    isLoading,
    error,
    fetchConversationUsage,
    fetchUsageSummary,
    estimateTokens,
    calculatePercentage,
    getUsageColor,
  };
}

/**
 * Hook for real-time token counting as user types.
 */
export function useTokenCounter(text: string, model?: string) {
  const [tokenCount, setTokenCount] = useState<number>(0);

  useEffect(() => {
    // Estimate tokens (in production, use tiktoken for OpenAI models)
    const count = estimateTokens(text);
    setTokenCount(count);
  }, [text]);

  return {
    tokenCount,
    estimateTokens: (t: string) => estimateTokens(t),
  };
}

/**
 * Hook for monitoring context limits.
 */
export function useContextLimit(
  currentTokens: number,
  contextLimit: number
) {
  const percentage = calculatePercentage(currentTokens, contextLimit);
  const color = getUsageColor(percentage);
  const isNearLimit = percentage >= 80;
  const isOverLimit = percentage >= 100;
  const remainingTokens = Math.max(0, contextLimit - currentTokens);

  return {
    percentage,
    color,
    isNearLimit,
    isOverLimit,
    remainingTokens,
  };
}
