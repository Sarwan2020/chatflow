# Implementation Prompts for Multi-Modal AI Chat Interface

This document contains detailed prompts you can use to request implementation of each phase of the project.

---

## 🚀 Phase 1: Project Foundation & Setup

### Prompt for Phase 1:

```
I need you to implement Phase 1 of the Multi-Modal AI Chat Interface project. Please follow the architecture documented in plans/architecture.md and plans/implementation-guide.md.

Phase 1 Tasks:
1. Create the complete project directory structure for both backend and frontend
2. Set up the backend with FastAPI:
   - Create requirements.txt with all necessary dependencies
   - Create .env.example file with all required environment variables
   - Implement config.py for configuration management using Pydantic Settings
   - Set up database.py with SQLAlchemy connection and session management
   - Create all database models (User, Conversation, Message, APIKey, TokenUsage)
   - Create an init_db.py script to initialize the database tables

3. Set up the frontend with React + Vite + TypeScript:
   - Initialize Vite project with React and TypeScript
   - Install and configure Tailwind CSS
   - Set up vite.config.ts with API proxy to backend
   - Create TypeScript type definitions for all data models
   - Set up the basic component structure (folders only, no implementation yet)

4. Set up ChromaDB:
   - Create embedding_service.py with sentence-transformers integration
   - Initialize ChromaDB client with persistence configuration
   - Create the user_memories collection structure

Requirements:
- Follow the exact file structure from plans/implementation-guide.md
- Use the database schema from plans/architecture.md
- Include proper error handling and type hints
- Add docstrings to all classes and functions
- Create .gitignore files for both backend and frontend
- Ensure all configuration is loaded from environment variables

After completion, I should be able to:
- Run `pip install -r requirements.txt` successfully
- Run `python -m app.init_db` to create database tables
- Run `npm install` in frontend successfully
- Start both backend and frontend servers without errors
```

---

## 🔐 Phase 2: Authentication System

### Prompt for Phase 2:

```
Implement Phase 2: Authentication System for the Multi-Modal AI Chat Interface.

Reference: plans/architecture.md and plans/implementation-guide.md

Phase 2 Tasks:

Backend:
1. Implement utils/security.py with:
   - hash_password() using bcrypt
   - verify_password() for authentication
   - create_access_token() for JWT generation
   - decode_access_token() for JWT validation
   - encrypt_api_key() and decrypt_api_key() for API key storage

2. Create schemas/auth.py with Pydantic models:
   - UserRegister (email, password validation)
   - UserLogin (email, password)
   - UserResponse (id, email, created_at)
   - Token (access_token, token_type)

3. Implement services/auth_service.py with:
   - register_user() - create new user with hashed password
   - authenticate_user() - verify credentials
   - create_session() - generate JWT token
   - validate_session() - verify token and return user
   - logout() - invalidate session

4. Create routers/auth.py with endpoints:
   - POST /api/auth/register
   - POST /api/auth/login
   - POST /api/auth/logout
   - GET /api/auth/me (protected)

5. Implement utils/dependencies.py:
   - get_current_user() dependency for protected routes
   - get_db() dependency for database sessions

6. Update main.py to register auth router and configure CORS

Frontend:
1. Create types/auth.ts with TypeScript interfaces

2. Implement services/auth.ts with API client functions:
   - register()
   - login()
   - logout()
   - getCurrentUser()
   - Token storage in localStorage

3. Create contexts/AuthContext.tsx with:
   - Auth state management (user, isAuthenticated, isLoading)
   - login(), register(), logout() methods
   - checkAuth() to validate existing tokens
   - Automatic token refresh logic

4. Implement components/auth/:
   - LoginForm.tsx with email/password inputs
   - RegisterForm.tsx with validation
   - Form validation and error display

5. Create pages/:
   - LoginPage.tsx
   - RegisterPage.tsx

6. Update App.tsx with:
   - AuthContext provider
   - Protected route logic
   - Redirect logic based on auth state

Requirements:
- Use bcrypt for password hashing (min 10 rounds)
- JWT tokens should expire in 7 days (configurable)
- Include proper error messages for invalid credentials
- Frontend should store JWT in localStorage
- Add loading states during authentication
- Include form validation (email format, password strength)
- Implement automatic token refresh before expiration

After completion, I should be able to:
- Register a new user account
- Login with email and password
- Access protected routes only when authenticated
- See proper error messages for invalid credentials
- Stay logged in after page refresh
```

