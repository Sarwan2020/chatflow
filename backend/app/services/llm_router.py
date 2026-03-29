"""
LLM Router Service - Routes requests to appropriate AI providers
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any, AsyncIterator
import httpx
import json
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
import tiktoken


class BaseProvider(ABC):
    """Abstract base class for LLM providers"""
    
    @abstractmethod
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        **kwargs
    ) -> Any:
        """Send chat completion request"""
        pass
    
    @abstractmethod
    async def list_models(self) -> List[Dict[str, Any]]:
        """List available models"""
        pass
    
    @abstractmethod
    def count_tokens(self, text: str, model: str) -> int:
        """Count tokens in text"""
        pass


class OpenAIProvider(BaseProvider):
    """OpenAI API Provider"""
    
    def __init__(self, api_key: str):
        self.client = AsyncOpenAI(api_key=api_key)
        self.api_key = api_key
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        **kwargs
    ) -> Any:
        """Send chat completion request to OpenAI"""
        try:
            params = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "stream": stream,
            }
            
            if max_tokens:
                params["max_tokens"] = max_tokens
            
            response = await self.client.chat.completions.create(**params)
            
            if stream:
                return response
            
            return {
                "content": response.choices[0].message.content,
                "model": response.model,
                "usage": {
                    "prompt_tokens": response.usage.prompt_tokens,
                    "completion_tokens": response.usage.completion_tokens,
                    "total_tokens": response.usage.total_tokens,
                }
            }
        except Exception as e:
            raise Exception(f"OpenAI API error: {str(e)}")
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """List available OpenAI models"""
        return [
            {"id": "gpt-4o", "name": "GPT-4o", "provider": "openai"},
            {"id": "gpt-4o-mini", "name": "GPT-4o Mini", "provider": "openai"},
            {"id": "gpt-4-turbo", "name": "GPT-4 Turbo", "provider": "openai"},
            {"id": "gpt-4", "name": "GPT-4", "provider": "openai"},
            {"id": "gpt-3.5-turbo", "name": "GPT-3.5 Turbo", "provider": "openai"},
        ]
    
    def count_tokens(self, text: str, model: str) -> int:
        """Count tokens using tiktoken"""
        try:
            encoding = tiktoken.encoding_for_model(model)
            return len(encoding.encode(text))
        except:
            # Fallback to cl100k_base encoding
            encoding = tiktoken.get_encoding("cl100k_base")
            return len(encoding.encode(text))


class AnthropicProvider(BaseProvider):
    """Anthropic API Provider"""
    
    def __init__(self, api_key: str):
        self.client = AsyncAnthropic(api_key=api_key)
        self.api_key = api_key
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        **kwargs
    ) -> Any:
        """Send chat completion request to Anthropic"""
        try:
            # Anthropic requires system message separate
            system_message = None
            anthropic_messages = []
            
            for msg in messages:
                if msg["role"] == "system":
                    system_message = msg["content"]
                else:
                    anthropic_messages.append({
                        "role": msg["role"],
                        "content": msg["content"]
                    })
            
            params = {
                "model": model,
                "messages": anthropic_messages,
                "temperature": temperature,
                "max_tokens": max_tokens or 4096,
                "stream": stream,
            }
            
            if system_message:
                params["system"] = system_message
            
            response = await self.client.messages.create(**params)
            
            if stream:
                return response
            
            return {
                "content": response.content[0].text,
                "model": response.model,
                "usage": {
                    "prompt_tokens": response.usage.input_tokens,
                    "completion_tokens": response.usage.output_tokens,
                    "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
                }
            }
        except Exception as e:
            raise Exception(f"Anthropic API error: {str(e)}")
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """List available Anthropic models"""
        return [
            {"id": "claude-3-5-sonnet-20241022", "name": "Claude 3.5 Sonnet", "provider": "anthropic"},
            {"id": "claude-3-opus-20240229", "name": "Claude 3 Opus", "provider": "anthropic"},
            {"id": "claude-3-sonnet-20240229", "name": "Claude 3 Sonnet", "provider": "anthropic"},
            {"id": "claude-3-haiku-20240307", "name": "Claude 3 Haiku", "provider": "anthropic"},
        ]
    
    def count_tokens(self, text: str, model: str) -> int:
        """Count tokens (approximate for Anthropic)"""
        # Anthropic uses ~4 chars per token
        return len(text) // 4


class OllamaProvider(BaseProvider):
    """Ollama Local API Provider"""
    
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        **kwargs
    ) -> Any:
        """Send chat completion request to Ollama"""
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                payload = {
                    "model": model,
                    "messages": messages,
                    "stream": stream,
                    "options": {
                        "temperature": temperature,
                    }
                }
                
                if max_tokens:
                    payload["options"]["num_predict"] = max_tokens
                
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload
                )
                response.raise_for_status()
                
                if stream:
                    return response
                
                data = response.json()
                return {
                    "content": data["message"]["content"],
                    "model": data["model"],
                    "usage": {
                        "prompt_tokens": data.get("prompt_eval_count", 0),
                        "completion_tokens": data.get("eval_count", 0),
                        "total_tokens": data.get("prompt_eval_count", 0) + data.get("eval_count", 0),
                    }
                }
        except Exception as e:
            raise Exception(f"Ollama API error: {str(e)}")
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """List available Ollama models"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                data = response.json()
                
                return [
                    {
                        "id": model["name"],
                        "name": model["name"],
                        "provider": "ollama",
                        "size": model.get("size", 0)
                    }
                    for model in data.get("models", [])
                ]
        except:
            return []
    
    def count_tokens(self, text: str, model: str) -> int:
        """Count tokens (approximate)"""
        # Rough estimate: ~4 chars per token
        return len(text) // 4


