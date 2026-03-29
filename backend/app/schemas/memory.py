"""
Pydantic schemas for memory-related API requests and responses.

Defines data validation and serialization models for memory operations.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, validator


class MemoryCreate(BaseModel):
    """Schema for creating a new memory."""
    
    content: str = Field(..., min_length=1, max_length=5000, description="Memory content")
    memory_type: str = Field(..., description="Type of memory: 'explicit' or 'automatic'")
    category: str = Field(..., description="Category: 'preference', 'fact', 'instruction', or 'context'")
    importance: float = Field(default=0.5, ge=0.0, le=1.0, description="Importance score between 0 and 1")
    meta: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")
    source_conversation_id: Optional[int] = Field(default=None, description="Source conversation ID")
    source_message_id: Optional[int] = Field(default=None, description="Source message ID")
    
    @validator("memory_type")
    def validate_memory_type(cls, v):
        """Validate memory type."""
        if v not in ["explicit", "automatic"]:
            raise ValueError("memory_type must be 'explicit' or 'automatic'")
        return v
    
    @validator("category")
    def validate_category(cls, v):
        """Validate category."""
        if v not in ["preference", "fact", "instruction", "context"]:
            raise ValueError("category must be one of: preference, fact, instruction, context")
        return v


class MemoryUpdate(BaseModel):
    """Schema for updating an existing memory."""
    
    content: Optional[str] = Field(None, min_length=1, max_length=5000, description="New memory content")
    importance: Optional[float] = Field(None, ge=0.0, le=1.0, description="New importance score")
    category: Optional[str] = Field(None, description="New category")
    
    @validator("category")
    def validate_category(cls, v):
        """Validate category if provided."""
        if v is not None and v not in ["preference", "fact", "instruction", "context"]:
            raise ValueError("category must be one of: preference, fact, instruction, context")
        return v


class MemoryResponse(BaseModel):
    """Schema for memory response."""
    
    id: int
    user_id: int
    content: str
    memory_type: str
    category: str
    importance: float
    meta: Optional[Dict[str, Any]]
    source_conversation_id: Optional[int]
    source_message_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class MemorySearch(BaseModel):
    """Schema for searching memories."""
    
    query: str = Field(..., min_length=1, max_length=1000, description="Search query")
    top_k: int = Field(default=5, ge=1, le=50, description="Number of results to return")
    memory_type_filter: Optional[str] = Field(default=None, description="Filter by memory type")
    category_filter: Optional[str] = Field(default=None, description="Filter by category")
    min_importance: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="Minimum importance threshold")
    
    @validator("memory_type_filter")
    def validate_memory_type_filter(cls, v):
        """Validate memory type filter if provided."""
        if v is not None and v not in ["explicit", "automatic"]:
            raise ValueError("memory_type_filter must be 'explicit' or 'automatic'")
        return v
    
    @validator("category_filter")
    def validate_category_filter(cls, v):
        """Validate category filter if provided."""
        if v is not None and v not in ["preference", "fact", "instruction", "context"]:
            raise ValueError("category_filter must be one of: preference, fact, instruction, context")
        return v


class MemorySearchResponse(BaseModel):
    """Schema for memory search results."""
    
    memories: List[MemoryResponse]
    total: int


class MemoryStats(BaseModel):
    """Schema for memory statistics."""
    
    total: int
    by_type: Dict[str, int]
    by_category: Dict[str, int]
    average_importance: float


class MemoryListResponse(BaseModel):
    """Schema for listing memories with pagination."""
    
    memories: List[MemoryResponse]
    total: int
    skip: int
    limit: int
