# Multi-Modal AI Chat Interface - Backend

FastAPI backend for the Multi-Modal AI Chat Interface with persistent memory capabilities.

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On macOS/Linux
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Initialize the database:
   ```bash
   python -m app.init_db
   ```

5. Start the development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── database.py          # Database connection setup
│   ├── init_db.py           # Database initialization script
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic validation schemas
│   ├── routers/             # API route handlers
│   ├── services/            # Business logic layer
│   ├── utils/               # Helper utilities
│   └── middleware/           # Custom middleware
├── tests/                   # Test suite
├── data/                    # Local data storage
├── requirements.txt
├── .env.example
└── README.md
```
