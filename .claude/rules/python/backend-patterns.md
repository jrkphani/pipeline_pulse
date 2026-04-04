# Python Rules — Pipeline Pulse Backend

> Extends: rules/common/coding-style.md
> Stack: FastAPI 0.109 · SQLAlchemy 2.0 async · Pydantic v2 · Alembic · Python 3.11+

---

## Async-First

Every DB operation MUST be async. No exceptions.

```python
# WRONG — sync in an async application
def get_opportunity(db: Session, opp_id: UUID) -> Opportunity:
    return db.query(Opportunity).filter(Opportunity.id == opp_id).first()

# RIGHT — fully async
async def get_opportunity(
    db: AsyncSession,
    opp_id: UUID,
) -> Opportunity | None:
    result = await db.execute(
        select(Opportunity).where(Opportunity.id == opp_id)
    )
    return result.scalar_one_or_none()
```

---

## SQLAlchemy 2.0 Patterns

```python
# Use select() — never db.query() (deprecated in 2.0)
from sqlalchemy import select, update, delete

# List with filters
async def list_opportunities(
    db: AsyncSession,
    stage: OpportunityStage | None = None,
    custodian_id: UUID | None = None,
    skip: int = 0,
    limit: int = 100,
) -> list[Opportunity]:
    stmt = select(Opportunity)
    if stage:
        stmt = stmt.where(Opportunity.stage == stage)
    if custodian_id:
        stmt = stmt.where(Opportunity.custodian_id == custodian_id)
    stmt = stmt.offset(skip).limit(limit)
    result = await db.execute(stmt)
    return list(result.scalars().all())

# Eager loading for relationships
stmt = (
    select(Opportunity)
    .options(
        selectinload(Opportunity.account),
        selectinload(Opportunity.custodian),
    )
    .where(Opportunity.id == opp_id)
)
```

---

## Pydantic v2 Schemas

```python
from pydantic import BaseModel, Field, model_validator, field_validator
from decimal import Decimal
from uuid import UUID

class OpportunityCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    sgd_core: Decimal = Field(gt=Decimal('0'), decimal_places=2)
    stage: OpportunityStage
    account_id: UUID
    custodian_id: UUID

    # v2 field validator
    @field_validator('sgd_core', mode='before')
    @classmethod
    def validate_sgd_core(cls, v: object) -> Decimal:
        # Ensure no float precision errors
        return Decimal(str(v)).quantize(Decimal('0.01'))

    # v2 model validator (cross-field)
    @model_validator(mode='after')
    def validate_iat_qualification(self) -> 'OpportunityCreate':
        # IAT rules live here
        return self

class OpportunityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)  # v2 orm_mode

    id: UUID
    name: str
    sgd_core: Decimal
    stage: OpportunityStage
    custodian: UserSummary  # nested schema
    account: AccountSummary
    created_at: datetime
    updated_at: datetime
```

---

## FastAPI Route Patterns

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.core.auth import get_current_user

router = APIRouter(prefix="/opportunities", tags=["opportunities"])

@router.get("/", response_model=list[OpportunityResponse])
async def list_opportunities(
    stage: OpportunityStage | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Opportunity]:
    return await opportunity_service.list(db, stage=stage)

@router.patch("/{opportunity_id}", response_model=OpportunityResponse)
async def update_opportunity(
    opportunity_id: UUID,
    payload: OpportunityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Opportunity:
    opp = await opportunity_service.get(db, opportunity_id)
    if not opp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND)
    return await opportunity_service.update(db, opp, payload)
```

---

## Service Layer Pattern

```python
# Services return domain objects — never raw DB rows
class OpportunityService:
    async def create(
        self,
        db: AsyncSession,
        payload: OpportunityCreate,
        created_by: UUID,
    ) -> Opportunity:
        """Create opportunity and initialise first relay leg."""
        async with db.begin():
            opp = Opportunity(**payload.model_dump(), created_by=created_by)
            db.add(opp)
            await db.flush()  # get the ID

            # Initialise relay race
            relay_leg = RelayLeg(
                opportunity_id=opp.id,
                custodian_id=payload.custodian_id,
                started_at=datetime.utcnow(),
            )
            db.add(relay_leg)

        await db.refresh(opp)
        return opp
```

---

## Monetary Values — Always Decimal

```python
# models/opportunity.py
from sqlalchemy import Numeric

class Opportunity(Base):
    __tablename__ = "opportunities"

    sgd_core: Mapped[Decimal] = mapped_column(
        Numeric(15, 2),
        nullable=False,
        comment="Pipeline value in Singapore Dollars"
    )

# NEVER use Float for money
# sgd_core: Mapped[float] = mapped_column(Float)  ❌
```

---

## Error Handling

```python
# Use specific HTTP status codes
from fastapi import HTTPException, status

# 404 — resource not found
raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Opportunity not found")

# 409 — conflict (e.g. relay leg already active)
raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Custodian transfer already pending")

# 422 — let Pydantic handle validation errors automatically

# Custom exception handlers in main.py for domain exceptions
```

---

## Forbidden Patterns

```python
# No sync DB in async context
def get_db(): yield SessionLocal()  # ❌ — must be AsyncSession

# No raw SQL
await db.execute("SELECT * FROM opportunities WHERE id = %s", [id])  # ❌

# No Float for money
sgd_core: float  # ❌ — use Decimal

# No v1 Pydantic validators
@validator('sgd_core')  # ❌ — use @field_validator
def validate_sgd(cls, v): ...

# No new migration without instruction
# alembic revision --autogenerate  # ❌ — ask Phani first

# No global state in FastAPI
opportunities_cache = {}  # ❌ — use Redis via app.state
```
