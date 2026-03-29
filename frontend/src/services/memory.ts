/**
 * Memory API service.
 *
 * Functions for memory CRUD and search operations.
 */

import api from './api';
import type {
  Memory,
  MemoryCreateRequest,
  MemoryUpdateRequest,
  MemorySearchRequest,
  MemorySearchResponse,
  MemoryListResponse,
  MemoryStats,
} from '../types/memory';

/** List all memories for the current user with optional filters. */
export async function getMemories(params?: {
  memory_type?: string;
  category?: string;
  skip?: number;
  limit?: number;
}): Promise<MemoryListResponse> {
  const response = await api.get<MemoryListResponse>('/memory', { params });
  return response.data;
}

/** Get a specific memory by ID. */
export async function getMemory(memoryId: number): Promise<Memory> {
  const response = await api.get<Memory>(`/memory/${memoryId}`);
  return response.data;
}

/** Create a new explicit memory. */
export async function createMemory(data: MemoryCreateRequest): Promise<Memory> {
  const response = await api.post<Memory>('/memory', data);
  return response.data;
}

/** Update an existing memory. */
export async function updateMemory(
  memoryId: number,
  data: MemoryUpdateRequest
): Promise<Memory> {
  const response = await api.patch<Memory>(`/memory/${memoryId}`, data);
  return response.data;
}

/** Delete a memory. */
export async function deleteMemory(memoryId: number): Promise<void> {
  await api.delete(`/memory/${memoryId}`);
}

/** Search memories by query. */
export async function searchMemories(
  data: MemorySearchRequest
): Promise<MemorySearchResponse> {
  const response = await api.post<MemorySearchResponse>('/memory/search', data);
  return response.data;
}

/** Get memory statistics for the current user. */
export async function getMemoryStats(): Promise<MemoryStats> {
  const response = await api.get<MemoryStats>('/memory/stats/summary');
  return response.data;
}