class RouterAPIProvider(BaseProvider):
    """Router API Provider (OpenRouter, etc.)"""
    
    def __init__(self, api_key: str, base_url: str = "https://openrouter.ai/api/v1"):
        self.api_key = api_key
        self.base_url = base_url
    
    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        **kwargs
    ) -> Any:
        """Send chat completion request to Router API"""
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
                
                payload = {
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "stream": stream,
                }
                
                if max_tokens:
                    payload["max_tokens"] = max_tokens
                
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                
                if stream:
                    return response
                
                data = response.json()
                return {
                    "content": data["choices"][0]["message"]["content"],
                    "model": data["model"],
                    "usage": {
                        "prompt_tokens": data["usage"]["prompt_tokens"],
                        "completion_tokens": data["usage"]["completion_tokens"],
                        "total_tokens": data["usage"]["total_tokens"],
                    }
                }
        except Exception as e:
            raise Exception(f"Router API error: {str(e)}")
    
    async def list_models(self) -> List[Dict[str, Any]]:
        """List available Router API models"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                }
                response = await client.get(
                    f"{self.base_url}/models",
                    headers=headers
                )
                response.raise_for_status()
                data = response.json()
                
                return [
                    {
                        "id": model["id"],
                        "name": model.get("name", model["id"]),
                        "provider": "router",
                        "context_length": model.get("context_length", 4096),
                        "supports_vision": model.get("supports_vision", False),
                        "supports_function_calling": model.get("supports_function_calling", False)
                    }
                    for model in data.get("data", [])
                ]
        except Exception as e:
            print(f"Error fetching Router API models: {str(e)}")
            # Return default popular models as fallback
            return [
                {
                    "id": "gpt-4",
                    "name": "GPT-4",
                    "provider": "router",
                    "context_length": 8192,
                    "supports_vision": False,
                    "supports_function_calling": True
                },
                {
                    "id": "gpt-3.5-turbo",
                    "name": "GPT-3.5 Turbo",
                    "provider": "router",
                    "context_length": 4096,
                    "supports_vision": False,
                    "supports_function_calling": True
                },
                {
                    "id": "claude-3-opus-20240229",
                    "name": "Claude 3 Opus",
                    "provider": "router",
                    "context_length": 200000,
                    "supports_vision": True,
                    "supports_function_calling": True
                },
                {
                    "id": "claude-3-sonnet-20240229",
                    "name": "Claude 3 Sonnet",
                    "provider": "router",
                    "context_length": 200000,
                    "supports_vision": True,
                    "supports_function_calling": True
                }
            ]
    
    def count_tokens(self, text: str, model: str) -> int:
        """Count tokens (approximate)"""
        # Use tiktoken as fallback
        try:
            encoding = tiktoken.get_encoding("cl100k_base")
            return len(encoding.encode(text))
        except:
            return len(text) // 4


class LLMRouter:
    """Main LLM Router class"""
    
    def __init__(self):
        self.providers: Dict[str, BaseProvider] = {}
    
    def add_provider(self, provider_name: str, provider: BaseProvider):
        """Add a provider to the router"""
        self.providers[provider_name] = provider
    
    def get_provider(self, provider_name: str) -> Optional[BaseProvider]:
        """Get a provider by name"""
        return self.providers.get(provider_name)
    
    async def chat_completion(
        self,
        provider_name: str,
        messages: List[Dict[str, str]],
        model: str,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        stream: bool = False,
        **kwargs
    ) -> Any:
        """Route chat completion to appropriate provider"""
        provider = self.get_provider(provider_name)
        if not provider:
            raise ValueError(f"Provider '{provider_name}' not found")
        
        return await provider.chat_completion(
            messages=messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=stream,
            **kwargs
        )
    
    async def list_models(self, provider_name: str) -> List[Dict[str, Any]]:
        """List models for a specific provider"""
        provider = self.get_provider(provider_name)
        if not provider:
            return []
        
        return await provider.list_models()
    
    async def list_all_models(self) -> List[Dict[str, Any]]:
        """List all available models from all providers"""
        all_models = []
        for provider_name, provider in self.providers.items():
            try:
                models = await provider.list_models()
                all_models.extend(models)
            except:
                continue
        return all_models
    
    def count_tokens(self, provider_name: str, text: str, model: str) -> int:
        """Count tokens for a specific provider"""
        provider = self.get_provider(provider_name)
        if not provider:
            return 0
        
        return provider.count_tokens(text, model)