---

## 💬 Phase 3: Basic Chat Implementation

### Prompt for Phase 3:

```
Implement Phase 3: Basic Chat System for the Multi-Modal AI Chat Interface.

Reference: plans/architecture.md and plans/implementation-guide.md

Phase 3 Tasks:

Backend:
1. Implement services/llm_router.py with:
   - BaseProvider abstract class with chat_completion(), list_models(), count_tokens()
   - OpenAIProvider implementation
   - AnthropicProvider implementation
   - OllamaProvider implementation
   - RouterAPIProvider implementation
   - LLMRouter main class to route requests to appropriate provider

2. Create schemas/chat.py with:
   - MessageCreate, MessageResponse
   - ChatRequest, ChatResponse
   - ConversationCreate, ConversationResponse

3. Implement services/chat_service.py with:
   - process_message() - main chat orchestration
   - save_message() - store messages in database
   - get_conversation_messages() - retrieve message history

4. Create routers/conversations.py with endpoints:
   - GET /api/conversations - list all user conversations
   - POST /api/conversations - create new conversation
   - GET /api/conversations/{id} - get conversation with messages
   - DELETE /api/conversations/{id} - delete conversation
   - PATCH /api/conversations/{id} - update conversation title

5. Create routers/chat.py with:
   - POST /api/chat/complete - non-streaming chat endpoint
   - GET /api/models - list available models based on user's API keys

6. Implement routers/api_keys.py with:
   - GET /api/keys - list user's API keys (masked)
   - POST /api/keys - add new API key
   - DELETE /api/keys/{id} - delete API key
   - PATCH /api/keys/{id} - toggle active status

Frontend:
1. Create types/chat.ts with all chat-related TypeScript interfaces

2. Implement services/chat.ts with:
   - sendMessage()
   - getConversations()
   - createConversation()
   - deleteConversation()
   - getMessages()

3. Create contexts/ChatContext.tsx with:
   - Current conversation state
   - Messages array
   - sendMessage() method
   - switchConversation() method
   - Loading and error states

4. Implement components/chat/:
   - ChatInterface.tsx - main chat container
   - MessageBubble.tsx - individual message display
   - MessageInput.tsx - input area with send button
   - MessageList.tsx - scrollable message container

5. Implement components/sidebar/:
   - Sidebar.tsx - main sidebar container
   - ConversationList.tsx - list of conversations
   - ConversationItem.tsx - individual conversation item
   - NewConversationButton.tsx

6. Create pages/ChatPage.tsx with:
   - Layout with sidebar and chat interface
   - Conversation switching logic
   - New conversation creation

7. Implement components/settings/APIKeyManager.tsx:
   - List API keys (masked)
   - Add new API key form
   - Delete API key with confirmation
   - Provider selection dropdown

Requirements:
- Support OpenAI, Anthropic, Ollama, and Router API
- Store API keys encrypted in database
- Handle API errors gracefully
- Show loading states during API calls
- Auto-scroll to bottom when new messages arrive
- Group conversations by date (Today, Yesterday, etc.)
- Implement proper error boundaries
- Add retry logic for failed API calls

After completion, I should be able to:
- Add API keys for different providers
- Create new conversations
- Send messages and receive responses
- Switch between conversations
- See conversation history in sidebar
- Delete conversations
- See proper error messages for API failures
```

---

## 🧠 Phase 4: Memory System Implementation

### Prompt for Phase 4:

