# Multi-Modal AI Chat Interface - Backend

FastAPI backend for the Multi-Modal AI Chat Interface with persistent memory capabilities.

## Prerequisites

- Python 3.9+ (`python3 --version`)
- pip (comes with Python)

## Setup

### 1. Create a Virtual Environment

```bash
cd backend
python3 -m venv venv
```

### 2. Activate the Virtual Environment

```bash
# macOS / Linux
source venv/bin/activate

# Windows (Command Prompt)
venv\Scripts\activate

# Windows (PowerShell)
venv\Scripts\Activate.ps1
```

> You should see `(venv)` in your terminal prompt when activated.

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- **FastAPI** + **Uvicorn** — Web framework and ASGI server
- **SQLAlchemy** + **aiosqlite** — Async ORM and SQLite driver
- **ChromaDB** — Vector database for memory embeddings
- **Pydantic** + **pydantic-settings** — Data validation and settings management
- **python-jose** + **passlib** — JWT authentication and password hashing
- **openai** + **anthropic** — LLM provider clients
- **sentence-transformers** — Local embedding model
- **tiktoken** — Token counting
- **httpx** — Async HTTP client
- **python-dotenv** — Environment variable loading

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your settings. Key variables:

| Variable                      | Default                          | Required | Description                        |
|-------------------------------|----------------------------------|----------|------------------------------------|
| `SECRET_KEY`                  | `your-secret-key-...`            | **Yes**  | JWT signing key (change this!)     |
| `DATABASE_URL`                | `sqlite:///./data/chat.db`       | No       | Database connection string         |
| `CHROMA_PERSIST_DIR`          | `./data/chroma`                  | No       | ChromaDB storage path              |
| `CORS_ORIGINS`                | `["http://localhost:5173", ...]` | No       | Allowed frontend origins           |
| `OPENAI_API_KEY`              | *(empty)*                        | No       | OpenAI API key                     |
| `ANTHROPIC_API_KEY`           | *(empty)*                        | No       | Anthropic API key                  |
| `OLLAMA_BASE_URL`             | `http://localhost:11434`         | No       | Ollama server URL                  |

> **Generate a secure secret key:**
> ```bash
> python3 -c "import secrets; print(secrets.token_urlsafe(32))"
> ```

### 5. Initialize the Database

```bash
python -m app.init_db
```

This creates the SQLite database at `data/chat.db` with all required tables (users, conversations, messages, api_keys, token_usage).

### 6. Start the Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
Starting Multi-Modal AI Chat v0.1.0
Environment: development
Debug: True
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXXX]
```

The `--reload` flag enables auto-restart when Python files change.

## API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/api/docs — Interactive API explorer
- **ReDoc**: http://localhost:8000/api/redoc — Alternative documentation view
- **Health Check**: http://localhost:8000/api/health — Verify the server is running

## Running Tests

```bash
# Make sure venv is activated
source venv/bin/activate

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run a specific test file
pytest tests/test_auth.py
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py              # Package marker
│   ├── main.py                  # FastAPI application entry point
│   ├── config.py                # Configuration management (pydantic-settings)
│   ├── database.py              # Database connection and session setup
│   ├── init_db.py               # Database initialization script
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── __init__.py
│   │   ├── user.py              # User model
│   │   ├── conversation.py      # Conversation model
│   │   ├── message.py           # Message model
│   │   ├── api_key.py           # API key model
│   │   └── token_usage.py       # Token usage tracking model
│   ├── schemas/                 # Pydantic request/response schemas
│   │   └── __init__.py
│   ├── routers/                 # API route handlers
│   │   └── __init__.py
│   ├── services/                # Business logic layer
│   │   ├── __init__.py
│   │   └── embedding_service.py # Vector embedding service
│   ├── utils/                   # Helper utilities
│   │   └── __init__.py
│   └── middleware/              # Custom middleware
│       └── __init__.py
├── tests/                       # Test suite
│   └── __init__.py
├── data/                        # Local data storage
│   └── .gitkeep
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variable template
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

## Troubleshooting

### Port already in use
```bash
# Find what's using port 8000
lsof -i :8000
# Kill the process
kill -9 <PID>
# Or use a different port
uvicorn app.main:app --reload --port 8001
```

### Module not found errors
```bash
# Ensure you're in the backend directory and venv is activated
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### Database issues
```bash
# Delete and re-initialize the database
rm -f data/chat.db
python -m app.init_db
```
