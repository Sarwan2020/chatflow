"""
Memory classifier service for detecting and categorizing memories.

Provides functionality to detect explicit memory requests, extract automatic
memories from conversations, calculate importance scores, and categorize
memory content.
"""

import re
from typing import Dict, List, Optional, Tuple
from app.services.llm_router import LLMRouter


class MemoryClassifier:
    """
    Service for classifying and extracting memories from conversations.
    
    Handles detection of explicit memory requests, automatic memory extraction
    using LLM analysis, importance scoring, and memory categorization.
    """
    
    # Keywords that indicate explicit memory requests
    EXPLICIT_MEMORY_KEYWORDS = [
        r'\bremember\b',
        r'\bdon\'t forget\b',
        r'\bkeep in mind\b',
        r'\bmake a note\b',
        r'\bsave this\b',
        r'\bstore this\b',
        r'\brecall\b',
        r'\bmemorize\b',
    ]
    
    def __init__(self, llm_router: Optional[LLMRouter] = None):
        """
        Initialize the memory classifier.
        
        Args:
            llm_router: Optional LLM router for automatic memory extraction.
        """
        self.llm_router = llm_router
    
    def detect_explicit_memory(self, message: str) -> Tuple[bool, Optional[str]]:
        """
        Detect if a message contains an explicit memory request.
        
        Args:
            message: The user message to analyze.
            
        Returns:
            Tuple of (is_explicit_memory, extracted_content).
            If explicit memory is detected, extracted_content contains the
            memory content without the trigger keywords.
        """
        message_lower = message.lower()
        
        # Check for explicit memory keywords
        for pattern in self.EXPLICIT_MEMORY_KEYWORDS:
            if re.search(pattern, message_lower):
                # Extract the content after the keyword
                content = self._extract_memory_content(message, pattern)
                return True, content
        
        return False, None
    
    def _extract_memory_content(self, message: str, pattern: str) -> str:
        """
        Extract memory content from a message containing a trigger keyword.
        
        Args:
            message: The full message.
            pattern: The regex pattern that was matched.
            
        Returns:
            The extracted memory content.
        """
        # Try to extract content after common patterns
        patterns_to_try = [
            r'remember\s+(?:that\s+)?(.+)',
            r'don\'t forget\s+(?:that\s+)?(.+)',
            r'keep in mind\s+(?:that\s+)?(.+)',
            r'make a note\s+(?:that\s+)?(.+)',
            r'save this[:\s]+(.+)',
            r'store this[:\s]+(.+)',
        ]
        
        for extract_pattern in patterns_to_try:
            match = re.search(extract_pattern, message, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        # If no specific pattern matches, return the whole message
        return message.strip()
    
    async def extract_automatic_memories(
        self,
        message: str,
        response: str,
        api_key: str,
        model: str = "gpt-4o-mini"
    ) -> List[Dict[str, str]]:
        """
        Extract automatic memories from a conversation using LLM analysis.
        
        Analyzes the user message and assistant response to detect preferences,
        facts, and other memorable information.
        
        Args:
            message: The user's message.
            response: The assistant's response.
            api_key: API key for the LLM.
            model: Model to use for analysis.
            
        Returns:
            List of dictionaries containing 'content' and 'category' for each
            detected memory.
        """
        if not self.llm_router:
            return []
        
        # Construct prompt for memory extraction
        extraction_prompt = f"""Analyze the following conversation and extract any important information that should be remembered about the user. Focus on:
- User preferences (likes, dislikes, preferred tools/languages)
- Personal facts (job, location, interests, background)
- Instructions or guidelines the user wants followed
- Important context about their projects or goals

Only extract information that is clearly stated or strongly implied. Return ONLY a JSON array of objects with 'content' and 'category' fields. Categories must be one of: preference, fact, instruction, context.

If there is nothing worth remembering, return an empty array: []

User message: {message}

Assistant response: {response}

Extracted memories (JSON array only):"""

        try:
            # Use LLM to extract memories
            result = await self.llm_router.route_request(
                messages=[{"role": "user", "content": extraction_prompt}],
                model=model,
                api_key=api_key,
                temperature=0.3,
                max_tokens=500
            )
            
            # Parse the response
            import json
            response_text = result.get("content", "[]").strip()
            
            # Try to extract JSON from the response
            # Handle cases where LLM might add markdown code blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()
            
            memories = json.loads(response_text)
            
            # Validate the structure
            if isinstance(memories, list):
                valid_memories = []
                for mem in memories:
                    if isinstance(mem, dict) and "content" in mem and "category" in mem:
                        # Ensure category is valid
                        if mem["category"] in ["preference", "fact", "instruction", "context"]:
                            valid_memories.append(mem)
                return valid_memories
            
            return []
            
        except Exception as e:
            print(f"Error extracting automatic memories: {e}")
            return []
    
    def calculate_importance(
        self,
        memory: str,
        memory_type: str,
        category: str
    ) -> float:
        """
        Calculate an importance score for a memory.
        
        Args:
            memory: The memory content.
            memory_type: Type of memory ('explicit' or 'automatic').
            category: Memory category.
            
        Returns:
            Importance score between 0.0 and 1.0.
        """
        # Base score by type
        if memory_type == "explicit":
            score = 0.8  # Explicit memories are generally more important
        else:
            score = 0.5  # Automatic memories start at medium importance
        
        # Adjust by category
        category_weights = {
            "preference": 0.1,
            "fact": 0.05,
            "instruction": 0.15,
            "context": 0.0,
        }
        score += category_weights.get(category, 0.0)
        
        # Adjust by length (longer, more detailed memories might be more important)
        word_count = len(memory.split())
        if word_count > 20:
            score += 0.05
        elif word_count < 5:
            score -= 0.1
        
        # Ensure score is within bounds
        return max(0.0, min(1.0, score))
    
    def categorize_memory(self, content: str) -> str:
        """
        Categorize a memory based on its content.
        
        Uses keyword matching to determine the most likely category.
        
        Args:
            content: The memory content.
            
        Returns:
            Category string: 'preference', 'fact', 'instruction', or 'context'.
        """
        content_lower = content.lower()
        
        # Preference indicators
        preference_keywords = [
            'prefer', 'like', 'love', 'favorite', 'hate', 'dislike',
            'enjoy', 'want', 'need', 'always use', 'never use'
        ]
        if any(keyword in content_lower for keyword in preference_keywords):
            return "preference"
        
        # Instruction indicators
        instruction_keywords = [
            'always', 'never', 'should', 'must', 'don\'t', 'do not',
            'make sure', 'ensure', 'remember to', 'when you'
        ]
        if any(keyword in content_lower for keyword in instruction_keywords):
            return "instruction"
        
        # Fact indicators (personal information)
        fact_keywords = [
            'i am', 'i\'m', 'my name', 'i work', 'i live', 'my job',
            'my role', 'my company', 'my team', 'i have', 'i\'ve'
        ]
        if any(keyword in content_lower for keyword in fact_keywords):
            return "fact"
        
        # Default to context
        return "context"


# Module-level singleton
_memory_classifier: Optional[MemoryClassifier] = None


def get_memory_classifier(llm_router: Optional[LLMRouter] = None) -> MemoryClassifier:
    """
    Get the singleton MemoryClassifier instance.
    
    Args:
        llm_router: Optional LLM router for automatic memory extraction.
        
    Returns:
        MemoryClassifier: The memory classifier instance.
    """
    global _memory_classifier
    if _memory_classifier is None:
        _memory_classifier = MemoryClassifier(llm_router)
    return _memory_classifier
