"""Seed script for development — creates admin user + territories."""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.models import User, Territory, CurrencyRate
from app.models.user import UserRole
from app.core.security import get_password_hash

DATABASE_URL = "postgresql+asyncpg://pipeline_pulse:pipeline_pulse@localhost:5432/pipeline_pulse"

engine = create_async_engine(DATABASE_URL)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def seed():
    async with SessionLocal() as session:
        # Territories
        territories = [
            Territory(name="Singapore", region="SEA"),
            Territory(name="Malaysia", region="SEA"),
            Territory(name="Indonesia", region="SEA"),
            Territory(name="Thailand", region="SEA"),
            Territory(name="Philippines", region="SEA"),
            Territory(name="Vietnam", region="SEA"),
            Territory(name="India", region="India"),
            Territory(name="Australia", region="ANZ"),
            Territory(name="New Zealand", region="ANZ"),
        ]
        session.add_all(territories)

        # Admin user
        admin = User(
            email="admin@1cloudhub.com",
            hashed_password=get_password_hash("changeme123"),
            first_name="System",
            last_name="Admin",
            role=UserRole.admin,
            is_superuser=True,
        )
        session.add(admin)

        # Seed AE user (for dev testing)
        ae = User(
            email="vikram@1cloudhub.com",
            hashed_password=get_password_hash("changeme123"),
            first_name="Vikram",
            last_name="S",
            role=UserRole.ae,
        )
        session.add(ae)

        # Seed common FX rates (SGD base)
        fx_rates = [
            CurrencyRate(currency_code="USD", sgd_rate=0.741),
            CurrencyRate(currency_code="INR", sgd_rate=61.85),
            CurrencyRate(currency_code="MYR", sgd_rate=3.318),
            CurrencyRate(currency_code="IDR", sgd_rate=11580.0),
            CurrencyRate(currency_code="THB", sgd_rate=26.15),
            CurrencyRate(currency_code="AUD", sgd_rate=1.148),
            CurrencyRate(currency_code="GBP", sgd_rate=0.586),
            CurrencyRate(currency_code="EUR", sgd_rate=0.681),
            CurrencyRate(currency_code="JPY", sgd_rate=110.5),
        ]
        session.add_all(fx_rates)

        await session.commit()
        print("✓ Seed complete")
        print(f"  - {len(territories)} territories")
        print(f"  - 2 users (admin@1cloudhub.com, vikram@1cloudhub.com)")
        print(f"  - {len(fx_rates)} FX rates")
        print("  - Default password: changeme123")


asyncio.run(seed())
