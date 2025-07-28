from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.sessions import SessionMiddleware
import structlog
import time
from .core.config import settings
from .api.v1.api import api_router

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()

# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description="Enterprise-grade sales intelligence platform",
    version="1.0.0",
    openapi_url=f"{settings.api_v1_prefix}/openapi.json" if settings.debug else None,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# Add CORS middleware
if settings.backend_cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[str(origin) for origin in settings.backend_cors_origins],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Add trusted host middleware for production
if settings.app_env == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["pipeline-pulse.com", "*.pipeline-pulse.com"]
    )


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all HTTP requests."""
    start_time = time.time()
    
    # Generate request ID
    request_id = request.headers.get("X-Request-ID", f"req_{int(time.time() * 1000)}")
    
    # Log request
    logger.info(
        "Request started",
        method=request.method,
        url=str(request.url),
        request_id=request_id,
        user_agent=request.headers.get("User-Agent"),
    )
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Log response
    logger.info(
        "Request completed",
        method=request.method,
        url=str(request.url),
        request_id=request_id,
        status_code=response.status_code,
        duration_ms=round(duration * 1000, 2),
    )
    
    # Add request ID to response headers
    response.headers["X-Request-ID"] = request_id
    
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    logger.warning(
        "Validation error",
        url=str(request.url),
        errors=exc.errors(),
    )
    
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation Error",
            "details": exc.errors(),
            "request_id": request.headers.get("X-Request-ID"),
        }
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions."""
    logger.error(
        "HTTP exception",
        url=str(request.url),
        status_code=exc.status_code,
        detail=exc.detail,
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "request_id": request.headers.get("X-Request-ID"),
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors."""
    logger.error(
        "Unexpected error",
        url=str(request.url),
        error=str(exc),
        exc_info=True,
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error" if settings.app_env == "production" else str(exc),
            "request_id": request.headers.get("X-Request-ID"),
        }
    )


# Root health check endpoint
@app.get("/health")
async def health_check():
    """Root health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": "1.0.0",
        "environment": settings.app_env,
        "message": "Use /api/v1/health for detailed health information"
    }


# Include API router
app.include_router(api_router, prefix=settings.api_v1_prefix)


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize application on startup."""
    from .core.database import init_db, get_db
    from .core.session import init_session_management
    
    try:
        # Initialize database
        init_db(
            database_url=settings.database_url,
            pool_size=settings.database_pool_size,
            max_overflow=settings.database_max_overflow,
            echo=settings.debug,
        )
        
        # Initialize session management
        await init_session_management(get_db)
        
        # Initialize Zoho SDK for multi-user support
        from .core.zoho_sdk_manager import zoho_sdk_manager
        # Check if manager has the improved manager instance
        if hasattr(zoho_sdk_manager, '_improved_manager') and zoho_sdk_manager._improved_manager:
            zoho_init_success = await zoho_sdk_manager._improved_manager.initialize()
        else:
            zoho_init_success = await zoho_sdk_manager.initialize_sdk()
        
        logger.info(
            "Application starting",
            app_name=settings.app_name,
            environment=settings.app_env,
            debug=settings.debug,
            database_url_masked=settings.database_url.split('@')[-1] if '@' in settings.database_url else "not configured",
            zoho_sdk_initialized=zoho_init_success,
        )
    except Exception as e:
        logger.error(
            "Failed to initialize application",
            error=str(e),
            exc_info=True
        )
        raise


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("Application shutting down")


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )