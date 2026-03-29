"""
Embedding service for generating vector embeddings and managing ChromaDB.

Provides integration with sentence-transformers for generating text
embeddings and ChromaDB for persistent vector storage of user memories.
"""

import os
from typing import Any, Dict, List, Optional

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.config import get_settings


class EmbeddingService:
    """
    Service for generating text embeddings using sentence-transformers.

    Uses the configured embedding model (default: all-MiniLM-L6-v2)
    to generate dense vector representations of text for similarity search.

    Attributes:
        model_name: Name of the sentence-transformers model.
        model: Loaded SentenceTransformer model instance (lazy-loaded).
    """

    def __init__(self, model_name: Optional[str] = None) -> None:
        """
        Initialize the embedding service.

        Args:
            model_name: Optional model name override. Defaults to the
                configured EMBEDDING_MODEL setting.
        """
        settings = get_settings()
        self.model_name = model_name or settings.embedding_model
        self._model = None

    @property
    def model(self):
        """
        Lazy-load the sentence-transformers model.

        The model is loaded on first access to avoid slow startup
        times when the embedding service isn't immediately needed.

        Returns:
            SentenceTransformer: The loaded embedding model.
        """
        if self._model is None:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer(self.model_name)
        return self._model

    def generate_embedding(self, text: str) -> List[float]:
        """
        Generate an embedding vector for a single text string.

        Args:
            text: The input text to embed.

        Returns:
            List[float]: The embedding vector as a list of floats.
            
        Raises:
            ValueError: If text is empty or None.
            Exception: If embedding generation fails.
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty for embedding generation")
        
        try:
            embedding = self.model.encode(text, convert_to_numpy=True)
            return embedding.tolist()
        except Exception as e:
            raise Exception(f"Failed to generate embedding: {str(e)}")

    def batch_generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """
        Generate embedding vectors for multiple text strings.

        More efficient than calling generate_embedding() in a loop
        as it batches the encoding operation.

        Args:
            texts: List of input texts to embed.

        Returns:
            List[List[float]]: List of embedding vectors.
            
        Raises:
            ValueError: If texts list is empty or contains invalid entries.
            Exception: If embedding generation fails.
        """
        if not texts:
            raise ValueError("Texts list cannot be empty")
        
        # Filter out empty texts
        valid_texts = [t for t in texts if t and t.strip()]
        if not valid_texts:
            raise ValueError("All texts are empty")
        
        try:
            embeddings = self.model.encode(valid_texts, convert_to_numpy=True)
            return embeddings.tolist()
        except Exception as e:
            raise Exception(f"Failed to generate batch embeddings: {str(e)}")


class ChromaDBService:
    """
    Service for managing ChromaDB vector store operations.

    Handles initialization of the ChromaDB client with persistence,
    collection management, and CRUD operations for user memories.

    Attributes:
        client: ChromaDB persistent client instance.
        collection_name: Name of the memories collection.
        collection: ChromaDB collection for user memories.
    """

    def __init__(self) -> None:
        """
        Initialize the ChromaDB service with persistence configuration.

        Creates the persistence directory if it doesn't exist and
        initializes the ChromaDB client and collection.
        """
        settings = get_settings()
        self.collection_name = settings.chroma_collection_name

        # Ensure persistence directory exists
        persist_dir = settings.chroma_persist_dir
        os.makedirs(persist_dir, exist_ok=True)

        # Initialize ChromaDB client with persistence
        self.client = chromadb.PersistentClient(
            path=persist_dir,
            settings=ChromaSettings(
                anonymized_telemetry=False,
            ),
        )

        # Get or create the user memories collection
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"description": "User memories for context-aware conversations"},
        )

    def add_memory(
        self,
        memory_id: str,
        user_id: str,
        content: str,
        embedding: List[float],
        memory_type: str = "explicit",
        category: str = "general",
        importance: float = 0.5,
        conversation_id: Optional[str] = None,
        message_id: Optional[str] = None,
    ) -> None:
        """
        Add a memory to the ChromaDB collection.

        Args:
            memory_id: Unique identifier for the memory.
            user_id: ID of the user who owns this memory.
            content: Text content of the memory.
            embedding: Pre-computed embedding vector.
            memory_type: Type of memory - 'explicit' or 'automatic'.
            category: Memory category - 'preference', 'fact', 'instruction', 'context'.
            importance: Importance score between 0.0 and 1.0.
            conversation_id: Optional ID of the source conversation.
            message_id: Optional ID of the source message.
        """
        metadata: Dict[str, Any] = {
            "user_id": user_id,
            "memory_type": memory_type,
            "category": category,
            "importance": importance,
        }
        if conversation_id:
            metadata["conversation_id"] = conversation_id
        if message_id:
            metadata["message_id"] = message_id

        self.collection.add(
            ids=[memory_id],
            documents=[content],
            embeddings=[embedding],
            metadatas=[metadata],
        )

    def search_memories(
        self,
        query_embedding: List[float],
        user_id: str,
        top_k: int = 5,
        memory_type_filter: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Search for relevant memories using vector similarity.

        Args:
            query_embedding: Embedding vector of the search query.
            user_id: Filter results to this user's memories only.
            top_k: Maximum number of results to return.
            memory_type_filter: Optional filter for memory type
                ('explicit' or 'automatic').

        Returns:
            Dict containing 'ids', 'documents', 'metadatas', and 'distances'.
        """
        where_filter: Dict[str, Any] = {"user_id": user_id}
        if memory_type_filter:
            where_filter["memory_type"] = memory_type_filter

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_filter,
        )
        return results

    def get_all_memories(self, user_id: str) -> Dict[str, Any]:
        """
        Retrieve all memories for a specific user.

        Args:
            user_id: The user whose memories to retrieve.

        Returns:
            Dict containing 'ids', 'documents', and 'metadatas'.
        """
        results = self.collection.get(
            where={"user_id": user_id},
        )
        return results

    def get_memory(self, memory_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a specific memory by its ID.

        Args:
            memory_id: The unique identifier of the memory.

        Returns:
            Dict with memory data, or None if not found.
        """
        results = self.collection.get(ids=[memory_id])
        if results and results["ids"]:
            return results
        return None

    def update_memory(
        self,
        memory_id: str,
        content: Optional[str] = None,
        embedding: Optional[List[float]] = None,
        metadata_updates: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Update an existing memory's content, embedding, or metadata.

        Args:
            memory_id: The unique identifier of the memory to update.
            content: New text content (optional).
            embedding: New embedding vector (optional).
            metadata_updates: Dictionary of metadata fields to update (optional).
        """
        update_kwargs: Dict[str, Any] = {"ids": [memory_id]}
        if content is not None:
            update_kwargs["documents"] = [content]
        if embedding is not None:
            update_kwargs["embeddings"] = [embedding]
        if metadata_updates is not None:
            update_kwargs["metadatas"] = [metadata_updates]

        self.collection.update(**update_kwargs)

    def delete_memory(self, memory_id: str) -> None:
        """
        Delete a memory from the collection.

        Args:
            memory_id: The unique identifier of the memory to delete.
        """
        self.collection.delete(ids=[memory_id])

    def get_collection_count(self) -> int:
        """
        Get the total number of memories in the collection.

        Returns:
            int: Number of memories stored.
        """
        return self.collection.count()


# Module-level singleton instances (lazy initialization)
_embedding_service: Optional[EmbeddingService] = None
_chromadb_service: Optional[ChromaDBService] = None


def get_embedding_service() -> EmbeddingService:
    """
    Get the singleton EmbeddingService instance.

    Returns:
        EmbeddingService: The embedding service instance.
    """
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service


def get_chromadb_service() -> ChromaDBService:
    """
    Get the singleton ChromaDBService instance.

    Returns:
        ChromaDBService: The ChromaDB service instance.
    """
    global _chromadb_service
    if _chromadb_service is None:
        _chromadb_service = ChromaDBService()
    return _chromadb_service
