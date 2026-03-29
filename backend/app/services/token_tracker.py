"""
Token tracking service for monitoring LLM usage.

Provides accurate token counting for OpenAI models using tiktoken,
estimation for other providers, and usage tracking/analytics.
"""

from datetime import datetime, timedelta
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.models.token_usage import TokenUsage
from app.models.message import Message


class TokenTracker:
    """Service for tracking and analyzing token usage"""
    
    def __init__(self, db: Session):
        self.db = db
        self._tiktoken_cache = {}
    
    def count_tokens(self, text: str, model: str) -> int:
        """
        Count tokens accurately for OpenAI models using tiktoken.
        
        Args:
            text: Text to count tokens for
            model: Model name (e.g., 'gpt-4', 'gpt-3.5-turbo')
            
        Returns:
            Number of tokens
        """
        try:
            import tiktoken
            
            # Get or create encoder for this model
            if model not in self._tiktoken_cache:
                try:
                    self._tiktoken_cache[model] = tiktoken.encoding_for_model(model)
                except KeyError:
                    # Fallback to cl100k_base for unknown models
                    self._tiktoken_cache[model] = tiktoken.get_encoding("cl100k_base")
            
            encoder = self._tiktoken_cache[model]
            return len(encoder.encode(text))
        except ImportError:
            # Fallback to estimation if tiktoken not available
            return self.estimate_tokens(text)
    
    def estimate_tokens(self, text: str) -> int:
        """
        Estimate token count for non-OpenAI providers.
        
        Uses a simple heuristic: ~4 characters per token on average.
        
        Args:
            text: Text to estimate tokens for
            
        Returns:
            Estimated number of tokens
        """
        # Simple estimation: ~4 chars per token
        return len(text) // 4
    
    def track_usage(
        self,
        user_id: int,
        conversation_id: str,
        message_id: str,
        provider: str,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        total_tokens: int
    ) -> TokenUsage:
        """
        Track token usage for a message.
        
        Args:
            user_id: User ID
            conversation_id: Conversation ID
            message_id: Message ID
            provider: LLM provider (openai, anthropic, etc.)
            model: Model name
            prompt_tokens: Tokens in prompt
            completion_tokens: Tokens in completion
            total_tokens: Total tokens used
            
        Returns:
            Created TokenUsage record
        """
        usage = TokenUsage(
            user_id=user_id,
            conversation_id=conversation_id,
            message_id=message_id,
            provider=provider,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=total_tokens
        )
        
        self.db.add(usage)
        self.db.commit()
        self.db.refresh(usage)
        
        return usage
    
    def get_conversation_usage(self, conversation_id: str) -> Dict:
        """
        Get total token usage for a conversation.
        
        Args:
            conversation_id: Conversation ID
            
        Returns:
            Dictionary with usage statistics
        """
        result = self.db.query(
            func.sum(TokenUsage.prompt_tokens).label('total_prompt_tokens'),
            func.sum(TokenUsage.completion_tokens).label('total_completion_tokens'),
            func.sum(TokenUsage.total_tokens).label('total_tokens'),
            func.count(TokenUsage.id).label('message_count')
        ).filter(
            TokenUsage.conversation_id == conversation_id
        ).first()
        
        return {
            'conversation_id': conversation_id,
            'total_prompt_tokens': result.total_prompt_tokens or 0,
            'total_completion_tokens': result.total_completion_tokens or 0,
            'total_tokens': result.total_tokens or 0,
            'message_count': result.message_count or 0
        }
    
    def get_user_usage_summary(
        self,
        user_id: int,
        time_range: Optional[str] = None
    ) -> Dict:
        """
        Get usage summary for a user.
        
        Args:
            user_id: User ID
            time_range: Time range filter ('day', 'week', 'month', 'all')
            
        Returns:
            Dictionary with usage statistics
        """
        query = self.db.query(
            TokenUsage.provider,
            TokenUsage.model,
            func.sum(TokenUsage.prompt_tokens).label('total_prompt_tokens'),
            func.sum(TokenUsage.completion_tokens).label('total_completion_tokens'),
            func.sum(TokenUsage.total_tokens).label('total_tokens'),
            func.count(TokenUsage.id).label('request_count')
        ).filter(TokenUsage.user_id == user_id)
        
        # Apply time range filter
        if time_range and time_range != 'all':
            now = datetime.utcnow()
            if time_range == 'day':
                start_date = now - timedelta(days=1)
            elif time_range == 'week':
                start_date = now - timedelta(weeks=1)
            elif time_range == 'month':
                start_date = now - timedelta(days=30)
            else:
                start_date = None
            
            if start_date:
                query = query.filter(TokenUsage.created_at >= start_date)
        
        # Group by provider and model
        results = query.group_by(TokenUsage.provider, TokenUsage.model).all()
        
        # Calculate totals
        total_prompt = 0
        total_completion = 0
        total_tokens = 0
        total_requests = 0
        
        by_provider = {}
        
        for row in results:
            provider = row.provider
            model = row.model
            prompt_tokens = row.total_prompt_tokens or 0
            completion_tokens = row.total_completion_tokens or 0
            tokens = row.total_tokens or 0
            requests = row.request_count or 0
            
            total_prompt += prompt_tokens
            total_completion += completion_tokens
            total_tokens += tokens
            total_requests += requests
            
            if provider not in by_provider:
                by_provider[provider] = {
                    'provider': provider,
                    'total_tokens': 0,
                    'total_requests': 0,
                    'models': {}
                }
            
            by_provider[provider]['total_tokens'] += tokens
            by_provider[provider]['total_requests'] += requests
            by_provider[provider]['models'][model] = {
                'model': model,
                'prompt_tokens': prompt_tokens,
                'completion_tokens': completion_tokens,
                'total_tokens': tokens,
                'request_count': requests
            }
        
        return {
            'user_id': user_id,
            'time_range': time_range or 'all',
            'total_prompt_tokens': total_prompt,
            'total_completion_tokens': total_completion,
            'total_tokens': total_tokens,
            'total_requests': total_requests,
            'by_provider': list(by_provider.values())
        }
    
    def get_usage_stats(
        self,
        user_id: int,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[Dict]:
        """
        Get detailed usage statistics with date filters.
        
        Args:
            user_id: User ID
            start_date: Start date for filtering
            end_date: End date for filtering
            
        Returns:
            List of usage records
        """
        query = self.db.query(TokenUsage).filter(TokenUsage.user_id == user_id)
        
        if start_date:
            query = query.filter(TokenUsage.created_at >= start_date)
        if end_date:
            query = query.filter(TokenUsage.created_at <= end_date)
        
        query = query.order_by(TokenUsage.created_at.desc())
        
        results = query.all()
        
        return [
            {
                'id': usage.id,
                'conversation_id': usage.conversation_id,
                'message_id': usage.message_id,
                'provider': usage.provider,
                'model': usage.model,
                'prompt_tokens': usage.prompt_tokens,
                'completion_tokens': usage.completion_tokens,
                'total_tokens': usage.total_tokens,
                'created_at': usage.created_at.isoformat()
            }
            for usage in results
        ]
