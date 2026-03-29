/**
 * Memory-related TypeScript type definitions.
 */

/** Possible memory types. */
export type MemoryType = 'explicit' | 'automatic';

/** Possible memory categories. */
export type MemoryCategory = 'preference' | 'fact' | 'instruction' | 'context';

/** A stored memory entry. */
export interface Memory {
  id: number;
  user_id: number;
  content: string;
  memory_type: MemoryType;
  category: MemoryCategory;
  importance: number;
  meta?: Record<string, any>;
  source_conversation_id?: number;
  source_message_id?: number;
  created_at: string;
  updated_at: string;
}

/** Request payload for creating a new memory. */
export interface MemoryCreateRequest {
  content: string;
  memory_type: MemoryType;
  category: MemoryCategory;
  importance?: number;
  meta?: Record<string, any>;
  source_conversation_id?: number;
  source_message_id?: number;
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
  category_filter?: MemoryCategory;
  min_importance?: number;
}

/** Response from a memory search. */
export interface MemorySearchResponse {
  memories: Memory[];
  total: number;
}

/** Response from listing memories. */
export interface MemoryListResponse {
  memories: Memory[];
  total: number;
  skip: number;
  limit: number;
}

/** Memory statistics. */
export interface MemoryStats {
  total: number;
  by_type: {
    explicit: number;
    automatic: number;
  };
  by_category: {
    preference: number;
    fact: number;
    instruction: number;
    context: number;
  };
  average_importance: number;
}

/** Memory information included in chat responses. */
export interface MemoryInfo {
  id: number;
  content: string;
  type: MemoryType;
  category: MemoryCategory;
}
