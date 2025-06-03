"""
Pipeline Pulse FastAPI Backend
Main application entry point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from contextlib import asynccontextmanager

from app.api.routes import api_router
from app.api.endpoints.health import router as health_router
from app.core.config import settings
from app.services.scheduler_service import start_scheduler, stop_scheduler
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def run_database_migration():
    """Run database migration on startup"""
    try:
        logger.info("🔧 Starting database migration...")

        from app.core.database import engine, Base
        from sqlalchemy import text

        # Import all models to ensure they're registered with Base
        logger.info("📦 Importing models...")
        from app.models.analysis import Analysis
        from app.models.currency_rate import CurrencyRate

        # Import bulk update models
        try:
            from app.models.bulk_update import BulkUpdateBatch, BulkUpdateRecord
            logger.info("  ✅ Bulk update models imported")
        except ImportError as e:
            logger.warning(f"  ⚠️  Bulk update models not found: {e}")

        # Import O2R models
        try:
            from app.models.o2r.opportunity import O2ROpportunity
            logger.info("  ✅ O2R opportunity model imported")
        except ImportError as e:
            logger.warning(f"  ⚠️  O2R opportunity model not found: {e}")

        # Test database connection
        logger.info("🔗 Testing database connection...")
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            logger.info("  ✅ Database connection successful")

        # Create all tables
        logger.info("🏗️  Creating database tables...")
        Base.metadata.create_all(bind=engine)

        # Verify tables were created
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        logger.info(f"✅ Database migration completed! Created {len(tables)} tables:")
        for table in sorted(tables):
            logger.info(f"  - {table}")

        return True

    except Exception as e:
        logger.error(f"❌ Database migration failed: {e}")
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
app = FastAPI(
    title="Pipeline Pulse API",
    description="Deal analysis platform API for Zoho CRM data",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_HOSTS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")
app.include_router(health_router)

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
