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
    """Initialize database with fresh schema"""
    try:
        logger.info("🔧 Starting database initialization...")

        from app.core.database import engine, Base
        from sqlalchemy import text, inspect
        import os

        # Import all models to ensure they're registered with Base
        logger.info("📦 Importing models...")
        from app.models.analysis import Analysis
        from app.models.currency_rate import CurrencyRate
        from app.models.system_settings import SystemSetting
        from app.models.bulk_export import BulkExportJob, BulkExportRecord

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

        # Check for force reset flag
        force_reset = os.getenv('FORCE_DB_RESET', 'false').lower() == 'true'

        if force_reset:
            logger.info("🚨 FORCE_DB_RESET flag detected - forcing complete database reset")
            # Drop and recreate all tables
            logger.info("🗑️  Dropping all existing tables...")
            Base.metadata.drop_all(bind=engine)
            logger.info("✅ All tables dropped")

            logger.info("🏗️  Creating tables from current models...")
            Base.metadata.create_all(bind=engine)
            logger.info("✅ All tables created")

            # Initialize Alembic version table
            logger.info("🔧 Initializing Alembic version table...")
            with engine.connect() as conn:
                conn.execute(text("""
                    CREATE TABLE IF NOT EXISTS alembic_version (
                        version_num VARCHAR(32) NOT NULL,
                        CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
                    )
                """))
                conn.execute(text("DELETE FROM alembic_version"))
                conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('008')"))
                conn.commit()
            logger.info("✅ Alembic version table initialized to migration 008")

            # Verify tables were created
            inspector = inspect(engine)
            tables = inspector.get_table_names()
            logger.info(f"✅ Database reset completed! {len(tables)} tables available:")
            for table in sorted(tables):
                logger.info(f"  - {table}")
            return True

        # Check if database has any tables
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()

        if existing_tables:
            logger.info(f"📋 Found {len(existing_tables)} existing tables")
            # Check if we have the incremental tracking columns
            try:
                columns = inspector.get_columns('analyses')
                column_names = [col['name'] for col in columns]
                has_incremental_columns = all(col in column_names for col in
                    ['export_date', 'import_type', 'records_added', 'records_updated', 'records_removed', 'parent_analysis_id'])

                if has_incremental_columns:
                    logger.info("✅ Database schema is up to date with incremental tracking columns")
                    # Just initialize Alembic version table
                    with engine.connect() as conn:
                        conn.execute(text("""
                            CREATE TABLE IF NOT EXISTS alembic_version (
                                version_num VARCHAR(32) NOT NULL,
                                CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
                            )
                        """))
                        conn.execute(text("DELETE FROM alembic_version"))
                        conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('008')"))
                        conn.commit()
                    logger.info("✅ Alembic version table set to migration 008")
                    return True
                else:
                    logger.info("🔄 Database schema needs update - recreating with fresh schema")
            except Exception as e:
                logger.info(f"🔄 Could not check schema ({e}) - recreating with fresh schema")
        else:
            logger.info("🆕 Fresh database - creating initial schema")

        # Drop and recreate all tables
        logger.info("🗑️  Dropping all existing tables...")
        Base.metadata.drop_all(bind=engine)
        logger.info("✅ All tables dropped")

        logger.info("🏗️  Creating tables from current models...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ All tables created")

        # Initialize Alembic version table
        logger.info("🔧 Initializing Alembic version table...")
        with engine.connect() as conn:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS alembic_version (
                    version_num VARCHAR(32) NOT NULL,
                    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
                )
            """))
            conn.execute(text("DELETE FROM alembic_version"))
            conn.execute(text("INSERT INTO alembic_version (version_num) VALUES ('008')"))
            conn.commit()
        logger.info("✅ Alembic version table initialized to migration 008")

        # Verify tables were created/updated
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        logger.info(f"✅ Database initialization completed! {len(tables)} tables available:")
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
