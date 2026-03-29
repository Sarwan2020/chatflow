"""
Chat Router - API endpoints for chat completion
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, AsyncGenerator
import json
import asyncio

from app.database import get_db
from app.models.user import User
from app.utils.dependencies import get_current_user
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    MessageResponse,
    ModelsResponse,
    ModelInfo
)
from app.services.chat_service import ChatService

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/complete", response_model=ChatResponse)
async def chat_complete(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Send a chat message and get a response
    
    This endpoint handles non-streaming chat completions.
    It will create a new conversation if conversation_id is not provided.
    """
    chat_service = ChatService(db)
    
    try:
        result = await chat_service.process_message(
            user_id=current_user.id,
            conversation_id=request.conversation_id,
            message_content=request.message,
            model=request.model,
            provider=request.provider,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            system_prompt=request.system_prompt
        )
        
        return ChatResponse(
            message=MessageResponse.from_orm(result["message"]),
            conversation_id=result["conversation_id"],
            usage=result["usage"]
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}"
        )


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Stream chat completion responses using Server-Sent Events (SSE).
    
    This endpoint streams response chunks as they arrive from the LLM,
    providing real-time feedback to the user.
    """
    
    async def generate_stream() -> AsyncGenerator[str, None]:
        """Generate SSE stream of chat responses"""
        chat_service = ChatService(db)
        
        try:
            # Process message with streaming
            async for chunk in chat_service.process_message_stream(
                user_id=current_user.id,
                conversation_id=request.conversation_id,
                message_content=request.message,
                model=request.model,
                provider=request.provider,
                temperature=request.temperature,
                max_tokens=request.max_tokens,
                system_prompt=request.system_prompt
            ):
                # Format as SSE
                data = json.dumps(chunk)
                yield f"data: {data}\n\n"
                
                # Small delay to prevent overwhelming the client
                await asyncio.sleep(0.01)
            
            # Send completion event
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
            
        except ValueError as e:
            error_data = json.dumps({
                'type': 'error',
                'error': str(e),
                'code': 'validation_error'
            })
            yield f"data: {error_data}\n\n"
            
        except Exception as e:
            error_data = json.dumps({
                'type': 'error',
                'error': f"Error processing message: {str(e)}",
                'code': 'server_error'
            })
            yield f"data: {error_data}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@router.get("/models", response_model=ModelsResponse)
async def list_models(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all available models based on user's configured API keys
    
    Returns models from all providers that the user has active API keys for.
    """
    chat_service = ChatService(db)
    
    try:
        models_data = await chat_service.get_available_models(current_user.id)
        
        print(f"Models data received: {models_data}")  # Debug log
        
        # Convert to ModelInfo objects
        models = [
            ModelInfo(
                id=model["id"],
                name=model["name"],
                provider=model["provider"],
                context_length=model.get("context_length"),
                supports_vision=model.get("supports_vision", False),
                supports_function_calling=model.get("supports_function_calling", False)
            )
            for model in models_data
        ]
        
        # Get unique providers
        providers = list(set(model.provider for model in models))
        
        return ModelsResponse(
            models=models,
            providers=providers
        )
        
    except Exception as e:
        print(f"Error in list_models endpoint: {str(e)}")  # Debug log
        import traceback
        traceback.print_exc()  # Print full traceback
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching models: {str(e)}"
        )
