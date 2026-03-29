/**
 * useMemory hook.
 *
 * Custom hook for memory CRUD operations and search.
 */

import { useState, useEffect, useCallback } from 'react';
import type {
  Memory,
  MemoryCreateRequest,
  MemoryUpdateRequest,
  MemorySearchRequest,
  MemoryStats,
} from '../types/memory';
import * as memoryService from '../services/memory';

interface UseMemoryReturn {
  memories: Memory[];
  stats: MemoryStats | null;
  isLoading: boolean;
  error: string | null;
  fetchMemories: (params?: {
    memory_type?: string;
    category?: string;
    skip?: number;
    limit?: number;
  }) => Promise<void>;
  fetchStats: () => Promise<void>;
  createMemory: (data: MemoryCreateRequest) => Promise<Memory | null>;
  updateMemory: (memoryId: number, data: MemoryUpdateRequest) => Promise<Memory | null>;
  deleteMemory: (memoryId: number) => Promise<boolean>;
  searchMemories: (data: MemorySearchRequest) => Promise<Memory[]>;
  clearError: () => void;
}

export function useMemory(): UseMemoryReturn {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const fetchMemories = useCallback(async (params?: {
    memory_type?: string;
    category?: string;
    skip?: number;
    limit?: number;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await memoryService.getMemories(params);
      setMemories(response.memories);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch memories');
      console.error('Error fetching memories:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const statsData = await memoryService.getMemoryStats();
      setStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch memory stats');
      console.error('Error fetching memory stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createMemory = useCallback(async (data: MemoryCreateRequest): Promise<Memory | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const newMemory = await memoryService.createMemory(data);
      setMemories((prev) => [newMemory, ...prev]);
      return newMemory;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create memory');
      console.error('Error creating memory:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateMemory = useCallback(
    async (memoryId: number, data: MemoryUpdateRequest): Promise<Memory | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const updatedMemory = await memoryService.updateMemory(memoryId, data);
        setMemories((prev) =>
          prev.map((mem) => (mem.id === memoryId ? updatedMemory : mem))
        );
        return updatedMemory;
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to update memory');
        console.error('Error updating memory:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deleteMemory = useCallback(async (memoryId: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      await memoryService.deleteMemory(memoryId);
      setMemories((prev) => prev.filter((mem) => mem.id !== memoryId));
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete memory');
      console.error('Error deleting memory:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchMemories = useCallback(async (data: MemorySearchRequest): Promise<Memory[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await memoryService.searchMemories(data);
      return response.memories;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to search memories');
      console.error('Error searching memories:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load memories on mount
  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  return {
    memories,
    stats,
    isLoading,
    error,
    fetchMemories,
    fetchStats,
    createMemory,
    updateMemory,
    deleteMemory,
    searchMemories,
    clearError,
  };
}
