/**
 * Memory API service.
 *
 * Functions for memory CRUD and search operations.
 * To be implemented in Phase 5 (Memory System).
 */

import api from './api'
import type { Memory, MemoryCreateRequest, MemorySearchRequest, MemorySearchResponse } from '../types/memory'

/** List all memories for the current user. */
export async function getMemories(): Promise<Memory[]> {
  const response = await api.get<Memory[]>('/memory')
  return response.data
}

/** Create a new explicit memory. */
export async function createMemory(data: MemoryCreateRequest): Promise<Memory> {
  const response = await api.post<Memory>('/memory', data)
  return response.data
}

/** Search memories by query. */
export async function searchMemories(data: MemorySearchRequest): Promise<MemorySearchResponse> {
  const response = await api.post<MemorySearchResponse>('/memory/search', data)
  return response.data
}

/** Delete a memory. */
export async function deleteMemory(memoryId: string): Promise<void> {
  await api.delete(`/memory/${memoryId}`)
}
