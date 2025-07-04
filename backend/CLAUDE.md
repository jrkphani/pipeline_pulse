# Backend CLAUDE.md

This file provides guidance specific to the backend development of Pipeline Pulse.

## Development Commands

```bash
# Setup virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload

# Run tests
pytest

# Run tests with coverage
pytest --cov

# Code formatting
black .

# Linting
ruff .

# Type checking
mypy .
```

## Compliance Requirements

### 1. File & Module Naming Conventions

**Modules**: Use snake_case naming
```python
# ✅ Good
opportunity_service.py
sync_operations.py
financial_intelligence.py
gtm_motions.py

# ❌ Bad
OpportunityService.py
sync-operations.py
financialIntelligence.py
```

**Classes**: Use PascalCase naming
```python
# ✅ Good
class OpportunityService:
    """Service for managing opportunity business logic."""
    pass

class ZohoCRMClient:
    """Client for Zoho CRM API integration."""
    pass

# ❌ Bad
class opService:  # Wrong case
    pass

class zoho_client:  # Should be PascalCase
    pass
```

**Clear separation between**:
- `api/`: FastAPI routes and endpoints
- `models/`: SQLAlchemy database models
- `services/`: Business logic services
- `schemas/`: Pydantic request/response schemas

### 2. Type Safety & Pydantic Compliance

- **All functions have complete type hints**
- **Pydantic models used for all API schemas**
- **Custom validators implemented where needed**
- **No usage of `Any` or untyped variables**
- **Response models properly configured**

Example of proper typing:
```python
from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
from decimal import Decimal

class OpportunityCreate(BaseModel):
    """Schema for creating opportunities."""
    name: str = Field(..., min_length=1, max_length=255)
    amount_local: Decimal = Field(..., gt=0, decimal_places=2)
    local_currency: str = Field(..., regex=r'^[A-Z]{3}$')
    probability: int = Field(..., ge=0, le=100)
    phase: Literal[1, 2, 3, 4]
    
    @validator('local_currency')
    def validate_currency_code(cls, v):
        if v not in SUPPORTED_CURRENCIES:
            raise ValueError(f'Currency {v} not supported')
        return v

async def create_opportunity(
    opportunity_data: OpportunityCreate,
    db: AsyncSession
) -> OpportunityResponse:
    """Create new opportunity with currency conversion."""
    # Implementation here
```

### 3. Environment Variables & Configuration

**Use Pydantic BaseSettings for all configuration**:
```python
from pydantic import BaseSettings, Field, validator

class Settings(BaseSettings):
    """Application settings with validation."""
    
    # Database
    database_url: str = Field(..., env="DATABASE_URL")
    database_pool_size: int = Field(10, ge=1, le=50)
    
    # Security
    secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    algorithm: str = "HS256"
    
    # Zoho CRM
    zoho_client_id: str = Field(..., env="ZOHO_CLIENT_ID")
    zoho_client_secret: str = Field(..., env="ZOHO_CLIENT_SECRET")
    
    @validator('database_url')
    def validate_database_url(cls, v):
        if not v.startswith(('postgresql://', 'postgresql+asyncpg://')):
            raise ValueError('Database URL must be PostgreSQL')
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
```

### 4. Database Query Patterns & SQLAlchemy

- **All database access through repository pattern**
- **No raw SQL strings (use SQLAlchemy query builder)**
- **Proper transaction management**
- **No SQL injection vulnerabilities**
- **Efficient queries with proper joins and indexes**

Example repository pattern:
```python
class OpportunityRepository:
    """Repository for opportunity data access."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, opportunity_id: int) -> Optional[Opportunity]:
        """Get opportunity by ID."""
        query = select(Opportunity).where(Opportunity.id == opportunity_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def update_health_status_bulk(
        self, 
        opportunity_ids: List[int], 
        new_status: HealthStatus
    ) -> int:
        """Bulk update health status."""
        query = (
            update(Opportunity)
            .where(Opportunity.id.in_(opportunity_ids))
            .values(
                health_status=new_status,
                updated_at=datetime.utcnow()
            )
        )
        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount
```

### 5. API Endpoint Design & Error Handling

- **All endpoints have proper error handling**
- **Appropriate HTTP status codes used**
- **Request/response models properly typed**
- **Dependencies injected correctly**
- **Global exception handlers implemented**

Example endpoint:
```python
@router.post(
    "/",
    response_model=OpportunityResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new opportunity",
    description="Create a new opportunity with automatic currency conversion to SGD"
)
async def create_opportunity(
    opportunity_data: OpportunityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    opportunity_service: OpportunityService = Depends(get_opportunity_service)
) -> OpportunityResponse:
    """Create new opportunity."""
    try:
        # Validate user permissions
        if not current_user.can_create_opportunities:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to create opportunities"
            )
        
        opportunity = await opportunity_service.create_opportunity(opportunity_data)
        
        logger.info(
            "Opportunity created",
            extra={
                "opportunity_id": opportunity.id,
                "user_id": current_user.id,
                "amount_sgd": float(opportunity.amount_sgd)
            }
        )
        
        return opportunity
        
    except ValueError as e:
        logger.warning(f"Validation error creating opportunity: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Unexpected error creating opportunity: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )
```

