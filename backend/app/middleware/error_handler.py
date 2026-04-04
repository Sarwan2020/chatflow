"""
Error handling middleware for the application.
Provides global exception handling with proper logging and formatted responses.
"""

import logging
import traceback
from typing import Callable
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from pydantic import ValidationError

from app.config import get_settings

# Configure logging
logger = logging.getLogger(__name__)


class AppException(Exception):
    """Base exception class for application-specific errors."""
    
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: str = "INTERNAL_ERROR",
        details: dict = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(AppException):
    """Raised when authentication fails."""
    
    def __init__(self, message: str = "Authentication failed", details: dict = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="AUTHENTICATION_ERROR",
            details=details
        )


class AuthorizationError(AppException):
    """Raised when user lacks permission."""
    
    def __init__(self, message: str = "Permission denied", details: dict = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="AUTHORIZATION_ERROR",
            details=details
        )


class NotFoundError(AppException):
    """Raised when a resource is not found."""
    
    def __init__(self, message: str = "Resource not found", details: dict = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
            details=details
        )


class ValidationError(AppException):
    """Raised when validation fails."""
    
    def __init__(self, message: str = "Validation failed", details: dict = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            details=details
        )


class ExternalServiceError(AppException):
    """Raised when an external service (LLM, etc.) fails."""
    
    def __init__(self, message: str = "External service error", details: dict = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_502_BAD_GATEWAY,
            error_code="EXTERNAL_SERVICE_ERROR",
            details=details
        )


class RateLimitError(AppException):
    """Raised when rate limit is exceeded."""
    
    def __init__(self, message: str = "Rate limit exceeded", details: dict = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code="RATE_LIMIT_ERROR",
            details=details
        )


def format_error_response(
    message: str,
    error_code: str = "INTERNAL_ERROR",
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
    details: dict = None,
    include_traceback: bool = False
) -> dict:
    """Format error response in a consistent structure."""
    response = {
        "error": {
            "message": message,
            "code": error_code,
            "status": status_code
        }
    }
    
    if details:
        response["error"]["details"] = details
    
    settings = get_settings()
    if include_traceback and settings.debug:
        response["error"]["traceback"] = traceback.format_exc()
    
    return response


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle application-specific exceptions."""
    logger.warning(
        f"Application error: {exc.error_code} - {exc.message}",
        extra={
            "error_code": exc.error_code,
            "status_code": exc.status_code,
            "path": request.url.path,
            "method": request.method,
            "details": exc.details
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=format_error_response(
            message=exc.message,
            error_code=exc.error_code,
            status_code=exc.status_code,
            details=exc.details,
            include_traceback=False
        )
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle HTTP exceptions."""
    logger.warning(
        f"HTTP error: {exc.status_code} - {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "path": request.url.path,
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content=format_error_response(
            message=str(exc.detail),
            error_code="HTTP_ERROR",
            status_code=exc.status_code
        )
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle request validation errors."""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    logger.warning(
        f"Validation error on {request.url.path}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "errors": errors
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=format_error_response(
            message="Request validation failed",
            error_code="VALIDATION_ERROR",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"errors": errors}
        )
    )


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Handle SQLAlchemy database errors."""
    logger.error(
        f"Database error: {str(exc)}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "error_type": type(exc).__name__
        },
        exc_info=True
    )
    
    # Handle specific database errors
    if isinstance(exc, IntegrityError):
        message = "Database integrity constraint violated"
        error_code = "INTEGRITY_ERROR"
    else:
        message = "Database error occurred"
        error_code = "DATABASE_ERROR"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=format_error_response(
            message=message,
            error_code=error_code,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            include_traceback=get_settings().debug
        )
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all other unhandled exceptions."""
    logger.error(
        f"Unhandled exception: {str(exc)}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "error_type": type(exc).__name__
        },
        exc_info=True
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=format_error_response(
            message="An unexpected error occurred",
            error_code="INTERNAL_ERROR",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            include_traceback=get_settings().debug
        )
    )


def register_exception_handlers(app):
    """Register all exception handlers with the FastAPI app."""
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
