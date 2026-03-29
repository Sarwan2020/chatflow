# Quick Start Guide - Multi-Modal AI Chat Interface

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn
- Git

---

## Initial Setup Commands

### 1. Create Project Structure

```bash
# Create main directories
mkdir -p backend/app/{models,schemas,routers,services,utils,middleware}
mkdir -p backend/tests
mkdir -p backend/data/chroma
mkdir -p frontend/src/{components,contexts,hooks,services,types,utils,pages}
mkdir -p plans

# Create __init__.py files for Python packages
touch backend/app/__init__.py
touch backend/app/models/__init__.py
touch backend/app/schemas/__init__.py
touch backend/app/routers/__init__.py
touch backend/app/services/__init__.py
touch backend/app/utils/__init__.py
touch backend/app/middleware/__init__.py
touch backend/tests/__init__.py
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Create requirements.txt
cat > requirements.txt << EOF
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
chromadb==0.4.22
pydantic==2.5.3
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
openai==1.10.0
anthropic==0.18.0
tiktoken==0.5.2
sentence-transformers==2.3.1
aiofiles==23.2.1
python-dotenv==1.0.0
pytest==7.4.3
httpx==0.26.0
EOF

# Install dependencies
pip install -r requirements.txt

# Create .env file
cat > .env << EOF
# Database
DATABASE_URL=sqlite:///./data/chat.db

# ChromaDB
CHROMA_PERSIST_DIR=./data/chroma

# Security
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# API Keys (optional - users can add via UI)
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
# ROUTER_API_KEY=
EOF
```

### 3. Frontend Setup

```bash
cd ../frontend

# Initialize Vite + React + TypeScript project
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install

# Install additional packages
npm install axios react-router-dom zustand react-markdown prismjs lucide-react

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Update tailwind.config.js
cat > tailwind.config.js << EOF
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
      },
    },
  },
  plugins: [],
}
EOF

# Update vite.config.ts for API proxy
cat > vite.config.ts << EOF
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
EOF
```

---

## Development Workflow

### Running the Backend

```bash
cd backend
source venv/bin/activate  # Activate virtual environment
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

### Running the Frontend

```bash
cd frontend
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## Implementation Order

Follow this sequence for building the application:

### Phase 1: Foundation (Days 1-2)
1. Set up project structure ✓
2. Initialize backend with FastAPI
3. Initialize frontend with React + Vite
4. Create database models and migrations
5. Set up ChromaDB connection

### Phase 2: Authentication (Days 3-4)
6. Implement password hashing and JWT utilities
7. Create user registration and login endpoints
8. Build auth middleware and dependencies
9. Create frontend auth context and forms
10. Test authentication flow

### Phase 3: Basic Chat (Days 5-7)
11. Implement LLM router with provider support
12. Create conversation and message models
13. Build chat endpoints (non-streaming first)
14. Create basic chat UI components
15. Test chat with one provider

### Phase 4: Memory System (Days 8-10)
16. Implement embedding service
17. Create memory storage in ChromaDB
18. Build memory classification logic
19. Implement context injection
20. Create memory management UI

### Phase 5: Advanced Features (Days 11-13)
21. Add streaming support (SSE)
22. Implement token tracking
23. Add code syntax highlighting
24. Add image rendering support
25. Build API key management

### Phase 6: UI Polish (Days 14-15)
26. Create sidebar with conversation history
27. Add search functionality
28. Implement settings panel
29. Add error handling and loading states
30. Improve responsive design

### Phase 7: Testing & Deployment (Days 16-17)
31. Write backend tests
32. Write frontend tests
33. Create Docker configurations
34. Write documentation
35. Deploy and test

---

## Key Files to Create First

### Backend Priority Files

1. **[`backend/app/config.py`](backend/app/config.py)** - Configuration management
2. **[`backend/app/database.py`](backend/app/database.py)** - Database setup
3. **[`backend/app/main.py`](backend/app/main.py)** - FastAPI app initialization
4. **[`backend/app/utils/security.py`](backend/app/utils/security.py)** - Security utilities
5. **[`backend/app/models/user.py`](backend/app/models/user.py)** - User model
6. **[`backend/app/routers/auth.py`](backend/app/routers/auth.py)** - Auth endpoints

### Frontend Priority Files

1. **[`frontend/src/types/auth.ts`](frontend/src/types/auth.ts)** - Type definitions
2. **[`frontend/src/services/api.ts`](frontend/src/services/api.ts)** - API client setup
3. **[`frontend/src/contexts/AuthContext.tsx`](frontend/src/contexts/AuthContext.tsx)** - Auth state
4. **[`frontend/src/App.tsx`](frontend/src/App.tsx)** - Main app component
5. **[`frontend/src/pages/LoginPage.tsx`](frontend/src/pages/LoginPage.tsx)** - Login UI
6. **[`frontend/src/pages/ChatPage.tsx`](frontend/src/pages/ChatPage.tsx)** - Chat UI

---

## Database Initialization

Create a database initialization script:

**File: [`backend/app/init_db.py`](backend/app/init_db.py)**

