# Implementation Guide - Multi-Modal AI Chat Interface

## Overview

This guide provides a step-by-step implementation plan with file skeletons and structure. No actual code is included - only the blueprint for building the system.

---

## Phase 1: Project Foundation

### Step 1.1: Create Project Structure

Create the following directory structure:

```
webflow/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI application entry point
│   │   ├── config.py                  # Configuration management
│   │   ├── database.py                # Database connection setup
│   │   ├── models/                    # SQLAlchemy ORM models
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── conversation.py
│   │   │   ├── message.py
│   │   │   ├── api_key.py
│   │   │   └── token_usage.py
│   │   ├── schemas/                   # Pydantic schemas for validation
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── chat.py
│   │   │   ├── memory.py
│   │   │   └── token_usage.py
│   │   ├── routers/                   # API route handlers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── conversations.py
│   │   │   ├── chat.py
│   │   │   ├── memory.py
│   │   │   ├── api_keys.py
│   │   │   └── usage.py
│   │   ├── services/                  # Business logic layer
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── chat_service.py
│   │   │   ├── memory_service.py
│   │   │   ├── llm_router.py
│   │   │   ├── token_tracker.py
│   │   │   ├── embedding_service.py
│   │   │   └── memory_classifier.py
│   │   ├── utils/                     # Helper utilities
│   │   │   ├── __init__.py
│   │   │   ├── security.py
│   │   │   ├── dependencies.py
│   │   │   └── helpers.py
│   │   └── middleware/                # Custom middleware
│   │       ├── __init__.py
│   │       ├── auth_middleware.py
│   │       └── error_handler.py
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_auth.py
│   │   ├── test_chat.py
│   │   └── test_memory.py
│   ├── data/                          # Local data storage
│   │   ├── .gitkeep
│   │   └── chroma/                    # ChromaDB persistence
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── RegisterForm.tsx
│   │   │   ├── chat/
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── CodeBlock.tsx
│   │   │   │   ├── ImageRenderer.tsx
│   │   │   │   ├── MessageInput.tsx
│   │   │   │   └── TokenCounter.tsx
│   │   │   ├── sidebar/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── ConversationList.tsx
│   │   │   │   ├── ConversationItem.tsx
│   │   │   │   └── SearchBar.tsx
│   │   │   ├── memory/
│   │   │   │   ├── MemoryManager.tsx
│   │   │   │   ├── MemoryList.tsx
│   │   │   │   └── MemoryItem.tsx
│   │   │   ├── settings/
│   │   │   │   ├── SettingsPanel.tsx
│   │   │   │   ├── APIKeyManager.tsx
│   │   │   │   └── ModelSelector.tsx
│   │   │   └── common/
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Modal.tsx
│   │   │       ├── Loading.tsx
│   │   │       └── Toast.tsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ChatContext.tsx
│   │   │   └── SettingsContext.tsx
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useChat.ts
│   │   │   ├── useMemory.ts
│   │   │   ├── useTokenUsage.ts
│   │   │   └── useSSE.ts
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── chat.ts
│   │   │   ├── memory.ts
│   │   │   └── sse.ts
│   │   ├── types/
│   │   │   ├── auth.ts
│   │   │   ├── chat.ts
│   │   │   ├── memory.ts
│   │   │   └── api.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   └── constants.ts
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ChatPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── README.md
│
├── plans/                             # Architecture documentation
│   ├── architecture.md
│   └── implementation-guide.md
│
└── README.md                          # Project overview
```

### Step 1.2: Initialize Backend

**File: [`backend/requirements.txt`](backend/requirements.txt)**
```
# Purpose: List all Python dependencies
# Include: FastAPI, SQLAlchemy, ChromaDB, JWT, password hashing, LLM clients
```

**File: [`backend/.env.example`](backend/.env.example)**
```
# Purpose: Template for environment variables
# Include: Database URL, secret keys, CORS origins, default settings
```

**File: [`backend/app/config.py`](backend/app/config.py)**
```
# Purpose: Load and validate configuration from environment
# Include: Pydantic Settings class with all config parameters
```

### Step 1.3: Initialize Frontend

**File: [`frontend/package.json`](frontend/package.json)**
```
# Purpose: Define npm dependencies and scripts
# Include: React, TypeScript, Vite, Tailwind, Axios, React Router
```

