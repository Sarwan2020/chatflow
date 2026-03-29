"""
Memory service for managing user memories with vector search.

Provides CRUD operations for memories, integrating with the database
for persistence and embedding service for vector similarity search.
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.models.memory import Memory, MemoryType, MemoryCategory
from app.services.embedding_service import get_embedding_service
import numpy as np


class MemoryService:
    """
    Service for managing user memories with vector search capabilities.
    
    Handles creation, retrieval, updating, and deletion of memories,
    along with vector similarity search for context-aware retrieval.
    """
    
    def __init__(self):
        """Initialize the memory service."""
        self.embedding_service = get_embedding_service()
    
    def add_memory(
        self,
        db: Session,
        user_id: int,
        content: str,
        memory_type: str,
        category: str,
        importance: float = 0.5,
        meta: Optional[Dict[str, Any]] = None,
        source_conversation_id: Optional[int] = None,
        source_message_id: Optional[int] = None,
    ) -> Memory:
        """
        Add a new memory to the database.
        
        Args:
            db: Database session.
            user_id: ID of the user who owns this memory.
            content: Text content of the memory.
            memory_type: Type of memory ('explicit' or 'automatic').
            category: Memory category ('preference', 'fact', 'instruction', 'context').
            importance: Importance score between 0.0 and 1.0.
            meta: Optional metadata dictionary.
            source_conversation_id: Optional ID of the source conversation.
            source_message_id: Optional ID of the source message.
            
        Returns:
            The created Memory object.
        """
        # Generate embedding for the memory content
        embedding = self.embedding_service.generate_embedding(content)
        
        # Create memory object
        memory = Memory(
            user_id=user_id,
            content=content,
            memory_type=MemoryType(memory_type),
            category=MemoryCategory(category),
            importance=importance,
            embedding=embedding,
            meta=meta or {},
            source_conversation_id=source_conversation_id,
            source_message_id=source_message_id,
        )
        
        db.add(memory)
        db.commit()
        db.refresh(memory)
        
        return memory
    
    def search_memories(
        self,
        db: Session,
        user_id: int,
        query: str,
        top_k: int = 5,
        memory_type_filter: Optional[str] = None,
        category_filter: Optional[str] = None,
        min_importance: Optional[float] = None,
    ) -> List[Memory]:
        """
        Search for relevant memories using vector similarity.
        
        Args:
            db: Database session.
            user_id: Filter results to this user's memories only.
            query: Search query text.
            top_k: Maximum number of results to return.
            memory_type_filter: Optional filter for memory type.
            category_filter: Optional filter for category.
            min_importance: Optional minimum importance threshold.
            
        Returns:
            List of Memory objects sorted by relevance.
        """
        # Generate embedding for the query
        query_embedding = self.embedding_service.generate_embedding(query)
        
        # Build base query with filters
        query_obj = db.query(Memory).filter(Memory.user_id == user_id)
        
        if memory_type_filter:
            query_obj = query_obj.filter(Memory.memory_type == MemoryType(memory_type_filter))
        
        if category_filter:
            query_obj = query_obj.filter(Memory.category == MemoryCategory(category_filter))
        
        if min_importance is not None:
            query_obj = query_obj.filter(Memory.importance >= min_importance)
        
        # Get all matching memories
        memories = query_obj.all()
        
        if not memories:
            return []
        
        # Calculate cosine similarity for each memory
        similarities = []
        for memory in memories:
            if memory.embedding:
                similarity = self._cosine_similarity(query_embedding, memory.embedding)
                similarities.append((memory, similarity))
        
        # Sort by similarity (descending) and return top_k
        similarities.sort(key=lambda x: x[1], reverse=True)
        return [mem for mem, _ in similarities[:top_k]]
    
    def get_all_memories(
        self,
        db: Session,
        user_id: int,
        memory_type_filter: Optional[str] = None,
        category_filter: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Memory]:
        """
        Retrieve all memories for a user with optional filters.
        
        Args:
            db: Database session.
            user_id: The user whose memories to retrieve.
            memory_type_filter: Optional filter for memory type.
            category_filter: Optional filter for category.
            skip: Number of records to skip (pagination).
            limit: Maximum number of records to return.
            
        Returns:
            List of Memory objects.
        """
        query = db.query(Memory).filter(Memory.user_id == user_id)
        
        if memory_type_filter:
            query = query.filter(Memory.memory_type == MemoryType(memory_type_filter))
        
        if category_filter:
            query = query.filter(Memory.category == MemoryCategory(category_filter))
        
        return query.order_by(Memory.created_at.desc()).offset(skip).limit(limit).all()
    
    def get_memory(self, db: Session, memory_id: int, user_id: int) -> Optional[Memory]:
        """
        Retrieve a specific memory by ID.
        
        Args:
            db: Database session.
            memory_id: The unique identifier of the memory.
            user_id: The user ID to verify ownership.
            
        Returns:
            Memory object if found and owned by user, None otherwise.
        """
        return db.query(Memory).filter(
            and_(Memory.id == memory_id, Memory.user_id == user_id)
        ).first()
    
    def delete_memory(self, db: Session, memory_id: int, user_id: int) -> bool:
        """
        Delete a memory from the database.
        
        Args:
            db: Database session.
            memory_id: The unique identifier of the memory to delete.
            user_id: The user ID to verify ownership.
            
        Returns:
            True if deleted successfully, False if not found.
        """
        memory = self.get_memory(db, memory_id, user_id)
        if memory:
            db.delete(memory)
            db.commit()
            return True
        return False
    
    def update_memory(
        self,
        db: Session,
        memory_id: int,
        user_id: int,
        new_content: Optional[str] = None,
        new_importance: Optional[float] = None,
        new_category: Optional[str] = None,
    ) -> Optional[Memory]:
        """
        Update an existing memory's content, importance, or category.
        
        Args:
            db: Database session.
            memory_id: The unique identifier of the memory to update.
            user_id: The user ID to verify ownership.
            new_content: New text content (optional).
            new_importance: New importance score (optional).
            new_category: New category (optional).
            
        Returns:
            Updated Memory object if successful, None if not found.
        """
        memory = self.get_memory(db, memory_id, user_id)
        if not memory:
            return None
        
        # Update content and regenerate embedding if content changed
        if new_content is not None and new_content != memory.content:
            memory.content = new_content
            memory.embedding = self.embedding_service.generate_embedding(new_content)
        
        # Update importance
        if new_importance is not None:
            memory.importance = max(0.0, min(1.0, new_importance))
        
        # Update category
        if new_category is not None:
            memory.category = MemoryCategory(new_category)
        
        memory.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(memory)
        
        return memory
    
    def get_memory_stats(self, db: Session, user_id: int) -> Dict[str, Any]:
        """
        Get statistics about a user's memories.
        
        Args:
            db: Database session.
            user_id: The user whose memory stats to retrieve.
            
        Returns:
            Dictionary containing memory statistics.
        """
        # Total count
        total = db.query(func.count(Memory.id)).filter(Memory.user_id == user_id).scalar()
        
        # Count by type
        explicit_count = db.query(func.count(Memory.id)).filter(
            and_(Memory.user_id == user_id, Memory.memory_type == MemoryType.EXPLICIT)
        ).scalar()
        
        automatic_count = db.query(func.count(Memory.id)).filter(
            and_(Memory.user_id == user_id, Memory.memory_type == MemoryType.AUTOMATIC)
        ).scalar()
        
        # Count by category
        category_counts = {}
        for category in MemoryCategory:
            count = db.query(func.count(Memory.id)).filter(
                and_(Memory.user_id == user_id, Memory.category == category)
            ).scalar()
            category_counts[category.value] = count
        
        # Average importance
        avg_importance = db.query(func.avg(Memory.importance)).filter(
            Memory.user_id == user_id
        ).scalar() or 0.0
        
        return {
            "total": total,
            "by_type": {
                "explicit": explicit_count,
                "automatic": automatic_count,
            },
            "by_category": category_counts,
            "average_importance": round(float(avg_importance), 2),
        }
    
    def _cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        """
        Calculate cosine similarity between two vectors.
        
        Args:
            vec1: First vector.
            vec2: Second vector.
            
        Returns:
            Cosine similarity score between -1 and 1.
        """
        vec1_np = np.array(vec1)
        vec2_np = np.array(vec2)
        
        dot_product = np.dot(vec1_np, vec2_np)
        norm1 = np.linalg.norm(vec1_np)
        norm2 = np.linalg.norm(vec2_np)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))


# Module-level singleton
_memory_service: Optional[MemoryService] = None


def get_memory_service() -> MemoryService:
    """
    Get the singleton MemoryService instance.
    
    Returns:
        MemoryService: The memory service instance.
    """
    global _memory_service
    if _memory_service is None:
        _memory_service = MemoryService()
    return _memory_service