```python
# Purpose: Initialize database tables
# Run once to create all tables
# Command: python -m app.init_db
```

---

## Testing the Setup

### 1. Test Backend Health

```bash
curl http://localhost:8000/health
# Expected: {"status": "healthy"}
```

### 2. Test User Registration

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass123"}'
```

### 3. Test Login

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpass123"}'
```

### 4. Test Frontend

Open browser to `http://localhost:5173` and verify:
- Login page loads
- Can register new user
- Can login
- Redirects to chat interface

---

## Common Issues and Solutions

### Issue: ChromaDB persistence error
**Solution**: Ensure `data/chroma` directory exists and has write permissions

### Issue: CORS errors in frontend
**Solution**: Check `CORS_ORIGINS` in backend `.env` matches frontend URL

### Issue: JWT token errors
**Solution**: Ensure `SECRET_KEY` is set in `.env` and is consistent

### Issue: Module import errors
**Solution**: Ensure all `__init__.py` files exist in Python packages

### Issue: Frontend can't connect to backend
**Solution**: Verify proxy configuration in `vite.config.ts`

---

## Environment Variables Reference

### Backend (.env)

```bash
# Required
DATABASE_URL=sqlite:///./data/chat.db
CHROMA_PERSIST_DIR=./data/chroma
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
CORS_ORIGINS=http://localhost:5173

# Optional (users can add via UI)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
ROUTER_API_KEY=...
OLLAMA_BASE_URL=http://localhost:11434

# Optional settings
MAX_MEMORY_RESULTS=5
EMBEDDING_MODEL=all-MiniLM-L6-v2
DEFAULT_TEMPERATURE=0.7
```

### Frontend (.env)

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=AI Chat Interface
```

---

## Git Setup

```bash
# Initialize git repository
git init

# Create .gitignore
cat > .gitignore << EOF
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
*.egg-info/
.pytest_cache/

# Environment
.env
.env.local

# Database
*.db
*.db-journal

# ChromaDB
data/chroma/

# Node
node_modules/
dist/
.vite/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
EOF

# Initial commit
git add .
git commit -m "Initial project setup"
```

---

## Next Steps

After completing the setup:

1. **Review** [`architecture.md`](plans/architecture.md) for system design
2. **Follow** [`implementation-guide.md`](plans/implementation-guide.md) for detailed file structures
3. **Start** with Phase 1: Create database models
4. **Test** each component as you build it
5. **Iterate** based on testing feedback

---

## Useful Commands

### Backend

```bash
# Run tests
pytest

# Format code
black app/

# Type checking
mypy app/

# Database migrations (if using Alembic)
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Frontend

```bash
# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

### Docker

```bash
# Build and run with docker-compose
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

---

## Support and Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **React Docs**: https://react.dev/
- **ChromaDB Docs**: https://docs.trychroma.com/
- **Tailwind CSS**: https://tailwindcss.com/docs
- **OpenAI API**: https://platform.openai.com/docs
- **Anthropic API**: https://docs.anthropic.com/

---

## Project Structure Visualization

```
webflow/
├── 📁 backend/              # Python FastAPI backend
│   ├── 📁 app/
│   │   ├── 📄 main.py       # FastAPI app entry
│   │   ├── 📄 config.py     # Configuration
│   │   ├── 📄 database.py   # DB connection
│   │   ├── 📁 models/       # SQLAlchemy models
│   │   ├── 📁 schemas/      # Pydantic schemas
│   │   ├── 📁 routers/      # API endpoints
│   │   ├── 📁 services/     # Business logic
│   │   ├── 📁 utils/        # Utilities
│   │   └── 📁 middleware/   # Middleware
│   ├── 📁 data/             # Local storage
│   │   ├── 📄 chat.db       # SQLite database
│   │   └── 📁 chroma/       # Vector store
│   ├── 📁 tests/            # Backend tests
│   ├── 📄 requirements.txt  # Python deps
│   └── 📄 .env              # Environment vars
│
├── 📁 frontend/             # React TypeScript frontend
│   ├── 📁 src/
│   │   ├── 📁 components/   # React components
│   │   ├── 📁 contexts/     # React contexts
│   │   ├── 📁 hooks/        # Custom hooks
│   │   ├── 📁 services/     # API clients
│   │   ├── 📁 types/        # TypeScript types
│   │   ├── 📁 utils/        # Utilities
│   │   ├── 📁 pages/        # Page components
│   │   ├── 📄 App.tsx       # Main app
│   │   └── 📄 main.tsx      # Entry point
│   ├── 📄 package.json      # npm dependencies
│   ├── 📄 vite.config.ts    # Vite config
│   └── 📄 tailwind.config.js # Tailwind config
│
├── 📁 plans/                # Documentation
│   ├── 📄 architecture.md
│   ├── 📄 implementation-guide.md
│   └── 📄 quick-start-guide.md
│
└── 📄 README.md             # Project overview
```

---

**Ready to start building!** 🚀

Begin with Phase 1 and work through each phase systematically. Test frequently and iterate based on results.
