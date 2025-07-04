"""
Pipeline Pulse FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import uvicorn
from contextlib import asynccontextmanager

from app.api.routes import api_router
from app.api.endpoints.health import router as health_router
from app.api.endpoints import sync_health, sync_stream
from app.core.config import settings
from app.core.auth_middleware import AuthMiddleware
from app.services.scheduler_service import start_scheduler, stop_scheduler
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_database_migration():
    """Run Alembic migrations to ensure database schema is up to date"""
    try:
        logger.info("🔧 Running database migrations with Alembic...")
        
        from alembic.config import Config
        from alembic import command
        from app.core.database import engine
        from sqlalchemy import text
        import os
        
        # Test database connection first
        logger.info("🔗 Testing database connection...")
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                logger.info("  ✅ Database connection successful")
        except Exception as e:
            logger.error(f"  ❌ Database connection failed: {e}")
            return False
        
        # Configure Alembic
        alembic_cfg = Config("alembic.ini")
        
        # Set the database URL for Alembic
        alembic_cfg.set_main_option("sqlalchemy.url", str(engine.url))
        
        # Check if we need to force reset
        force_reset = os.getenv('FORCE_DB_RESET', 'false').lower() == 'true'
        
        if force_reset:
            logger.info("🚨 FORCE_DB_RESET flag detected - dropping all tables")
            
            # Import all models to ensure they're registered
            from app.models.currency_rate import CurrencyRate
            from app.models.system_settings import SystemSetting
            from app.models.bulk_export import BulkExportJob, BulkExportRecord
            from app.models.zoho_oauth_token import ZohoOAuthToken
            from app.models.token_management import ZohoTokenRecord, TokenRefreshLog, TokenAlert
            from app.models.crm_record import CrmRecord
            
            # Drop all tables
            from app.core.database import Base
            Base.metadata.drop_all(bind=engine)
            logger.info("  ✅ All tables dropped")
            
            # Drop alembic version table
            with engine.connect() as conn:
                conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
                conn.commit()
            logger.info("  ✅ Alembic version table dropped")
        
        # Run migrations
        try:
            # Check current revision
            try:
                current_rev = command.current(alembic_cfg, verbose=False)
                logger.info(f"📌 Current migration: {current_rev}")
            except:
                logger.info("📌 No migrations applied yet")
            
            # Run all pending migrations
            logger.info("🚀 Running migrations to latest version...")
            command.upgrade(alembic_cfg, "head")
            
            # Show new revision
            new_rev = command.current(alembic_cfg, verbose=False)
            logger.info(f"✅ Migrations completed! Current version: {new_rev}")
            
            # List all tables
            from sqlalchemy import inspect
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            logger.info(f"📋 Database has {len(tables)} tables:")
            for table in sorted(tables):
                logger.info(f"  - {table}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Migration failed: {e}")
            import traceback
            traceback.print_exc()
            return False
            
    except Exception as e:
        logger.error(f"❌ Database migration setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle startup and shutdown events"""
    # Startup
    logger.info("🚀 Starting Pipeline Pulse application...")

    # Run database migration
    migration_success = run_database_migration()
    if not migration_success:
        logger.error("❌ Database migration failed - application may not work correctly")

    # Start scheduler
    await start_scheduler()

    logger.info("✅ Application startup completed!")
    yield

    # Shutdown
    logger.info("🛑 Shutting down application...")
    await stop_scheduler()
    logger.info("✅ Application shutdown completed!")

# Create FastAPI app
from app.core.zoho_sdk import initialize_zoho_sdk

# Initialize Zoho SDK with error handling
try:
    initialize_zoho_sdk()
    print("✅ Zoho SDK initialized successfully")
except Exception as e:
    print(f"⚠️ Zoho SDK initialization failed: {e}")
    print("Application will continue without SDK initialization")

app = FastAPI(
    title="Pipeline Pulse API",
    description="Deal analysis platform API for Zoho CRM data",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware - Enhanced for development
cors_origins = settings.ALLOWED_HOSTS if settings.ENVIRONMENT == "production" else [
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Authentication middleware
auth_middleware = AuthMiddleware()

@app.middleware("http")
async def authentication_middleware(request: Request, call_next):
    """Middleware to verify OAuth authentication for protected endpoints"""
    try:
        # Skip authentication for public paths (including health checks)
        if auth_middleware.is_public_path(request.url.path):
            response = await call_next(request)
            return response

        # For protected endpoints, verify OAuth token
        is_authenticated = await auth_middleware.verify_oauth_token(request)

        if not is_authenticated:
            # Create response with proper CORS headers
            response = JSONResponse(
                status_code=401,
                content={
                    "detail": "Authentication required. Please connect your Zoho CRM account.",
                    "error": "unauthorized"
                }
            )
            # Add CORS headers to error responses
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
            return response

        # Continue with the request
        response = await call_next(request)
        return response

    except Exception as e:
        logger.error(f"Authentication middleware error: {e}")
        # Create error response with CORS headers
        response = JSONResponse(
            status_code=500,
            content={
                "detail": "Internal server error during authentication",
                "error": "server_error"
            }
        )
        # Add CORS headers to error responses
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response

# Include API routes
app.include_router(api_router, prefix="/api")
app.include_router(health_router)
app.include_router(sync_health.router)
app.include_router(sync_stream.router)

@app.get("/health-simple")
async def simple_health():
    """Ultra-simple health check for debugging"""
    return {"status": "ok"}

@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle OPTIONS requests for CORS preflight"""
    return {"message": "OK"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Pipeline Pulse API",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
