"""
Chat Service - Handles chat orchestration and message management
"""
from typing import List, Optional, Dict, Any, AsyncGenerator
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
from app.services.memory_service import get_memory_service
from app.services.memory_classifier import get_memory_classifier
from app.services.token_tracker import TokenTracker
from app.utils.security import decrypt_api_key


class ChatService:
    """Service for handling chat operations"""
    
    def __init__(self, db: Session):
        self.db = db
        self.router = LLMRouter()
        self.memory_service = get_memory_service()
        self.memory_classifier = get_memory_classifier(self.router)
        self.token_tracker = TokenTracker(db)
    
    def _format_memories_for_context(self, memories: List) -> str:
        """Format memories for injection into system prompt"""
        if not memories:
            return ""
        
        memory_text = "\n\n[RELEVANT MEMORIES]\n"
        memory_text += "The following information has been remembered from previous conversations:\n\n"
        
        for memory in memories:
            memory_type_label = memory.memory_type.value.upper()
            category_label = memory.category.value.capitalize()
            memory_text += f"[{memory_type_label} - {category_label}] {memory.content}\n"
        
        memory_text += "\nPlease use this information to provide more personalized and context-aware responses.\n"
        return memory_text
    
    async def _search_relevant_memories(self, user_id: int, query: str, top_k: int = 5) -> List:
        """Search for relevant memories based on the query"""
        try:
            memories = self.memory_service.search_memories(
                db=self.db,
                user_id=user_id,
                query=query,
                top_k=top_k
            )
            return memories
        except Exception as e:
            print(f"Error searching memories: {e}")
            return []
    
    async def _detect_and_store_explicit_memory(
        self,
        user_id: int,
        message_content: str,
        conversation_id: str,  # UUID
        message_id: str  # UUID
    ) -> Optional[Dict[str, Any]]:
        """Detect and store explicit memory requests"""
        is_explicit, content = self.memory_classifier.detect_explicit_memory(message_content)
        
        if is_explicit and content:
            try:
                category = self.memory_classifier.categorize_memory(content)
                importance = self.memory_classifier.calculate_importance(
                    content, "explicit", category
                )
                
                memory = self.memory_service.add_memory(
                    db=self.db,
                    user_id=user_id,
                    content=content,
                    memory_type="explicit",
                    category=category,
                    importance=importance,
                    source_conversation_id=conversation_id,
                    source_message_id=message_id
                )
                
                return {
                    "id": memory.id,
                    "content": memory.content,
                    "type": memory.memory_type.value,
                    "category": memory.category.value
                }
            except Exception as e:
                print(f"Error storing explicit memory: {e}")
        
        return None
    
    async def _extract_and_store_automatic_memories(
        self,
        user_id: int,
        user_message: str,
        assistant_response: str,
        conversation_id: str,  # UUID
        message_id: str,  # UUID
        api_key: str,
        model: str
    ) -> List[Dict[str, Any]]:
        """Extract and store automatic memories from conversation"""
        try:
            extracted_memories = await self.memory_classifier.extract_automatic_memories(
                message=user_message,
                response=assistant_response,
                api_key=api_key,
                model=model
            )
            
            stored_memories = []
            for mem_data in extracted_memories:
                try:
                    importance = self.memory_classifier.calculate_importance(
                        mem_data["content"],
                        "automatic",
                        mem_data["category"]
                    )
                    
                    memory = self.memory_service.add_memory(
                        db=self.db,
                        user_id=user_id,
                        content=mem_data["content"],
                        memory_type="automatic",
                        category=mem_data["category"],
                        importance=importance,
                        source_conversation_id=conversation_id,
                        source_message_id=message_id
                    )
                    
                    stored_memories.append({
                        "id": memory.id,
                        "content": memory.content,
                        "type": memory.memory_type.value,
                        "category": memory.category.value
                    })
                except Exception as e:
                    print(f"Error storing automatic memory: {e}")
                    continue
            
            return stored_memories
        except Exception as e:
            print(f"Error extracting automatic memories: {e}")
            return []
    
    def _get_user_api_key(self, user_id: int, provider: str) -> Optional[str]:
        """Get decrypted API key for user and provider"""
        api_key = self.db.query(APIKey).filter(
            APIKey.user_id == user_id,
            APIKey.provider == provider,
            APIKey.is_active == True
        ).first()
        
        if not api_key:
            return None
        
        return decrypt_api_key(api_key.api_key)
    
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
        conversation_id: Optional[str],  # UUID
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
                title="New Conversation"
            )
            self.db.add(conversation)
            self.db.commit()
            self.db.refresh(conversation)
        
        # Get conversation history
        messages = self._get_conversation_messages(conversation.id)
        
        # Search for relevant memories
        relevant_memories = await self._search_relevant_memories(user_id, message_content, top_k=5)
        
        # Build messages array for LLM
        llm_messages = []
        
        # Build enhanced system prompt with memories
        enhanced_system_prompt = system_prompt or "You are a helpful AI assistant."
        if relevant_memories:
            memory_context = self._format_memories_for_context(relevant_memories)
            enhanced_system_prompt = enhanced_system_prompt + memory_context
        
        # Add system prompt
        llm_messages.append({
            "role": "system",
            "content": enhanced_system_prompt
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
            content=message_content
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
                token_count=response["usage"]["total_tokens"]
            )
            self.db.add(assistant_message)
            self.db.flush()  # Flush to get the message ID
            
            # Track token usage (now we have the message ID)
            self.token_tracker.track_usage(
                user_id=user_id,
                conversation_id=conversation.id,
                message_id=str(assistant_message.id),
                provider=provider,
                model=response.get("model", model),
                prompt_tokens=response["usage"]["prompt_tokens"],
                completion_tokens=response["usage"]["completion_tokens"],
                total_tokens=response["usage"]["total_tokens"]
            )
            
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
            
            # Detect and store explicit memory
            explicit_memory = await self._detect_and_store_explicit_memory(
                user_id=user_id,
                message_content=message_content,
                conversation_id=conversation.id,
                message_id=user_message.id
            )
            
            # Extract and store automatic memories
            api_key = self._get_user_api_key(user_id, provider)
            automatic_memories = []
            if api_key:
                automatic_memories = await self._extract_and_store_automatic_memories(
                    user_id=user_id,
                    user_message=message_content,
                    assistant_response=response["content"],
                    conversation_id=conversation.id,
                    message_id=assistant_message.id,
                    api_key=api_key,
                    model=model
                )
            
            # Prepare response with memory information
            result = {
                "message": assistant_message,
                "conversation_id": conversation.id,
                "usage": response["usage"],
                "memories_used": [
                    {
                        "id": mem.id,
                        "content": mem.content,
                        "type": mem.memory_type.value,
                        "category": mem.category.value
                    } for mem in relevant_memories
                ] if relevant_memories else []
            }
            
            # Add created memories to response
            if explicit_memory:
                result["explicit_memory_created"] = explicit_memory
            if automatic_memories:
                result["automatic_memories_created"] = automatic_memories
            
            return result
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Error processing message: {str(e)}")
    
    async def process_message_stream(
        self,
        user_id: int,
        conversation_id: Optional[str],  # UUID
        message_content: str,
        model: str,
        provider: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        system_prompt: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Process a chat message and stream the response"""
        
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
                title="New Conversation"
            )
            self.db.add(conversation)
            self.db.commit()
            self.db.refresh(conversation)
            
            # Send conversation created event
            yield {
                "type": "conversation_created",
                "conversation_id": conversation.id
            }
        
        # Get conversation history
        messages = self._get_conversation_messages(conversation.id)
        
        # Search for relevant memories
        relevant_memories = await self._search_relevant_memories(user_id, message_content, top_k=5)
        
        # Build messages array for LLM
        llm_messages = []
        
        # Build enhanced system prompt with memories
        enhanced_system_prompt = system_prompt or "You are a helpful AI assistant."
        if relevant_memories:
            memory_context = self._format_memories_for_context(relevant_memories)
            enhanced_system_prompt = enhanced_system_prompt + memory_context
        
        # Add system prompt
        llm_messages.append({
            "role": "system",
            "content": enhanced_system_prompt
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
            content=message_content
        )
        self.db.add(user_message)
        self.db.commit()
        self.db.refresh(user_message)
        
        # Stream LLM response
        full_response = ""
        prompt_tokens = 0
        completion_tokens = 0
        
        try:
            async for chunk in self.router.chat_completion_stream(
                provider_name=provider,
                messages=llm_messages,
                model=model,
                temperature=temperature,
                max_tokens=max_tokens
            ):
                if chunk.get("type") == "content":
                    content = chunk.get("content", "")
                    full_response += content
                    
                    # Send content chunk
                    yield {
                        "type": "content",
                        "content": content
                    }
                elif chunk.get("type") == "usage":
                    prompt_tokens = chunk.get("prompt_tokens", 0)
                    completion_tokens = chunk.get("completion_tokens", 0)
            
            # Calculate total tokens
            total_tokens = prompt_tokens + completion_tokens
            
            # If no usage info from stream, estimate tokens
            if total_tokens == 0:
                prompt_tokens = self.token_tracker.estimate_tokens(
                    " ".join([m["content"] for m in llm_messages])
                )
                completion_tokens = self.token_tracker.estimate_tokens(full_response)
                total_tokens = prompt_tokens + completion_tokens
            
            # Save assistant message
            assistant_message = Message(
                conversation_id=conversation.id,
                role="assistant",
                content=full_response,
                token_count=total_tokens
            )
            self.db.add(assistant_message)
            self.db.flush()  # Flush to get the message ID
            
            # Track token usage (now we have the message ID)
            self.token_tracker.track_usage(
                user_id=user_id,
                conversation_id=conversation.id,
                message_id=str(assistant_message.id),
                provider=provider,
                model=model,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                total_tokens=total_tokens
            )
            
            # Update conversation title if it's the first message
            if conversation.title == "New Conversation" and len(messages) == 0:
                title = message_content[:50]
                if len(message_content) > 50:
                    title += "..."
                conversation.title = title
            
            # Update conversation timestamp
            conversation.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(assistant_message)
            
            # Send completion event with usage
            yield {
                "type": "complete",
                "message_id": assistant_message.id,
                "conversation_id": conversation.id,
                "usage": {
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": total_tokens
                }
            }
            
            # Process memories in background (don't block stream)
            # Note: In production, this should be done in a background task
            try:
                await self._detect_and_store_explicit_memory(
                    user_id=user_id,
                    message_content=message_content,
                    conversation_id=conversation.id,
                    message_id=user_message.id
                )
                
                api_key = self._get_user_api_key(user_id, provider)
                if api_key:
                    await self._extract_and_store_automatic_memories(
                        user_id=user_id,
                        user_message=message_content,
                        assistant_response=full_response,
                        conversation_id=conversation.id,
                        message_id=assistant_message.id,
                        api_key=api_key,
                        model=model
                    )
            except Exception as e:
                print(f"Error processing memories: {e}")
            
        except Exception as e:
            self.db.rollback()
            raise Exception(f"Error streaming message: {str(e)}")
    
    def save_message(
        self,
        conversation_id: str,  # UUID
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
    
    def get_conversation_messages(self, conversation_id: str, user_id: int) -> List[Message]:
        """Get all messages for a conversation"""
        # Verify conversation belongs to user
        conversation = self.db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        ).first()
        
        if not conversation:
            raise ValueError("Conversation not found")
        
        return self._get_conversation_messages(conversation_id)
    
    def _get_conversation_messages(self, conversation_id: str) -> List[Message]:
        """Internal method to get messages without user verification"""
        return self.db.query(Message).filter(
            Message.conversation_id == conversation_id
        ).order_by(Message.created_at).all()
    
    def create_conversation(
        self,
        user_id: int,
        title: str = "New Conversation"
    ) -> Conversation:
        """Create a new conversation"""
        conversation = Conversation(
            user_id=user_id,
            title=title
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
    
    def get_conversation(self, conversation_id: str, user_id: int) -> Optional[Conversation]:
        """Get a specific conversation"""
        return self.db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        ).first()
    
    def update_conversation(
        self,
        conversation_id: str,  # UUID
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
    
    def delete_conversation(self, conversation_id: str, user_id: int) -> bool:
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
                except Exception as e:
                    # Log error but continue with other providers
                    print(f"Error fetching models from {provider}: {str(e)}")
                    continue
        
        return models
