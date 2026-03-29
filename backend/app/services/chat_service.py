"""
Chat Service - Handles chat orchestration and message management
"""
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.api_key import APIKey
from app.models.token_usage import TokenUsage
from app.services.llm_router import (
    LLMRouter,
    OpenAIProvider,
    AnthropicProvider,
    OllamaProvider,
    RouterAPIProvider
)
from app.utils.security import decrypt_api_key


class ChatService:
    """Service for handling chat operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.router = LLMRouter()
    
    def _get_user_api_key(self, user_id: int, provider: str) -> Optional[str]:
        """Get decrypted API key for user and provider"""
        api_key = self.db.query(APIKey).filter(
            APIKey.user_id == user_id,
            APIKey.provider == provider,
            APIKey.is_active == True
        ).first()
        
        if not api_key:
            return None
        
        return decrypt_api_key(api_key.encrypted_key)
    
    def _initialize_provider(self, user_id: int, provider: str) -> bool:
        """Initialize provider with user's API key"""
        if provider == "ollama":
            # Ollama doesn't need API key
            self.router.add_provider("ollama", OllamaProvider())
            return True
        
        api_key = self._get_user_api_key(user_id, provider)
        if not api_key:
            return False
        
        if provider == "openai":
            self.router.add_provider("openai", OpenAIProvider(api_key))
        elif provider == "anthropic":
            self.router.add_provider("anthropic", AnthropicProvider(api_key))
        elif provider == "router":
            self.router.add_provider("router", RouterAPIProvider(api_key))
        else:
            return False
        
        return True
    
    async def process_message(
        self,
        user_id: int,
        conversation_id: Optional[int],
        message_content: str,
        model: str,
        provider: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None
    ) -> Dict[str, Any]:
        """Process a chat message and return response"""
        
        # Initialize provider
        if not self._initialize_provider(user_id, provider):
            raise ValueError(f"No active API key found for provider: {provider}")
        
        # Get or create conversation
        if conversation_id:
            conversation = self.db.query(Conversation).filter(
                Conversation.id == conversation_id,
                Conversation.user_id == user_id
            ).first()
            
            if not conversation:
                raise ValueError("Conversation not found")
        else:
            # Create new conversation
            conversation = Conversation(
                user_id=user_id,
                title="New Conversation",
                model=model,
                provider=provider
            )
            self.db.add(conversation)
            self.db.commit()
            self.db.refresh(conversation)
        
        # Get conversation history
        messages = self._get_conversation_messages(conversation.id)
        
        # Build messages array for LLM
        llm_messages = []
        
        # Add system prompt if provided
        if system_prompt:
            llm_messages.append({
                "role": "system",
                "content": system_prompt
            })
        
        # Add conversation history
        for msg in messages:
            llm_messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Add current user message
        llm_messages.append({
            "role": "user",
            "content": message_content
        })
        
        # Save user message
        user_message = Message(
            conversation_id=conversation.id,
            role="user",
            content=message_content,
            model=model,
            provider=provider
        )
        self.db.add(user_message)
        self.db.commit()
        self.db.refresh(user_message)
        
        # Get LLM response
        try:
            response = await self.router.chat_completion(
                provider_name=provider,
                messages=llm_messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens,
                stream=False
            )
            
            # Save assistant message
            assistant_message = Message(
                conversation_id=conversation.id,
                role="assistant",
                content=response["content"],
                model=response.get("model", model),
                provider=provider,
                prompt_tokens=response["usage"]["prompt_tokens"],
                completion_tokens=response["usage"]["completion_tokens"],
                total_tokens=response["usage"]["total_tokens"]
            )
            self.db.add(assistant_message)
            
            # Save token usage
            token_usage = TokenUsage(
                user_id=user_id,
                conversation_id=conversation.id,
                model=response.get("model", model),
                provider=provider,
                prompt_tokens=response["usage"]["prompt_tokens"],
                completion_tokens=response["usage"]["completion_tokens"],
                total_tokens=response["usage"]["total_tokens"]
            )
            self.db.add(token_usage)
            
            # Update conversation title if it's the first message
            if conversation.title == "New Conversation" and len(messages) == 0:
                # Generate title from first message (first 50 chars)
                title = message_content[:50]
                if len(message_content) > 50:
                    title += "..."
                conversation.title = title
            
            # Update conversation timestamp
            conversation.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(assistant_message)
            
            return {
                "message": assistant_message,
                "conversation_id": conversation.id,
                "usage": response["usage"]
            }
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Error processing message: {str(e)}")
    
    def save_message(
        self,
        conversation_id: int,
        role: str,
        content: str,
        model: Optional[str] = None,
        provider: Optional[str] = None,
        prompt_tokens: Optional[int] = None,
        completion_tokens: Optional[int] = None,
        total_tokens: Optional[int] = None
    ) -> Message:
        """Save a message to the database"""
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            model=model,
            provider=provider,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message
    
    def get_conversation_messages(self, conversation_id: int, user_id: int) -> List[Message]:
        """Get all messages for a conversation"""
        # Verify conversation belongs to user
        conversation = self.db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        ).first()
        
        if not conversation:
            raise ValueError("Conversation not found")
        
        return self._get_conversation_messages(conversation_id)
    
    def _get_conversation_messages(self, conversation_id: int) -> List[Message]:
        """Internal method to get messages without user verification"""
        return self.db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at).all()
    
    def create_conversation(
        self,
        user_id: int,
        title: str = "New Conversation",
        model: Optional[str] = None,
        provider: Optional[str] = None
    ) -> Conversation:
        """Create a new conversation"""
        conversation = Conversation(
            user_id=user_id,
            title=title,
            model=model,
            provider=provider
        )
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation
    
    def get_user_conversations(self, user_id: int) -> List[Conversation]:
        """Get all conversations for a user"""
        return self.db.query(Conversation).filter(
            Conversation.user_id == user_id
        ).order_by(desc(Conversation.updated_at)).all()
    
    def get_conversation(self, conversation_id: int, user_id: int) -> Optional[Conversation]:
        """Get a specific conversation"""
        return self.db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        ).first()
    
    def update_conversation(
        self,
        conversation_id: int,
        user_id: int,
        title: Optional[str] = None
    ) -> Optional[Conversation]:
        """Update a conversation"""
        conversation = self.get_conversation(conversation_id, user_id)
        if not conversation:
            return None
        
        if title is not None:
            conversation.title = title
        
        conversation.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(conversation)
        return conversation
    
    def delete_conversation(self, conversation_id: int, user_id: int) -> bool:
        """Delete a conversation and all its messages"""
        conversation = self.get_conversation(conversation_id, user_id)
        if not conversation:
            return False
        
        # Delete all messages
        self.db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).delete()
        
        # Delete token usage records
        self.db.query(TokenUsage).filter(
            TokenUsage.conversation_id == conversation_id
        ).delete()
        
        # Delete conversation
        self.db.delete(conversation)
        self.db.commit()
        return True
    
    async def get_available_models(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all available models based on user's API keys"""
        models = []
        
        # Check each provider
        providers = ["openai", "anthropic", "ollama", "router"]
        
        for provider in providers:
            if self._initialize_provider(user_id, provider):
                try:
                    provider_models = await self.router.list_models(provider)
                    models.extend(provider_models)
                except:
                    continue
        
        return models
