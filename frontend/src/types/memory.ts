/**
 * Memory-related TypeScript type definitions.
 */

/** Possible memory types. */
export type MemoryType = 'explicit' | 'automatic';

/** Possible memory categories. */
export type MemoryCategory = 'preference' | 'fact' | 'instruction' | 'context';

/** A stored memory entry. */
export interface Memory {
  id: string;
  content: string;
  memory_type: MemoryType;
  category: MemoryCategory;
  importance: number;
  user_id: string;
  conversation_id?: string;
  message_id?: string;
  created_at: string;
}

/** Request payload for creating a new memory. */
export interface MemoryCreateRequest {
  content: string;
  memory_type?: MemoryType;
  category?: MemoryCategory;
  metadata?: Record<string, unknown>;
}

/** Request payload for updating a memory. */
export interface MemoryUpdateRequest {
  content?: string;
  category?: MemoryCategory;
  importance?: number;
}

/** Request payload for searching memories. */
export interface MemorySearchRequest {
  query: string;
  top_k?: number;
  memory_type_filter?: MemoryType;
}

/** Response from a memory search. */
export interface MemorySearchResponse {
  memories: Memory[];
  distances: number[];
}