**File: [`frontend/vite.config.ts`](frontend/vite.config.ts)**
```
# Purpose: Configure Vite build tool
# Include: Proxy settings for API, plugins, build options
```

**File: [`frontend/tailwind.config.js`](frontend/tailwind.config.js)**
```
# Purpose: Configure Tailwind CSS
# Include: Theme customization, color palette, custom utilities
```

**File: [`frontend/tsconfig.json`](frontend/tsconfig.json)**
```
# Purpose: TypeScript compiler configuration
# Include: Strict mode, path aliases, JSX settings
```

---

## Phase 2: Database Setup

### Step 2.1: SQLite Database Models

**File: [`backend/app/database.py`](backend/app/database.py)**
```
# Purpose: Database connection and session management
# Components:
# - SQLAlchemy engine creation
# - SessionLocal factory
# - Base declarative class
# - get_db dependency function
```

**File: [`backend/app/models/user.py`](backend/app/models/user.py)**
```
# Purpose: User model for authentication
# Fields:
# - id (primary key)
# - email (unique, indexed)
# - password_hash
# - created_at, updated_at
# Relationships:
# - conversations
# - sessions
# - api_keys
```

**File: [`backend/app/models/conversation.py`](backend/app/models/conversation.py)**
```
# Purpose: Conversation/chat session model
# Fields:
# - id (UUID primary key)
# - user_id (foreign key)
# - title
# - created_at, updated_at
# Relationships:
# - messages
# - user
```

**File: [`backend/app/models/message.py`](backend/app/models/message.py)**
```
# Purpose: Individual message in conversation
# Fields:
# - id (UUID primary key)
# - conversation_id (foreign key)
# - role (user/assistant/system)
# - content
# - content_type (text/code/image)
# - metadata (JSON)
# - token_count
# - created_at
# Relationships:
# - conversation
```

**File: [`backend/app/models/api_key.py`](backend/app/models/api_key.py)**
```
# Purpose: Store encrypted API keys per user
# Fields:
# - id (primary key)
# - user_id (foreign key)
# - provider (openai/anthropic/router_api/ollama)
# - api_key (encrypted)
# - is_active
# - created_at
# Relationships:
# - user
```

**File: [`backend/app/models/token_usage.py`](backend/app/models/token_usage.py)**
```
# Purpose: Track token usage per message
# Fields:
# - id (primary key)
# - user_id, conversation_id, message_id (foreign keys)
# - provider, model
# - prompt_tokens, completion_tokens, total_tokens
# - created_at
# Relationships:
# - user, conversation, message
```

### Step 2.2: ChromaDB Setup

**File: [`backend/app/services/embedding_service.py`](backend/app/services/embedding_service.py)**
```
# Purpose: Generate embeddings for memory storage
# Components:
# - Initialize embedding model (sentence-transformers)
# - generate_embedding(text) method
# - batch_generate_embeddings(texts) method
# Model suggestion: all-MiniLM-L6-v2 (fast, good quality)
```

**File: [`backend/app/services/memory_service.py`](backend/app/services/memory_service.py)**
```
# Purpose: Manage ChromaDB operations for memory
# Components:
# - Initialize ChromaDB client with persistence
# - Create/get collection for user memories
# - add_memory(user_id, content, memory_type, metadata)
# - search_memories(user_id, query, top_k, memory_type_filter)
# - get_all_memories(user_id)
# - delete_memory(memory_id)
# - update_memory(memory_id, new_content)
```

---

## Phase 3: Authentication System

### Step 3.1: Security Utilities

**File: [`backend/app/utils/security.py`](backend/app/utils/security.py)**
```
# Purpose: Security helper functions
# Functions:
# - hash_password(password) -> hashed password using bcrypt
# - verify_password(plain, hashed) -> boolean
# - create_access_token(data, expires_delta) -> JWT token
# - decode_access_token(token) -> payload or None
# - encrypt_api_key(key) -> encrypted string
# - decrypt_api_key(encrypted) -> original key
```

### Step 3.2: Authentication Service

**File: [`backend/app/services/auth_service.py`](backend/app/services/auth_service.py)**
```
# Purpose: Business logic for authentication
# Methods:
# - register_user(email, password) -> User
# - authenticate_user(email, password) -> User or None
# - create_session(user_id) -> session token
# - validate_session(token) -> User or None
# - logout(token) -> void
```

