from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from typing import AsyncGenerator

class Base(DeclarativeBase):
    pass

# We'll create the engine when settings are available
engine = None
AsyncSessionLocal = None

def init_db(database_url: str, pool_size: int = 10, max_overflow: int = 20, echo: bool = False):
    """Initialize database connection."""
    global engine, AsyncSessionLocal
    
    engine = create_async_engine(
        database_url,
        pool_size=pool_size,
        max_overflow=max_overflow,
        echo=echo,
    )
    
    AsyncSessionLocal = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Get database session."""
    if AsyncSessionLocal is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def create_tables():
    """Create all tables."""
    if engine is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def drop_tables():
    """Drop all tables."""
    if engine is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)