## Architecture Guidelines

### Database Models
- **Use SQLAlchemy with async support**
- **Proper constraints and validation**
- **Audit fields (created_at, updated_at, created_by, updated_by)**
- **Enum types for controlled vocabularies**
- **Foreign key relationships properly defined**

### Business Logic Services
- **Repository pattern for data access**
- **Service layer for business logic**
- **Dependency injection for testability**
- **Async/await throughout**
- **Proper error handling and logging**

### API Design
- **RESTful endpoints for CRUD operations**
- **WebSocket endpoints for real-time updates**
- **Consistent error response formats**
- **API versioning strategy**
- **OpenAPI/Swagger documentation**

### Integrations
- **Zoho CRM**: Official SDK with error handling and retry logic
- **Currency API**: External service integration with caching
- **WebSocket**: Real-time sync progress and updates
- **Background tasks**: APScheduler for scheduled operations

## Business Logic Implementation

### O2R (Opportunity-to-Revenue) Tracking
Handle the four-phase lifecycle with proper state transitions:
1. **Opportunity (Phase 1)**: Initial deal creation and qualification
2. **Qualified (Phase 2)**: Validated opportunities meeting criteria
3. **Proposal (Phase 3)**: Active proposal/negotiation phase
4. **Revenue (Phase 4)**: Closed-won deals contributing to revenue

### Health Monitoring System
Implement automated health calculation with four states:
- **Success**: Healthy, on-track opportunities
- **Warning**: Requires attention, minor issues
- **Danger**: Critical issues, immediate action needed
- **Neutral**: Default state or insufficient data

### Currency Standardization
- **All financial data normalized to SGD**
- **Real-time exchange rates from Currency Freaks API**
- **Proper handling of currency conversion errors**
- **Caching of exchange rates with TTL**

### Sync Operations
- **Full sync on startup**: Complete data synchronization from Zoho
- **Incremental sync**: Regular updates (default: every 15 minutes)
- **Conflict resolution**: Automated merge strategies with manual override
- **Error recovery**: Retry logic with exponential backoff

## Security Best Practices

- **All API endpoints properly authenticated**
- **Role-based access control implemented**
- **Input validation on all endpoints**
- **SQL injection prevention (no raw SQL)**
- **Rate limiting implemented**
- **CORS properly configured**
- **Secrets managed through environment variables**

## Database Design

### Data Types & Constraints
- **DECIMAL for monetary values (not FLOAT)**
- **TIMESTAMP WITH TIME ZONE for all timestamps**
- **ENUMs for controlled vocabularies**
- **CHECK constraints for data validation**
- **Proper PRIMARY KEY and FOREIGN KEY constraints**

### Performance Optimization
- **Strategic indexing based on query patterns**
- **Composite indexes for complex queries**
- **Partial indexes where appropriate**
- **Connection pooling configured**
- **Query optimization and EXPLAIN ANALYZE**

### Security & Access Control
- **Database users follow principle of least privilege**
- **Row Level Security (RLS) where needed**
- **Audit logging for sensitive operations**
- **No default passwords or weak authentication**

## Testing Strategy

- **pytest**: Unit testing framework
- **pytest-asyncio**: Async test support
- **pytest-cov**: Code coverage reporting
- **Factories**: Test data generation
- **Mocking**: External service dependencies

Example test structure:
```python
@pytest.mark.asyncio
async def test_create_opportunity(db_session, opportunity_factory):
    """Test opportunity creation with currency conversion."""
    # Arrange
    opportunity_data = opportunity_factory.build()
    service = OpportunityService(db_session)
    
    # Act
    result = await service.create_opportunity(opportunity_data)
    
    # Assert
    assert result.id is not None
    assert result.amount_sgd > 0
    assert result.health_status == HealthStatus.NEUTRAL
```

## Monitoring & Observability

- **Structured logging with structlog**
- **Request/response logging with correlation IDs**
- **Error tracking with Sentry**
- **Performance monitoring with OpenTelemetry**
- **Prometheus metrics for application health**
- **Health check endpoints**

## Code Quality Tools

- **black**: Code formatting
- **ruff**: Fast Python linter
- **mypy**: Static type checking
- **bandit**: Security vulnerability scanning
- **safety**: Dependency vulnerability checking
- **pre-commit**: Git hooks for quality checks

## Development Guidelines

- **Follow PEP 8 style guide**
- **Use type hints throughout**
- **Document complex business logic**
- **Write comprehensive tests**
- **Handle errors gracefully**
- **Log important operations**
- **Use dependency injection**
- **Keep functions focused and testable**