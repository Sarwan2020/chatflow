"""
Memory router for managing user memories.

Provides REST API endpoints for CRUD operations on memories,
including search, statistics, and filtering capabilities.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.schemas.memory import (
    MemoryCreate,
    MemoryUpdate,
    MemoryResponse,
    MemorySearch,
    MemorySearchResponse,
    MemoryStats,
    MemoryListResponse,
)
from app.services.memory_service import get_memory_service
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/memory", tags=["memory"])


@router.get("", response_model=MemoryListResponse)
async def list_memories(
    memory_type: Optional[str] = Query(None, description="Filter by memory type"),
    category: Optional[str] = Query(None, description="Filter by category"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of records"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all memories for the current user with optional filters.
    
    Supports filtering by memory type and category, with pagination.
    """
    memory_service = get_memory_service()
    
    # Get filtered memories
    memories = memory_service.get_all_memories(
        db=db,
        user_id=current_user.id,
        memory_type_filter=memory_type,
        category_filter=category,
        skip=skip,
        limit=limit,
    )
    
    # Get total count for pagination
    stats = memory_service.get_memory_stats(db, current_user.id)
    total = stats["total"]
    
    return MemoryListResponse(
        memories=memories,
        total=total,
        skip=skip,
        limit=limit,
    )


@router.post("", response_model=MemoryResponse, status_code=status.HTTP_201_CREATED)
async def create_memory(
    memory_data: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new explicit memory.
    
    Generates an embedding for the memory content and stores it in the database.
    """
    memory_service = get_memory_service()
    
    try:
        memory = memory_service.add_memory(
            db=db,
            user_id=current_user.id,
            content=memory_data.content,
            memory_type=memory_data.memory_type,
            category=memory_data.category,
            importance=memory_data.importance,
            meta=memory_data.meta,
            source_conversation_id=memory_data.source_conversation_id,
            source_message_id=memory_data.source_message_id,
        )
        return memory
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create memory: {str(e)}",
        )


@router.get("/{memory_id}", response_model=MemoryResponse)
async def get_memory(
    memory_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve a specific memory by ID.
    
    Returns 404 if the memory doesn't exist or doesn't belong to the current user.
    """
    memory_service = get_memory_service()
    
    memory = memory_service.get_memory(db, memory_id, current_user.id)
    if not memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found",
        )
    
    return memory


@router.delete("/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(
    memory_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a memory by ID.
    
    Returns 404 if the memory doesn't exist or doesn't belong to the current user.
    """
    memory_service = get_memory_service()
    
    success = memory_service.delete_memory(db, memory_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found",
        )
    
    return None


@router.patch("/{memory_id}", response_model=MemoryResponse)
async def update_memory(
    memory_id: int,
    memory_data: MemoryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a memory's content, importance, or category.
    
    If content is updated, a new embedding will be generated.
    Returns 404 if the memory doesn't exist or doesn't belong to the current user.
    """
    memory_service = get_memory_service()
    
    try:
        memory = memory_service.update_memory(
            db=db,
            memory_id=memory_id,
            user_id=current_user.id,
            new_content=memory_data.content,
            new_importance=memory_data.importance,
            new_category=memory_data.category,
        )
        
        if not memory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Memory not found",
            )
        
        return memory
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update memory: {str(e)}",
        )


@router.post("/search", response_model=MemorySearchResponse)
async def search_memories(
    search_data: MemorySearch,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Search memories using vector similarity.
    
    Finds the most relevant memories based on the query text using
    cosine similarity of embeddings.
    """
    memory_service = get_memory_service()
    
    try:
        memories = memory_service.search_memories(
            db=db,
            user_id=current_user.id,
            query=search_data.query,
            top_k=search_data.top_k,
            memory_type_filter=search_data.memory_type_filter,
            category_filter=search_data.category_filter,
            min_importance=search_data.min_importance,
        )
        
        return MemorySearchResponse(
            memories=memories,
            total=len(memories),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search memories: {str(e)}",
        )


@router.get("/stats/summary", response_model=MemoryStats)
async def get_memory_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get statistics about the current user's memories.
    
    Returns counts by type and category, plus average importance score.
    """
    memory_service = get_memory_service()
    
    stats = memory_service.get_memory_stats(db, current_user.id)
    return MemoryStats(**stats)
