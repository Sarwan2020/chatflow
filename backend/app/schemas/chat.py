"""
Chat Schemas - Pydantic models for chat-related requests/responses
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class MessageCreate(BaseModel):
    """Schema for creating a message"""
    conversation_id: int
    role: str = Field(..., pattern="^(user|assistant|system)$")
    content: str
    model: Optional[str] = None
    provider: Optional[str] = None
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_tokens: Optional[int] = None


class MessageResponse(BaseModel):
    """Schema for message response"""
    id: int
    conversation_id: int
    role: str
    content: str
    model: Optional[str] = None
    provider: Optional[str] = None
    prompt_tokens: Optional[int] = None
    completion_tokens: Optional[int] = None
    total_tokens: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    """Schema for chat completion request"""
    conversation_id: Optional[int] = None
    message: str
    model: str
    provider: str
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, ge=1, le=32000)
    system_prompt: Optional[str] = None


class ChatResponse(BaseModel):
    """Schema for chat completion response"""
    message: MessageResponse
    conversation_id: int
    usage: Dict[str, int]


class ConversationCreate(BaseModel):
    """Schema for creating a conversation"""
    title: Optional[str] = "New Conversation"
    model: Optional[str] = None
    provider: Optional[str] = None


class ConversationUpdate(BaseModel):
    """Schema for updating a conversation"""
    title: Optional[str] = None


class ConversationResponse(BaseModel):
    """Schema for conversation response"""
    id: str  # UUID
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime
    message_count: Optional[int] = 0
    last_message: Optional[str] = None
    
    class Config:
        from_attributes = True


class ConversationWithMessages(BaseModel):
    """Schema for conversation with messages"""
    id: str  # UUID
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = []
    
    class Config:
        from_attributes = True


class APIKeyCreate(BaseModel):
    """Schema for creating an API key"""
    provider: str = Field(..., pattern="^(openai|anthropic|ollama|router)$")
    key_value: str
    name: Optional[str] = None


class APIKeyUpdate(BaseModel):
    """Schema for updating an API key"""
    is_active: Optional[bool] = None
    name: Optional[str] = None


class APIKeyResponse(BaseModel):
    """Schema for API key response"""
    id: int
    user_id: int
    provider: str
    name: Optional[str] = None
    key_preview: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ModelInfo(BaseModel):
    """Schema for model information"""
    id: str
    name: str
    provider: str
    context_length: Optional[int] = None
    supports_vision: Optional[bool] = False
    supports_function_calling: Optional[bool] = False


class ModelsResponse(BaseModel):
    """Schema for models list response"""
    models: List[ModelInfo]
    providers: List[str]