```
Implement Phase 4: Persistent Memory System for the Multi-Modal AI Chat Interface.

Reference: plans/architecture.md and plans/implementation-guide.md

Phase 4 Tasks:

Backend:
1. Enhance services/embedding_service.py:
   - Initialize sentence-transformers model (all-MiniLM-L6-v2)
   - generate_embedding(text) method
   - batch_generate_embeddings(texts) method
   - Handle embedding errors gracefully

2. Implement services/memory_classifier.py with:
   - detect_explicit_memory(message) - check for "remember" keywords
   - extract_automatic_memories(message, response) - use LLM to detect preferences/facts
   - calculate_importance(memory, memory_type) - score 0-1
   - categorize_memory(content) - classify as preference/fact/instruction/context

3. Enhance services/memory_service.py with:
   - add_memory(user_id, content, memory_type, category, metadata)
   - search_memories(user_id, query, top_k, memory_type_filter)
   - get_all_memories(user_id, filters)
   - delete_memory(memory_id)
   - update_memory(memory_id, new_content)
   - get_memory_stats(user_id)

4. Create schemas/memory.py with:
   - MemoryCreate, MemoryResponse
   - MemorySearch, MemoryUpdate
   - MemoryStats

5. Implement routers/memory.py with endpoints:
   - GET /api/memory - list all user memories with filters
   - POST /api/memory - create explicit memory
   - GET /api/memory/{id} - get specific memory
   - DELETE /api/memory/{id} - delete memory
   - PATCH /api/memory/{id} - update memory
   - POST /api/memory/search - search memories by query
   - GET /api/memory/stats - get memory statistics

6. Update services/chat_service.py to:
   - Search relevant memories before sending to LLM
   - Inject top K memories into system prompt
   - Extract and store automatic memories from responses
   - Format memories for context injection

Frontend:
1. Create types/memory.ts with TypeScript interfaces

2. Implement services/memory.ts with:
   - getMemories()
   - createMemory()
   - searchMemories()
   - deleteMemory()
   - updateMemory()
   - getMemoryStats()

3. Create hooks/useMemory.ts custom hook:
   - Manage memory state
   - CRUD operations
   - Search functionality
   - Loading and error states

4. Implement components/memory/:
   - MemoryManager.tsx - main memory management interface
   - MemoryList.tsx - list of memories with filters
   - MemoryItem.tsx - individual memory card
   - MemorySearch.tsx - search interface
   - MemoryStats.tsx - statistics display
   - AddMemoryModal.tsx - manual memory creation

5. Update components/chat/MessageBubble.tsx:
   - Add memory indicator badge when memories were used
   - Show which memories were injected (tooltip)

6. Add memory controls to ChatInterface:
   - Button to view memories used in current conversation
   - Quick action to save current message as memory

Requirements:
- Differentiate between explicit and automatic memories in storage
- Use vector similarity search for memory retrieval
- Inject top 5 most relevant memories into context
- Format memories clearly in system prompt: "[MEMORY - type] content"
- Automatic memory extraction should use LLM analysis
- Support filtering memories by type and category
- Show memory usage statistics (total, by type, by category)
- Implement memory importance scoring
- Add timestamps to all memories
- Link memories to source conversations

After completion, I should be able to:
- Say "remember this: I prefer Python" and have it stored as explicit memory
- Have preferences automatically detected and stored
- See relevant memories injected into chat context
- View all my memories in the Memory Manager
- Search memories by content
- Edit and delete memories
- See which memories were used in each response
- Filter memories by type (explicit/automatic) and category
```

---

## ⚡ Phase 5: Advanced Features

### Prompt for Phase 5:

