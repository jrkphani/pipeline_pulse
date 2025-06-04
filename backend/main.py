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
    """Run database migration on startup using Alembic"""
    try:
        logger.info("🔧 Starting database migration...")

        from app.core.database import engine, Base
        from sqlalchemy import text
        from alembic.config import Config
        from alembic import command
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

        # Run Alembic migrations
        logger.info("🚀 Running Alembic migrations...")

        # Get the directory containing this file (backend/)
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        alembic_cfg_path = os.path.join(backend_dir, "alembic.ini")

        # Create Alembic config
        alembic_cfg = Config(alembic_cfg_path)

        # Check if this is a fresh database or has existing tables
        from sqlalchemy import inspect
        inspector = inspect(engine)
        existing_tables = inspector.get_table_names()

        # Check if Alembic version table exists
        has_alembic_version = 'alembic_version' in existing_tables
        has_data_tables = len([t for t in existing_tables if t != 'alembic_version']) > 0

        if has_data_tables:
            if not has_alembic_version:
                # Database has tables but no Alembic tracking - detect current state
                logger.info("  📋 Database has existing tables but no Alembic tracking")
                logger.info("  🔍 Detecting current database schema state...")

                # Check for key tables to determine migration level (check most advanced first)
                table_checks = [
                    ('crm_records', '005'),
                    ('bulk_export_jobs', '004'),
                    ('bulk_update_batches', '003'),
                    ('currency_rates', '002'),
                    ('analyses', '001')  # fallback
                ]

                current_migration = '001'  # default fallback
                for table_name, migration_id in table_checks:
                    if table_name in existing_tables:
                        current_migration = migration_id
                        logger.info(f"  ✅ Found table '{table_name}' - schema at migration {migration_id}")
                        break

                logger.info(f"  🏷️  Marking current state as migration {current_migration}...")
                command.stamp(alembic_cfg, current_migration)
                logger.info(f"  ✅ Database marked as baseline (migration {current_migration})")
            else:
                # Check if Alembic version matches actual schema
                from sqlalchemy import text
                with engine.connect() as conn:
                    result = conn.execute(text("SELECT version_num FROM alembic_version"))
                    alembic_version = result.scalar()
                    logger.info(f"  📌 Current Alembic version: {alembic_version}")

                # Detect actual schema state with enhanced column checking
                from sqlalchemy import text

                # Check for specific columns to determine exact migration state
                def check_column_exists(table_name: str, column_name: str) -> bool:
                    try:
                        with engine.connect() as conn:
                            result = conn.execute(text(f"""
                                SELECT column_name
                                FROM information_schema.columns
                                WHERE table_name = '{table_name}' AND column_name = '{column_name}'
                            """))
                            return result.fetchone() is not None
                    except Exception:
                        return False

                # Enhanced migration detection with column checks
                actual_migration = '001'  # default fallback

                if 'crm_records' in existing_tables:
                    # Even if we have crm_records (migration 005), check if S3 columns exist
                    if check_column_exists('analyses', 's3_key') and check_column_exists('analyses', 's3_bucket'):
                        actual_migration = '006'
                        logger.info(f"  ✅ Found table 'crm_records' and S3 columns - schema at migration 006")
                    else:
                        actual_migration = '005'
                        logger.info(f"  ✅ Found table 'crm_records' without S3 columns - schema at migration 005")
                elif 'bulk_export_jobs' in existing_tables:
                    actual_migration = '004'
                    logger.info(f"  ✅ Found table 'bulk_export_jobs' - schema at migration 004")
                elif 'bulk_update_batches' in existing_tables:
                    actual_migration = '003'
                    logger.info(f"  ✅ Found table 'bulk_update_batches' - schema at migration 003")
                elif 'currency_rates' in existing_tables:
                    actual_migration = '002'
                    logger.info(f"  ✅ Found table 'currency_rates' - schema at migration 002")
                elif 'analyses' in existing_tables:
                    # Check if S3 columns exist to determine if migration 006 was applied
                    if check_column_exists('analyses', 's3_key') and check_column_exists('analyses', 's3_bucket'):
                        actual_migration = '006'
                        logger.info(f"  ✅ Found table 'analyses' with S3 columns - schema at migration 006")
                    else:
                        actual_migration = '001'
                        logger.info(f"  ✅ Found table 'analyses' without S3 columns - schema at migration 001")

                if alembic_version != actual_migration:
                    logger.info(f"  🔧 Alembic version mismatch! Recorded: {alembic_version}, Actual: {actual_migration}")
                    logger.info(f"  🏷️  Updating Alembic version to match actual schema...")
                    command.stamp(alembic_cfg, actual_migration)
                    logger.info(f"  ✅ Alembic version corrected to {actual_migration}")

                # Now run normal migration process
                command.upgrade(alembic_cfg, "head")
                logger.info("  ✅ Alembic migrations completed")
        else:
            # Fresh database - normal migration process
            command.upgrade(alembic_cfg, "head")
            logger.info("  ✅ Alembic migrations completed")

        # Verify tables were created/updated
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        logger.info(f"✅ Database migration completed! {len(tables)} tables available:")
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
