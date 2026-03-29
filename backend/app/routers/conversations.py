"""
Conversations Router - API endpoints for conversation management
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.utils.dependencies import get_current_user
from app.schemas.chat import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    ConversationWithMessages,
    MessageResponse
)
from app.services.chat_service import ChatService

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.get("", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all conversations for the current user"""
    chat_service = ChatService(db)
    conversations = chat_service.get_user_conversations(current_user.id)
    
    # Add message count and last message for each conversation
    result = []
    for conv in conversations:
        messages = chat_service._get_conversation_messages(conv.id)
        conv_dict = {
            "id": conv.id,
            "user_id": conv.user_id,
            "title": conv.title,
            "model": conv.model,
            "provider": conv.provider,
            "created_at": conv.created_at,
            "updated_at": conv.updated_at,
            "message_count": len(messages),
            "last_message": messages[-1].content[:100] if messages else None
        }
        result.append(conv_dict)
    
    return result


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    conversation: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new conversation"""
    chat_service = ChatService(db)
    new_conversation = chat_service.create_conversation(
        user_id=current_user.id,
        title=conversation.title
    )
    
    return ConversationResponse(
        id=new_conversation.id,
        user_id=new_conversation.user_id,
        title=new_conversation.title,
        created_at=new_conversation.created_at,
        updated_at=new_conversation.updated_at,
        message_count=0,
        last_message=None
    )


@router.get("/{conversation_id}", response_model=ConversationWithMessages)
async def get_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific conversation with all messages"""
    chat_service = ChatService(db)
    conversation = chat_service.get_conversation(conversation_id, current_user.id)
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    messages = chat_service.get_conversation_messages(conversation_id, current_user.id)
    
    return ConversationWithMessages(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        model=conversation.model,
        provider=conversation.provider,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[MessageResponse.from_orm(msg) for msg in messages]
    )


@router.patch("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: int,
    conversation_update: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a conversation (e.g., change title)"""
    chat_service = ChatService(db)
    updated_conversation = chat_service.update_conversation(
        conversation_id=conversation_id,
        user_id=current_user.id,
        title=conversation_update.title
    )
    
    if not updated_conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    messages = chat_service._get_conversation_messages(conversation_id)
    
    return ConversationResponse(
        id=updated_conversation.id,
        user_id=updated_conversation.user_id,
        title=updated_conversation.title,
        model=updated_conversation.model,
        provider=updated_conversation.provider,
        created_at=updated_conversation.created_at,
        updated_at=updated_conversation.updated_at,
        message_count=len(messages),
        last_message=messages[-1].content[:100] if messages else None
    )


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a conversation and all its messages"""
    chat_service = ChatService(db)
    success = chat_service.delete_conversation(conversation_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return None