```
Implement Phase 5: Advanced Features for the Multi-Modal AI Chat Interface.

Reference: plans/architecture.md and plans/implementation-guide.md

Phase 5 Tasks:

Backend:
1. Implement streaming support in routers/chat.py:
   - POST /api/chat/stream - Server-Sent Events endpoint
   - Stream response chunks as they arrive from LLM
   - Include token counts in stream
   - Handle stream errors gracefully
   - Send completion event when done

2. Implement services/token_tracker.py:
   - count_tokens(text, model) using tiktoken for OpenAI
   - estimate_tokens(text) for other providers
   - track_usage(user_id, conversation_id, message_id, provider, model, tokens)
   - get_conversation_usage(conversation_id)
   - get_user_usage_summary(user_id, time_range)

3. Create routers/usage.py with endpoints:
   - GET /api/usage/conversation/{id} - conversation token usage
   - GET /api/usage/summary - user's overall usage
   - GET /api/usage/stats - usage statistics with date filters

4. Update services/chat_service.py:
   - Track tokens for every message
   - Store token counts in database
   - Calculate costs (optional)

Frontend:
1. Implement services/sse.ts:
   - createSSEConnection(url, onMessage, onError, onComplete)
   - Parse SSE data format
   - Handle reconnection logic
   - Cleanup on disconnect

2. Create hooks/useSSE.ts:
   - Custom hook for SSE connections
   - Accumulate streamed response
   - Handle connection lifecycle
   - Error handling and retry logic

3. Update services/chat.ts:
   - Add streamMessage() function using SSE
   - Handle streaming responses

4. Implement components/chat/CodeBlock.tsx:
   - Detect language from metadata
   - Syntax highlighting using Prism.js
   - Copy to clipboard button
   - Language label badge
   - Line numbers (optional)
   - Support 100+ languages

5. Implement components/chat/ImageRenderer.tsx:
   - Responsive image sizing
   - Click to expand (lightbox)
   - Loading placeholder
   - Error fallback
   - Alt text support

6. Implement components/chat/TokenCounter.tsx:
   - Display current conversation tokens
   - Show tokens as user types
   - Visual progress bar
   - Color coding (green < 50%, yellow < 80%, red >= 80%)
   - Model context limit display

7. Create hooks/useTokenUsage.ts:
   - Track token usage in real-time
   - Calculate running totals
   - Fetch usage statistics

8. Update components/chat/MessageBubble.tsx:
   - Render code blocks with CodeBlock component
   - Render images with ImageRenderer component
   - Detect content type from metadata
   - Support markdown rendering for text

9. Update components/chat/MessageInput.tsx:
   - Show estimated tokens as user types
   - Disable send if over limit
   - Character count display

Requirements:
- Streaming should show response in real-time
- Token counting must be accurate for OpenAI models
- Support syntax highlighting for: Python, JavaScript, TypeScript, Java, C++, Go, Rust, SQL, HTML, CSS, JSON, YAML, Markdown, and more
- Code copy should include success feedback
- Images should be lazy-loaded
- Token counter should update in real-time
- Support both streaming and non-streaming modes
- Handle stream interruptions gracefully
- Show loading skeleton during streaming

After completion, I should be able to:
- See responses stream in real-time
- View accurate token counts per message
- See total conversation token usage
- Copy code blocks with one click
- View images in chat with lightbox
- See syntax-highlighted code in multiple languages
- Monitor token usage as I type
- Get warnings when approaching context limits
```

---

## 🎨 Phase 6: UI Polish & User Experience

### Prompt for Phase 6:

```
Implement Phase 6: UI Polish and User Experience for the Multi-Modal AI Chat Interface.

Reference: plans/architecture.md and plans/implementation-guide.md

Phase 6 Tasks:

Frontend:
1. Enhance components/sidebar/Sidebar.tsx:
   - Collapsible sidebar with toggle button
   - Smooth animations
   - Responsive design (mobile drawer)
   - User menu with logout
   - Settings link
   - Memory manager link

2. Implement components/sidebar/SearchBar.tsx:
   - Search input with icon
   - Debounced search (300ms)
   - Filter conversations by title and content
   - Clear button
   - Search results highlighting
   - Keyboard shortcuts (Cmd/Ctrl + K)

3. Enhance components/sidebar/ConversationList.tsx:
   - Group by date (Today, Yesterday, Last 7 days, Last 30 days, Older)
   - Infinite scroll or pagination
   - Active conversation highlight
   - Hover effects
   - Context menu on right-click

4. Implement components/sidebar/ConversationItem.tsx:
   - Title with truncation
   - Last message preview
   - Relative timestamp
   - Hover actions (rename, delete)
   - Drag to reorder (optional)

5. Create components/settings/SettingsPanel.tsx with tabs:
   - API Keys management
   - Model preferences
   - UI preferences (theme, font size)
   - Memory settings
   - Export/Import data

6. Implement components/settings/ModelSelector.tsx:
   - Provider dropdown
   - Model dropdown (filtered by provider)
   - Model info display (context length, pricing)
   - Save default preferences

7. Create components/common/:
   - Button.tsx - reusable button with variants
   - Input.tsx - styled input component
   - Modal.tsx - modal dialog
   - Loading.tsx - loading spinners and skeletons
   - Toast.tsx - notification system

8. Implement error handling:
   - Error boundaries for components
   - Toast notifications for errors
   - Retry buttons for failed operations
   - Graceful degradation

9. Add loading states:
   - Skeleton loaders for messages
   - Loading spinners for API calls
   - Progress indicators for long operations
   - Optimistic UI updates

10. Implement export/import functionality:
    - Export conversations as JSON
    - Export single conversation
    - Import conversations from JSON
    - Backup all data

11. Create pages/SettingsPage.tsx:
    - Tabbed interface
    - All settings organized
    - Save/cancel buttons
    - Reset to defaults option

12. Enhance App.tsx:
    - React Router setup
    - Protected routes
    - Layout components
    - Global error boundary
    - Toast provider

Backend:
1. Create routers/export.py with endpoints:
   - GET /api/export/conversations - export all conversations
   - GET /api/export/conversation/{id} - export single conversation
   - POST /api/import/conversations - import conversations
   - GET /api/export/memories - export memories

Requirements:
- Smooth animations (use Tailwind transitions)
- Responsive design (mobile, tablet, desktop)
- Keyboard shortcuts for common actions
- Accessibility (ARIA labels, keyboard navigation)
- Dark mode support (optional)
- Loading states for all async operations
- Error messages should be user-friendly
- Toast notifications for success/error
- Confirmation dialogs for destructive actions
- Search should be fast and accurate
- Export should include all data (messages, metadata)
- Import should validate data before importing

After completion, I should be able to:
- Search conversations quickly
- Toggle sidebar on mobile
- See grouped conversations by date
- Access settings easily
- Change default model preferences
- Export my conversation history
- Import conversations from backup
- See loading states during operations
- Get clear error messages
- Use keyboard shortcuts
- Navigate with keyboard only
- See smooth animations throughout
```