### Step 3.3: Auth Schemas

**File: [`backend/app/schemas/auth.py`](backend/app/schemas/auth.py)**
```
# Purpose: Pydantic models for auth requests/responses
# Schemas:
# - UserRegister (email, password)
# - UserLogin (email, password)
# - UserResponse (id, email, created_at)
# - Token (access_token, token_type)
```

### Step 3.4: Auth Router

**File: [`backend/app/routers/auth.py`](backend/app/routers/auth.py)**
```
# Purpose: Authentication API endpoints
# Endpoints:
# - POST /api/auth/register
# - POST /api/auth/login
# - POST /api/auth/logout
# - GET /api/auth/me (requires authentication)
```

### Step 3.5: Auth Middleware

**File: [`backend/app/utils/dependencies.py`](backend/app/utils/dependencies.py)**
```
# Purpose: Dependency injection for auth
# Functions:
# - get_current_user(token: str) -> User
#   - Extract token from Authorization header
#   - Validate and decode JWT
#   - Return user or raise 401
```

### Step 3.6: Frontend Auth Context

**File: [`frontend/src/contexts/AuthContext.tsx`](frontend/src/contexts/AuthContext.tsx)**
```
# Purpose: Global authentication state management
# State:
# - user (User | null)
# - isAuthenticated (boolean)
# - isLoading (boolean)
# Methods:
# - login(email, password)
# - register(email, password)
# - logout()
# - checkAuth() - validate existing token
```

**File: [`frontend/src/services/auth.ts`](frontend/src/services/auth.ts)**
```
# Purpose: Auth API client functions
# Functions:
# - register(email, password) -> Promise<User>
# - login(email, password) -> Promise<Token>
# - logout() -> Promise<void>
# - getCurrentUser() -> Promise<User>
# - Store/retrieve token from localStorage
```

---

## Phase 4: LLM Router Implementation

### Step 4.1: Base Provider Interface

**File: [`backend/app/services/llm_router.py`](backend/app/services/llm_router.py)**
```
# Purpose: Unified interface for multiple LLM providers
# Components:
# 
# 1. BaseProvider (abstract class):
#    - chat_completion(messages, model, stream, **kwargs)
#    - list_models()
#    - count_tokens(text, model)
#
# 2. OpenAIProvider (implements BaseProvider):
#    - Use OpenAI client
#    - Handle streaming with async generators
#    - Map models
#
# 3. AnthropicProvider (implements BaseProvider):
#    - Use Anthropic client
#    - Handle streaming
#    - Map models
#
# 4. OllamaProvider (implements BaseProvider):
#    - Use Ollama API
#    - Handle local models
#
# 5. RouterAPIProvider (implements BaseProvider):
#    - Use Router API client
#    - Support all router models
#
# 6. LLMRouter (main class):
#    - Initialize all providers
#    - route_request(provider, model, messages, stream)
#    - get_available_models(user_id) - based on configured API keys
```

### Step 4.2: API Key Management

**File: [`backend/app/routers/api_keys.py`](backend/app/routers/api_keys.py)**
```
# Purpose: Manage user API keys
# Endpoints:
# - GET /api/keys - list keys (masked)
# - POST /api/keys - add new key
# - DELETE /api/keys/{id} - remove key
# - PATCH /api/keys/{id} - update/toggle active
# - GET /api/models - list available models based on keys
```

**File: [`frontend/src/components/settings/APIKeyManager.tsx`](frontend/src/components/settings/APIKeyManager.tsx)**
```
# Purpose: UI for managing API keys
# Features:
# - List existing keys (masked)
# - Add new key form (provider dropdown, key input)
# - Delete key with confirmation
# - Toggle active/inactive
# - Test connection button
```

---

## Phase 5: Memory System Implementation

### Step 5.1: Memory Classification

