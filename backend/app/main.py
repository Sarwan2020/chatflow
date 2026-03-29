"""
FastAPI application entry point.

Sets up the FastAPI application with CORS middleware, router
registration, startup/shutdown events, and a health check endpoint.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager for startup and shutdown events.

    Startup:
        - Log application start
        - Initialize any required services

    Shutdown:
        - Clean up resources
    """
    settings = get_settings()
    print(f"Starting {settings.app_name} v{settings.app_version}")
    print(f"Environment: {settings.environment}")
    print(f"Debug: {settings.debug}")
    yield
    print(f"Shutting down {settings.app_name}")


def create_app() -> FastAPI:
    """
    Create and configure the FastAPI application instance.

    Returns:
        FastAPI: Configured application with middleware and routes.
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        description="Multi-Modal AI Chat Interface with persistent memory",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=lifespan,
    )

    # -------------------------------------------------------------------------
    # CORS Middleware
    # -------------------------------------------------------------------------
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # -------------------------------------------------------------------------
    # Health Check
    # -------------------------------------------------------------------------
    @app.get("/api/health", tags=["Health"])
    async def health_check():
        """Health check endpoint to verify the API is running."""
        return {
            "status": "healthy",
            "app_name": settings.app_name,
            "version": settings.app_version,
            "environment": settings.environment,
        }

    # -------------------------------------------------------------------------
    # Router Registration (to be added in later phases)
    # -------------------------------------------------------------------------
    # from app.routers import auth, conversations, chat, memory, api_keys, usage
    # app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
    # app.include_router(conversations.router, prefix="/api/conversations", tags=["Conversations"])
    # app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
    # app.include_router(memory.router, prefix="/api/memory", tags=["Memory"])
    # app.include_router(api_keys.router, prefix="/api/keys", tags=["API Keys"])
    # app.include_router(usage.router, prefix="/api/usage", tags=["Usage"])

    return app


app = create_app()