---

## 🧪 Phase 7: Testing, Documentation & Deployment

### Prompt for Phase 7:

```
Implement Phase 7: Testing, Documentation, and Deployment for the Multi-Modal AI Chat Interface.

Reference: plans/architecture.md and plans/implementation-guide.md

Phase 7 Tasks:

Backend Testing:
1. Create tests/test_auth.py:
   - Test user registration (valid, duplicate email, weak password)
   - Test login (valid, invalid credentials, non-existent user)
   - Test token validation
   - Test session management
   - Test logout

2. Create tests/test_chat.py:
   - Test message creation
   - Test conversation CRUD operations
   - Test LLM router with mocked providers
   - Test streaming responses
   - Test token counting accuracy

3. Create tests/test_memory.py:
   - Test memory storage and retrieval
   - Test vector search accuracy
   - Test memory classification
   - Test context injection
   - Test explicit vs automatic memory handling

4. Create tests/conftest.py:
   - Test database fixtures
   - Mock LLM providers
   - Test user fixtures
   - Cleanup utilities

Frontend Testing:
1. Create component tests:
   - Test auth forms
   - Test chat interface
   - Test message rendering
   - Test sidebar functionality
   - Test memory manager

2. Create integration tests:
   - Test complete auth flow
   - Test chat conversation flow
   - Test memory creation and usage

Documentation:
1. Create API documentation in main.py:
   - OpenAPI/Swagger configuration
   - Endpoint descriptions
   - Request/response examples
   - Authentication documentation

2. Create backend/README.md:
   - Setup instructions
   - API documentation
   - Environment variables
   - Development guide

3. Create frontend/README.md:
   - Setup instructions
   - Component documentation
   - State management guide
   - Build instructions

4. Create CONTRIBUTING.md:
   - Code style guide
   - Pull request process
   - Testing requirements
   - Commit message format

Deployment:
1. Create backend/Dockerfile:
   - Multi-stage build
   - Python dependencies
   - Expose port 8000
   - Health check endpoint

2. Create frontend/Dockerfile:
   - Node build stage
   - Nginx serve stage
   - Environment variable injection

3. Create docker-compose.yml:
   - Backend service
   - Frontend service
   - Volume mounts for data persistence
   - Network configuration
   - Environment variables

4. Create .dockerignore files:
   - Exclude unnecessary files
   - Reduce image size

5. Create deployment documentation:
   - Docker deployment guide
   - Environment setup
   - Backup procedures
   - Monitoring setup

6. Create backend/app/middleware/error_handler.py:
   - Global exception handler
   - Logging configuration
   - Error response formatting

7. Add health check endpoint:
   - GET /health - basic health check
   - GET /health/detailed - database and ChromaDB status

Requirements:
- Test coverage should be > 80%
- All tests should pass
- API documentation should be complete and accurate
- Docker images should be optimized for size
- Include docker-compose for easy local deployment
- Add logging throughout the application
- Include monitoring endpoints
- Document all environment variables
- Provide migration guide for updates
- Include backup and restore procedures

After completion, I should be able to:
- Run all tests with `pytest` and see them pass
- View complete API documentation at /docs
- Build Docker images successfully
- Deploy with docker-compose up
- Access health check endpoints
- See proper logging in production
- Backup and restore data
- Monitor application health
```