**File: [`backend/app/services/memory_classifier.py`](backend/app/services/memory_classifier.py)**
```
# Purpose: Classify and extract memories from conversations
# Components:
#
# 1. detect_explicit_memory(message) -> boolean:
#    - Check for keywords: "remember", "save this", "memorize"
#    - Return true if explicit memory command detected
#
# 2. extract_automatic_memories(message, response) -> List[Memory]:
#    - Use LLM to analyze conversation
#    - Detect preferences (e.g., "I prefer X")
#    - Detect facts (e.g., "I work at Y")
#    - Detect instructions (e.g., "Always do Z")
#    - Return list of extracted memories with categories
#
# 3. calculate_importance(memory, memory_type) -> float:
#    - Explicit memories: 0.9-1.0
#    - Automatic preferences: 0.6-0.8
#    - Automatic facts: 0.5-0.7
#    - Return importance score
```

### Step 5.2: Memory Storage and Retrieval

**File: [`backend/app/schemas/memory.py`](backend/app/schemas/memory.py)**
```
# Purpose: Pydantic schemas for memory operations
# Schemas:
# - MemoryCreate (content, memory_type, category, metadata)
# - MemoryResponse (id, content, memory_type, category, importance, created_at)
# - MemorySearch (query, top_k, memory_type_filter)
# - MemoryUpdate (content, category, importance)
```

**File: [`backend/app/routers/memory.py`](backend/app/routers/memory.py)**
```
# Purpose: Memory management API endpoints
# Endpoints:
# - GET /api/memory - list all user memories
# - POST /api/memory - create explicit memory
# - GET /api/memory/{id} - get specific memory
# - DELETE /api/memory/{id} - delete memory
# - PATCH /api/memory/{id} - update memory
# - POST /api/memory/search - search memories by query
```

### Step 5.3: Context Injection

**File: [`backend/app/services/chat_service.py`](backend/app/services/chat_service.py)**
```
# Purpose: Main chat orchestration service
# Methods:
#
# 1. process_message(user_id, conversation_id, message, model, provider):
#    - Search relevant memories using vector similarity
#    - Rank memories by relevance and importance
#    - Inject top K memories into system prompt
#    - Call LLM router with enriched context
#    - Stream response back
#    - Extract and store new automatic memories
#    - Track token usage
#    - Return response
#
# 2. inject_memory_context(messages, memories) -> messages:
#    - Format memories into system message
#    - Prepend to conversation messages
#    - Return enriched message list
#
# 3. format_memory_for_context(memory) -> string:
#    - Format: "[MEMORY - {type}] {content}"
#    - Include metadata if relevant
```

### Step 5.4: Frontend Memory UI

**File: [`frontend/src/components/memory/MemoryManager.tsx`](frontend/src/components/memory/MemoryManager.tsx)**
```
# Purpose: Memory management interface
# Features:
# - List all memories with filters (explicit/automatic)
# - Search memories
# - View memory details (content, type, category, date)
# - Edit memory content
# - Delete memory with confirmation
# - Add explicit memory manually
# - Visual indicators for memory types
```

---

## Phase 6: Chat Interface

### Step 6.1: Chat Schemas

**File: [`backend/app/schemas/chat.py`](backend/app/schemas/chat.py)**
```
# Purpose: Pydantic schemas for chat operations
# Schemas:
# - MessageCreate (content, content_type, metadata)
# - MessageResponse (id, role, content, content_type, metadata, token_count, created_at)
# - ChatRequest (conversation_id, message, model, provider, stream)
# - ChatStreamChunk (content, done, token_count)
# - ConversationCreate (title)
# - ConversationResponse (id, title, message_count, created_at, updated_at)
```

### Step 6.2: Chat Router

**File: [`backend/app/routers/chat.py`](backend/app/routers/chat.py)**
```
# Purpose: Chat API endpoints
# Endpoints:
# - POST /api/chat/stream - streaming chat (SSE)
#   - Accept: text/event-stream
#   - Yield chunks as they arrive
#   - Include token counts
# - POST /api/chat/complete - non-streaming chat
#   - Return complete response
```

### Step 6.3: Conversation Router

**File: [`backend/app/routers/conversations.py`](backend/app/routers/conversations.py)**
```
# Purpose: Conversation management endpoints
# Endpoints:
# - GET /api/conversations - list all user conversations
# - POST /api/conversations - create new conversation
# - GET /api/conversations/{id} - get conversation with messages
# - DELETE /api/conversations/{id} - delete conversation
# - PATCH /api/conversations/{id} - update title
# - GET /api/conversations/{id}/messages - paginated messages
```

