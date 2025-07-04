from logging.config import fileConfig
from sqlalchemy import engine_from_config
from sqlalchemy import pool
from alembic import context
import os
import sys

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

# Import your models and config
from app.core.config import settings
from app.core.database import Base

# Import all models to ensure they're registered with SQLAlchemy
from app.models.currency_rate import CurrencyRate
from app.models.crm_record import CrmRecord, CrmRecordHistory, DataQualityAlert, DataQualityConfig
from app.models.crm_sync_sessions import CRMSyncSession, SyncStatusLog, RecordSyncStatus, SyncConfiguration, SyncHealthMetrics
from app.models.bulk_export import BulkExportJob, BulkExportRecord
from app.models.system_settings import SystemSetting
from app.models.token_management import ZohoTokenRecord, TokenRefreshLog, TokenAlert
from app.models.zoho_oauth_token import ZohoOAuthToken
from app.models.user import User, UserSession
from app.models.user_state import UserState, StateChangeLog

# Try to import O2R models if they exist
try:
    from app.models.o2r.opportunity import O2ROpportunity
    from app.models.o2r.milestone import O2RMilestone
    from app.models.o2r.phase import O2RPhase
    from app.models.o2r.health import O2RHealth
    from app.models.o2r.review import O2RReview
except ImportError:
    pass

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here
# for 'autogenerate' support
target_metadata = Base.metadata

# other values from the config, defined by the needs of env.py,
# can be acquired:
# my_important_option = config.get_main_option("my_important_option")
# ... etc.


def get_database_url():
    """Get database URL from environment or config"""
    # Use the same logic as the main application
    if settings.ENVIRONMENT == "production":
        return settings.DATABASE_URL_PRODUCTION
    else:
        return settings.DATABASE_URL


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = get_database_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Override the sqlalchemy.url in alembic.ini with our database URL
    configuration = config.get_section(config.config_ini_section)
    configuration['sqlalchemy.url'] = get_database_url()
    
    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