---

## 🎯 Complete Implementation Prompt (All Phases)

### If you want to request everything at once:

```
I need you to implement the complete Multi-Modal AI Chat Interface with Persistent Memory project based on the architecture and plans in the plans/ directory.

Project Overview:
- Full-stack chat application with React frontend and FastAPI backend
- Multi-provider LLM support (Router API, OpenAI, Anthropic, Ollama)
- Persistent memory system with explicit and automatic memory detection
- Rich media rendering (code with syntax highlighting, images)
- Real-time token tracking
- Streaming responses via SSE

Please implement all 7 phases in order:

Phase 1: Project Foundation & Setup
- Complete directory structure
- Backend setup with FastAPI, SQLAlchemy, ChromaDB
- Frontend setup with React, Vite, TypeScript, Tailwind
- Database models and initialization

Phase 2: Authentication System
- JWT-based authentication
- User registration and login
- Protected routes
- Frontend auth context and forms

Phase 3: Basic Chat Implementation
- LLM router with multi-provider support
- Chat endpoints and conversation management
- API key management
- Basic chat UI with sidebar

Phase 4: Memory System
- Embedding service with sentence-transformers
- Memory classification (explicit vs automatic)
- Vector search and context injection
- Memory management UI

Phase 5: Advanced Features
- Streaming responses (SSE)
- Token tracking and usage monitoring
- Code syntax highlighting with copy
- Image rendering
- Real-time token counter

Phase 6: UI Polish & UX
- Enhanced sidebar with search
- Settings panel
- Export/import functionality
- Error handling and loading states
- Responsive design

Phase 7: Testing & Deployment
- Backend and frontend tests
- API documentation
- Docker configuration
- Deployment documentation

Requirements:
- Follow the exact architecture from plans/architecture.md
- Use the file structure from plans/implementation-guide.md
- Implement all features as specified
- Include proper error handling
- Add comprehensive comments and docstrings
- Ensure type safety (TypeScript + Python type hints)
- Make it production-ready

After completion, the application should:
- Allow users to register and login
- Support multiple LLM providers
- Remember explicit facts when told "remember this"
- Automatically detect and store preferences
- Inject relevant memories into chat context
- Display code with syntax highlighting
- Show images in chat
- Track token usage in real-time
- Stream responses in real-time
- Be fully functional and deployable

Please implement phase by phase, ensuring each phase is complete and tested before moving to the next.
```

---

## 📝 Tips for Using These Prompts

1. **Start with Phase 1** - Don't skip the foundation
2. **Test after each phase** - Ensure everything works before moving on
3. **Review the code** - Check that it follows the architecture
4. **Ask questions** - If anything is unclear, ask for clarification
5. **Iterate** - Request improvements or fixes as needed

## 🔄 Requesting Fixes or Improvements

If something doesn't work or needs improvement:

```
The [feature/component] in Phase [X] has an issue:
[Describe the issue]

Expected behavior:
[What should happen]

Current behavior:
[What actually happens]

Please fix this according to the architecture in plans/architecture.md
```

## 🎨 Requesting UI Improvements

```
Please improve the UI for [component name]:
- [Specific improvement 1]
- [Specific improvement 2]
- [Specific improvement 3]

Reference the design specifications in plans/architecture.md and ensure it follows Tailwind CSS best practices.
```

---

**Ready to start implementation!** Choose the appropriate prompt based on which phase you want to implement.