### Step 6.4: Token Tracking

**File: [`backend/app/services/token_tracker.py`](backend/app/services/token_tracker.py)**
```
# Purpose: Track and calculate token usage
# Methods:
# - count_tokens(text, model) -> int
#   - Use tiktoken for OpenAI models
#   - Estimate for other providers
# - track_usage(user_id, conversation_id, message_id, provider, model, prompt_tokens, completion_tokens)
#   - Store in database
# - get_conversation_usage(conversation_id) -> usage stats
# - get_user_usage_summary(user_id, time_range) -> summary
```

**File: [`backend/app/routers/usage.py`](backend/app/routers/usage.py)**
```
# Purpose: Token usage API endpoints
# Endpoints:
# - GET /api/usage/conversation/{id} - get usage for conversation
# - GET /api/usage/summary - get user's overall usage
# - GET /api/usage/stats - usage statistics with filters
```

### Step 6.5: Frontend Chat Components

**File: [`frontend/src/components/chat/ChatInterface.tsx`](frontend/src/components/chat/ChatInterface.tsx)**
```
# Purpose: Main chat interface container
# Components:
# - Message list (scrollable, auto-scroll to bottom)
# - Message input area
# - Token counter display
# - Model selector dropdown
# - Loading indicator during streaming
# - Error display
```

**File: [`frontend/src/components/chat/MessageBubble.tsx`](frontend/src/components/chat/MessageBubble.tsx)**
```
# Purpose: Individual message display
# Features:
# - Different styling for user/assistant
# - Render based on content_type:
#   - text: plain text with markdown
#   - code: CodeBlock component
#   - image: ImageRenderer component
# - Timestamp
# - Token count badge
# - Memory indicator (if memories were used)
```

**File: [`frontend/src/components/chat/CodeBlock.tsx`](frontend/src/components/chat/CodeBlock.tsx)**
```
# Purpose: Syntax-highlighted code display
# Features:
# - Language detection from metadata
# - Syntax highlighting (using Prism.js)
# - Copy button (copies code to clipboard)
# - Language label badge
# - Line numbers (optional)
```

**File: [`frontend/src/components/chat/ImageRenderer.tsx`](frontend/src/components/chat/ImageRenderer.tsx)**
```
# Purpose: Display images in chat
# Features:
# - Responsive sizing
# - Click to expand (lightbox)
# - Loading placeholder
# - Error fallback
# - Alt text support
```

**File: [`frontend/src/components/chat/MessageInput.tsx`](frontend/src/components/chat/MessageInput.tsx)**
```
# Purpose: Message input area
# Features:
# - Textarea with auto-resize
# - Send button
# - Shift+Enter for new line, Enter to send
# - File upload button (for images)
# - Disabled during streaming
# - Character/token count
```

**File: [`frontend/src/components/chat/TokenCounter.tsx`](frontend/src/components/chat/TokenCounter.tsx)**
```
# Purpose: Display token usage
# Features:
# - Current conversation tokens
# - Current message tokens (as typing)
# - Model context limit
# - Visual progress bar
# - Color coding (green/yellow/red based on usage)
```

### Step 6.6: SSE/Streaming Implementation

**File: [`frontend/src/hooks/useSSE.ts`](frontend/src/hooks/useSSE.ts)**
```
# Purpose: Custom hook for Server-Sent Events
# Features:
# - Connect to SSE endpoint
# - Handle incoming chunks
# - Accumulate response
# - Handle errors and reconnection
# - Cleanup on unmount
```

**File: [`frontend/src/services/sse.ts`](frontend/src/services/sse.ts)**
```
# Purpose: SSE client utility
# Functions:
# - createSSEConnection(url, onMessage, onError, onComplete)
# - Parse SSE data format
# - Handle connection lifecycle
```

---

## Phase 7: Sidebar and Navigation

### Step 7.1: Sidebar Components

**File: [`frontend/src/components/sidebar/Sidebar.tsx`](frontend/src/components/sidebar/Sidebar.tsx)**
```
# Purpose: Main sidebar container
# Features:
# - Collapsible (toggle button)
# - New conversation button
# - Search bar
# - Conversation list
# - Memory manager link
# - Settings link
# - User menu (logout)
```

**File: [`frontend/src/components/sidebar/ConversationList.tsx`](frontend/src/components/sidebar/ConversationList.tsx)**
```
# Purpose: List of conversations
# Features:
# - Grouped by date (Today, Yesterday, Last 7 days, etc.)
# - Infinite scroll / pagination
# - Active conversation highlight
# - Click to switch conversation
```

**File: [`frontend/src/components/sidebar/ConversationItem.tsx`](frontend/src/components/sidebar/ConversationItem.tsx)**
```
# Purpose: Individual conversation item
# Features:
# - Title (truncated if long)
# - Last message preview
# - Timestamp
# - Hover actions (rename, delete)
# - Context menu (right-click)
```

**File: [`frontend/src/components/sidebar/SearchBar.tsx`](frontend/src/components/sidebar/SearchBar.tsx)**
```
# Purpose: Search conversations
# Features:
# - Search input with icon
# - Debounced search
# - Filter conversations by title/content
# - Clear button
```

---

## Phase 8: Settings and Configuration

### Step 8.1: Settings Components

**File: [`frontend/src/components/settings/SettingsPanel.tsx`](frontend/src/components/settings/SettingsPanel.tsx)**
```
# Purpose: Main settings container
# Sections:
# - API Keys management
# - Model preferences
# - UI preferences (theme, font size)
# - Memory settings (auto-save preferences)
# - Export/Import data
```

**File: [`frontend/src/components/settings/ModelSelector.tsx`](frontend/src/components/settings/ModelSelector.tsx)**
```
# Purpose: Select default model and provider
# Features:
# - Provider dropdown (based on configured keys)
# - Model dropdown (filtered by provider)
# - Model info (context length, pricing)
# - Save preferences
```

---

## Phase 9: Error Handling and Polish

### Step 9.1: Error Handling

**File: [`backend/app/middleware/error_handler.py`](backend/app/middleware/error_handler.py)**
```
# Purpose: Global error handling middleware
# Features:
# - Catch all exceptions
# - Log errors
# - Return formatted error responses
# - Different handling for dev/prod
```

**File: [`frontend/src/components/common/Toast.tsx`](frontend/src/components/common/Toast.tsx)**
```
# Purpose: Toast notification system
# Features:
# - Success, error, warning, info types
# - Auto-dismiss
# - Queue multiple toasts
# - Position configuration
```

### Step 9.2: Loading States

**File: [`frontend/src/components/common/Loading.tsx`](frontend/src/components/common/Loading.tsx)**
```
# Purpose: Loading indicators
# Variants:
# - Spinner (small, medium, large)
# - Skeleton loaders for messages
# - Full-page loading
# - Inline loading
```

---

## Phase 10: Testing and Documentation

### Step 10.1: Backend Tests

**File: [`backend/tests/test_auth.py`](backend/tests/test_auth.py)**
```
# Purpose: Test authentication flows
# Tests:
# - User registration
# - Login with valid/invalid credentials
# - Token validation
# - Session management
```

**File: [`backend/tests/test_chat.py`](backend/tests/test_chat.py)**
```
# Purpose: Test chat functionality
# Tests:
# - Message creation
# - Streaming responses
# - Token counting
# - Memory injection
```

**File: [`backend/tests/test_memory.py`](backend/tests/test_memory.py)**
```
# Purpose: Test memory system
# Tests:
# - Memory storage and retrieval
# - Vector search accuracy
# - Memory classification
# - Context injection
```

### Step 10.2: API Documentation

**File: [`backend/app/main.py`](backend/app/main.py)**
```
# Purpose: FastAPI application setup
# Include:
# - OpenAPI documentation configuration
# - CORS middleware
# - Router registration
# - Startup/shutdown events
# - Health check endpoint
```

---

## Phase 11: Deployment

### Step 11.1: Docker Configuration

**File: [`backend/Dockerfile`](backend/Dockerfile)**
```
# Purpose: Containerize backend
# Steps:
# - Use Python base image
# - Install dependencies
# - Copy application code
# - Expose port 8000
# - Run with uvicorn
```

**File: [`frontend/Dockerfile`](frontend/Dockerfile)**
```
# Purpose: Containerize frontend
# Steps:
# - Use Node base image for build
# - Install dependencies