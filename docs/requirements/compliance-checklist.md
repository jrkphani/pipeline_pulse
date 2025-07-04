# Pipeline Pulse Compliance Audit Checklist

## 1. Frontend Compliance Audit (React + TypeScript)

### 1.1 File & Component Naming Conventions

#### ✅ Best Practices
- **Components**: PascalCase with descriptive names
  ```typescript
  // ✅ Good
  MetricCard.tsx
  O2RPhaseIndicator.tsx
  SyncProgressBar.tsx
  CurrencyDisplay.tsx
  
  // ❌ Bad
  metric.tsx
  o2r.tsx
  sync-progress.tsx
  currencyDisplay.tsx
  ```

- **Hooks**: camelCase starting with "use"
  ```typescript
  // ✅ Good
  useOpportunityData.ts
  useSyncStatus.ts
  useCurrencyConversion.ts
  
  // ❌ Bad
  OpportunityData.ts
  sync-status.ts
  currencyConversion.ts
  ```

- **Utilities & Services**: camelCase with descriptive purpose
  ```typescript
  // ✅ Good
  apiClient.ts
  formatCurrency.ts
  dateHelpers.ts
  
  // ❌ Bad
  utils.ts
  helpers.ts
  functions.ts
  ```

#### 🔍 Audit Questions
- [ ] All component files use PascalCase?
- [ ] Hook files start with "use" prefix?
- [ ] Utility files have descriptive names?
- [ ] No generic names like "utils" or "helpers"?

### 1.2 Type Safety & TypeScript Compliance

#### ✅ Best Practices
```typescript
// ✅ Good - Strict typing with interfaces
interface OpportunityCardProps {
  opportunity: Opportunity;
  healthStatus: HealthStatus;
  onEdit?: (id: string) => void;
  showActions?: boolean;
}

// ✅ Good - Union types for status
type HealthStatus = 'success' | 'warning' | 'danger' | 'neutral';

// ✅ Good - Generic constraints
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// ❌ Bad - Using 'any'
interface BadProps {
  data: any;
  callback: any;
  options: any;
}

// ❌ Bad - Unclear types
interface UnclearProps {
  stuff: object;
  things: unknown[];
}
```

#### 🔍 Audit Questions
- [ ] No usage of `any` type (except justified cases with comments)?
- [ ] All props interfaces properly defined?
- [ ] Union types used for limited value sets?
- [ ] Generic types used appropriately?
- [ ] Strict TypeScript configuration enabled?

### 1.3 Design Token Compliance

#### ✅ Best Practices
```typescript
// ✅ Good - Using design tokens
const MetricCard = styled.div`
  padding: var(--pp-space-6);
  border-radius: var(--pp-radius-lg);
  font-size: var(--pp-font-size-md);
  color: var(--pp-color-primary-500);
  box-shadow: var(--pp-shadow-sm);
`;

// ✅ Good - Design token utilities
const spacing = {
  xs: 'var(--pp-space-1)',
  sm: 'var(--pp-space-2)',
  md: 'var(--pp-space-4)',
  lg: 'var(--pp-space-6)',
  xl: 'var(--pp-space-8)',
} as const;

// ❌ Bad - Hard-coded values
const BadCard = styled.div`
  padding: 24px;
  border-radius: 8px;
  font-size: 16px;
  color: #7c3aed;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;
```

#### 🔍 Audit Questions
- [ ] All spacing uses design tokens (`--pp-space-*`)?
- [ ] All colors use semantic tokens (`--pp-color-*`)?
- [ ] All typography uses token system (`--pp-font-*`)?
- [ ] No hard-coded CSS values?
- [ ] Animation durations use tokens (`--pp-duration-*`)?

### 1.4 Component Reusability & Architecture

#### ✅ Best Practices
```typescript
// ✅ Good - Reusable component with variants
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  ...props
}) => {
  return (
    <button
      className={cn(
        'pp-button',
        `pp-button--${variant}`,
        `pp-button--${size}`,
        loading && 'pp-button--loading'
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
};

// ✅ Good - Composition over inheritance
const MetricCard = ({ title, value, trend, ...props }: MetricCardProps) => (
  <Card className="pp-metric-card" {...props}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="metric-value">{value}</div>
      {trend && <TrendIndicator trend={trend} />}
    </CardContent>
  </Card>
);

// ❌ Bad - Non-reusable, hard-coded component
const SpecificButton = () => (
  <button 
    style={{ 
      backgroundColor: '#7c3aed', 
      padding: '12px 24px',
      borderRadius: '8px' 
    }}
    onClick={() => console.log('clicked')}
  >
    Submit Opportunity
  </button>
);
```

#### 🔍 Audit Questions
- [ ] Components accept props for customization?
- [ ] No hard-coded text or values in components?
- [ ] Consistent prop interfaces across similar components?
- [ ] Components use composition patterns?
- [ ] shadcn/ui base components extended, not replaced?

### 1.5 Error Boundaries & Error Handling

#### ✅ Best Practices
```typescript
// ✅ Good - Error boundary implementation
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Pipeline Pulse Error:', error, errorInfo);
    // Send to monitoring service
    errorReportingService.report(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error} 
          resetError={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}

// ✅ Good - Error handling in async operations
const useOpportunityData = (id: string) => {
  const [data, setData] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const opportunity = await apiClient.getOpportunity(id);
        setData(opportunity);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        errorReportingService.report(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { data, loading, error, refetch: fetchData };
};

// ❌ Bad - No error handling
const BadComponent = ({ id }: { id: string }) => {
  const [data, setData] = useState();
  
  useEffect(() => {
    fetch(`/api/opportunities/${id}`)
      .then(res => res.json())
      .then(data => setData(data));
  }, [id]);

  return <div>{data.name}</div>; // Will crash if data is undefined
};
```

#### 🔍 Audit Questions
- [ ] Error boundaries implemented at appropriate levels?
- [ ] All async operations have error handling?
- [ ] Error states displayed to users with recovery options?
- [ ] Errors logged to monitoring service?
- [ ] No unhandled promise rejections?

### 1.6 Environment Variables & Configuration

#### ✅ Best Practices
```typescript
// ✅ Good - Typed environment configuration
interface AppConfig {
  apiUrl: string;
  wsUrl: string;
  appVersion: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    realTimeSync: boolean;
    advancedAnalytics: boolean;
  };
}

const config: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  wsUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:8000',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  environment: (import.meta.env.VITE_ENVIRONMENT as AppConfig['environment']) || 'development',
  features: {
    realTimeSync: import.meta.env.VITE_FEATURE_REAL_TIME_SYNC === 'true',
    advancedAnalytics: import.meta.env.VITE_FEATURE_ADVANCED_ANALYTICS === 'true',
  },
};

// ✅ Good - Environment validation
const validateConfig = (config: AppConfig): void => {
  if (!config.apiUrl) {
    throw new Error('VITE_API_URL is required');
  }
  if (!['development', 'staging', 'production'].includes(config.environment)) {
    throw new Error('Invalid VITE_ENVIRONMENT value');
  }
};

// ❌ Bad - Direct env usage without validation
const ApiService = {
  baseUrl: import.meta.env.VITE_API_URL, // Could be undefined
  makeRequest: (endpoint: string) => {
    return fetch(`${import.meta.env.VITE_API_URL}${endpoint}`); // Repeated, unvalidated
  }
};
```

#### 🔍 Audit Questions
- [ ] All environment variables prefixed with `VITE_`?
- [ ] Environment configuration centralized and typed?
- [ ] Environment variables validated on app startup?
- [ ] No hard-coded URLs or configuration values?
- [ ] Default values provided for non-critical env vars?

---

## 2. Backend Compliance Audit (FastAPI + Python)

### 2.1 File & Module Naming Conventions

#### ✅ Best Practices
```python
# ✅ Good - Module structure
app/
├── api/
│   └── v1/
│       ├── endpoints/
│       │   ├── opportunities.py
│       │   ├── sync_operations.py
│       │   ├── financial_intelligence.py
│       │   └── gtm_motions.py
│       └── deps.py
├── core/
│   ├── config.py
│   ├── security.py
│   └── database.py
├── models/
│   ├── opportunity.py
│   ├── sync_session.py
│   └── user.py
├── schemas/
│   ├── opportunity_schemas.py
│   ├── sync_schemas.py
│   └── response_schemas.py
├── services/
│   ├── zoho_service.py
│   ├── currency_service.py
│   └── o2r_calculator.py
└── tasks/
    ├── sync_tasks.py
    └── currency_tasks.py

# ✅ Good - Class naming
class OpportunityService:
    """Service for managing opportunity business logic."""
    pass

class ZohoCRMClient:
    """Client for Zoho CRM API integration."""
    pass

class O2RHealthCalculator:
    """Calculator for O2R health status."""
    pass

# ❌ Bad - Unclear naming
class OpService:  # Too abbreviated
    pass

class zoho_client:  # Should be PascalCase
    pass

class Calculator:  # Too generic
    pass
```

#### 🔍 Audit Questions
- [ ] All modules use snake_case naming?
- [ ] All classes use PascalCase naming?
- [ ] Module names are descriptive and specific?
- [ ] Clear separation between API, models, services, and schemas?
- [ ] No generic names like "utils" or "helpers"?

### 2.2 Type Safety & Pydantic Compliance

#### ✅ Best Practices
```python
# ✅ Good - Strict Pydantic models
from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
from datetime import datetime
from decimal import Decimal

class OpportunityBase(BaseModel):
    """Base opportunity model with common fields."""
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

class OpportunityCreate(OpportunityBase):
    """Schema for creating opportunities."""
    territory_id: int = Field(..., gt=0)
    account_id: int = Field(..., gt=0)

class OpportunityResponse(OpportunityBase):
    """Schema for opportunity responses."""
    id: int
    amount_sgd: Decimal
    health_status: Literal['success', 'warning', 'danger', 'neutral']
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

# ✅ Good - Service with proper typing
class OpportunityService:
    def __init__(self, db: AsyncSession, currency_service: CurrencyService):
        self.db = db
        self.currency_service = currency_service
    
    async def create_opportunity(
        self, 
        opportunity_data: OpportunityCreate
    ) -> OpportunityResponse:
        """Create new opportunity with currency conversion."""
        sgd_amount = await self.currency_service.convert_to_sgd(
            amount=opportunity_data.amount_local,
            from_currency=opportunity_data.local_currency
        )
        
        db_opportunity = Opportunity(
            **opportunity_data.dict(),
            amount_sgd=sgd_amount
        )
        
        self.db.add(db_opportunity)
        await self.db.commit()
        await self.db.refresh(db_opportunity)
        
        return OpportunityResponse.from_orm(db_opportunity)

# ❌ Bad - Loose typing
def create_opportunity(data):  # No type hints
    amount_sgd = convert_currency(data['amount'], data['currency'])  # Untyped
    opportunity = {  # Using dict instead of model
        'name': data['name'],
        'amount': amount_sgd,
        # Missing validation
    }
    return opportunity
```

#### 🔍 Audit Questions
- [ ] All functions have complete type hints?
- [ ] Pydantic models used for all API schemas?
- [ ] Custom validators implemented where needed?
- [ ] No usage of `Any` or untyped variables?
- [ ] Response models properly configured?

### 2.3 Environment Variables & Configuration

#### ✅ Best Practices
```python
# ✅ Good - Typed configuration with Pydantic
from pydantic import BaseSettings, Field, validator
from typing import Optional, List
import secrets

class Settings(BaseSettings):
    """Application settings with validation."""
    
    # Application
    app_name: str = "Pipeline Pulse"
    app_env: str = Field("development", regex=r'^(development|staging|production)$')
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    
    # Database
    database_url: str = Field(..., env="DATABASE_URL")
    database_pool_size: int = Field(10, ge=1, le=50)
    database_max_overflow: int = Field(20, ge=0, le=100)
    
    # Security
    secret_key: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    algorithm: str = "HS256"
    access_token_expire_minutes: int = Field(480, gt=0)
    
    # Zoho CRM
    zoho_client_id: str = Field(..., env="ZOHO_CLIENT_ID")
    zoho_client_secret: str = Field(..., env="ZOHO_CLIENT_SECRET")
    zoho_redirect_uri: str = Field(..., env="ZOHO_REDIRECT_URI")
    zoho_region: str = Field("US", regex=r'^(US|EU|IN|AU|JP)$')
    
    # Currency
    base_currency: str = Field("SGD", regex=r'^[A-Z]{3}$')
    currency_api_key: str = Field(..., env="CURRENCY_API_KEY")
    currency_cache_days: int = Field(7, ge=1, le=30)
    
    # Redis
    redis_url: str = Field("redis://localhost:6379/0", env="REDIS_URL")
    
    @validator('database_url')
    def validate_database_url(cls, v):
        if not v.startswith(('postgresql://', 'postgresql+asyncpg://')):
            raise ValueError('Database URL must be PostgreSQL')
        return v
    
    @validator('debug')
    def validate_debug(cls, v, values):
        if v and values.get('app_env') == 'production':
            raise ValueError('Debug cannot be True in production')
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# ✅ Good - Singleton settings instance
@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

settings = get_settings()

# ❌ Bad - Direct environment access
import os

DATABASE_URL = os.getenv("DATABASE_URL")  # No validation
DEBUG = os.getenv("DEBUG") == "true"  # Weak type conversion
SECRET_KEY = "hardcoded-secret-key"  # Hardcoded secret
API_KEY = os.environ["API_KEY"]  # Will crash if missing
```

#### 🔍 Audit Questions
- [ ] All configuration uses Pydantic BaseSettings?
- [ ] Environment variables properly validated?
- [ ] No hardcoded secrets or URLs?
- [ ] Default values provided where appropriate?
- [ ] Settings cached with @lru_cache?

### 2.4 Database Query Patterns & SQLAlchemy

#### ✅ Best Practices
```python
# ✅ Good - Repository pattern with typed queries
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_, or_
from typing import Optional, List

class OpportunityRepository:
    """Repository for opportunity data access."""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_id(self, opportunity_id: int) -> Optional[Opportunity]:
        """Get opportunity by ID."""
        query = select(Opportunity).where(Opportunity.id == opportunity_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()
    
    async def get_by_health_status(
        self, 
        status: HealthStatus,
        limit: int = 100,
        offset: int = 0
    ) -> List[Opportunity]:
        """Get opportunities by health status with pagination."""
        query = (
            select(Opportunity)
            .where(Opportunity.health_status == status)
            .order_by(Opportunity.updated_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(query)
        return result.scalars().all()
    
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

# ✅ Good - Service using repository
class O2RService:
    def __init__(self, opportunity_repo: OpportunityRepository):
        self.opportunity_repo = opportunity_repo
    
    async def calculate_and_update_health(self, opportunity_id: int) -> HealthStatus:
        """Calculate and update opportunity health status."""
        opportunity = await self.opportunity_repo.get_by_id(opportunity_id)
        if not opportunity:
            raise ValueError(f"Opportunity {opportunity_id} not found")
        
        new_status = self._calculate_health_status(opportunity)
        
        if new_status != opportunity.health_status:
            await self.opportunity_repo.update_health_status_bulk(
                [opportunity_id], 
                new_status
            )
        
        return new_status

# ❌ Bad - Raw SQL and direct DB access
class BadOpportunityService:
    def __init__(self, db):
        self.db = db
    
    async def get_opportunity(self, id):
        # Raw SQL injection risk
        result = await self.db.execute(
            f"SELECT * FROM opportunities WHERE id = {id}"
        )
        return result.fetchone()
    
    async def update_opportunities(self, ids, status):
        # No transaction management
        for id in ids:
            await self.db.execute(
                f"UPDATE opportunities SET status = '{status}' WHERE id = {id}"
            )
```

#### 🔍 Audit Questions
- [ ] All database access through repository pattern?
- [ ] No raw SQL strings (use SQLAlchemy query builder)?
- [ ] Proper transaction management?
- [ ] No SQL injection vulnerabilities?
- [ ] Efficient queries with proper joins and indexes?

### 2.5 API Endpoint Design & Error Handling

#### ✅ Best Practices
```python
# ✅ Good - Proper endpoint design with error handling
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/api/v1/opportunities", tags=["opportunities"])

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
    except CurrencyConversionError as e:
        logger.error(f"Currency conversion failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Currency conversion service unavailable"
        )
    except Exception as e:
        logger.error(f"Unexpected error creating opportunity: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# ✅ Good - Global exception handler
@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    """Handle Pydantic validation errors."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "Validation Error",
            "details": exc.errors(),
            "request_id": request.headers.get("X-Request-ID")
        }
    )

# ❌ Bad - Poor error handling and design
@app.get("/opportunities/{id}")
async def get_opportunity(id: int):  # No type hints, no dependencies
    try:
        opportunity = db.execute(f"SELECT * FROM opportunities WHERE id = {id}")
        return opportunity.fetchone()  # No error handling, SQL injection
    except:  # Bare except
        return {"error": "something went wrong"}  # Vague error message
```

#### 🔍 Audit Questions
- [ ] All endpoints have proper error handling?
- [ ] Appropriate HTTP status codes used?
- [ ] Request/response models properly typed?
- [ ] Dependencies injected correctly?
- [ ] Global exception handlers implemented?

---

## 3. Database Compliance Audit (PostgreSQL)

### 3.1 Schema & Table Naming Conventions

#### ✅ Best Practices
```sql
-- ✅ Good - Consistent naming conventions
-- Schema organization
CREATE SCHEMA pipeline_pulse_core;
CREATE SCHEMA pipeline_pulse_analytics;
CREATE SCHEMA pipeline_pulse_audit;

-- Table naming: singular, descriptive
CREATE TABLE pipeline_pulse_core.opportunity (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    amount_local DECIMAL(15,2) NOT NULL,
    amount_sgd DECIMAL(15,2) NOT NULL,
    local_currency CHAR(3) NOT NULL,
    health_status opportunity_health_status NOT NULL,
    o2r_phase INTEGER NOT NULL CHECK (o2r_phase BETWEEN 1 AND 4),
    territory_id INTEGER NOT NULL,
    account_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by INTEGER NOT NULL,
    updated_by INTEGER NOT NULL
);

-- Index naming: table_column(s)_type
CREATE INDEX idx_opportunity_health_status ON pipeline_pulse_core.opportunity(health_status);
CREATE INDEX idx_opportunity_territory_phase ON pipeline_pulse_core.opportunity(territory_id, o2r_phase);
CREATE INDEX idx_opportunity_created_at ON pipeline_pulse_core.opportunity(created_at);

-- Foreign key naming: fk_table_referenced_table
ALTER TABLE pipeline_pulse_core.opportunity 
ADD CONSTRAINT fk_opportunity_territory 
FOREIGN KEY (territory_id) REFERENCES pipeline_pulse_core.territory(id);

-- Check constraint naming: chk_table_condition
ALTER TABLE pipeline_pulse_core.opportunity 
ADD CONSTRAINT chk_opportunity_amount_positive 
CHECK (amount_local > 0 AND amount_sgd > 0);

-- ❌ Bad - Inconsistent naming
CREATE TABLE Opportunities (  -- Mixed case
    ID int,  -- Inconsistent case
    opp_name varchar(255),  -- Abbreviated
    amt decimal(10,2),  -- Unclear abbreviation
    curr char(3),  -- Too abbreviated
    stat varchar(20),  -- Unclear
    created timestamp  -- Missing timezone, constraints
);

CREATE INDEX opportunity_idx1 ON Opportunities(stat);  -- Non-descriptive
```

#### 🔍 Audit Questions
- [ ] All schemas use descriptive, consistent naming?
- [ ] All tables use singular, snake_case names?
- [ ] All columns use descriptive, snake_case names?
- [ ] All indexes follow naming convention?
- [ ] All constraints properly named?

### 3.2 Data Types & Constraints

#### ✅ Best Practices
```sql
-- ✅ Good - Appropriate data types and constraints
CREATE TYPE opportunity_health_status AS ENUM (
    'success', 'warning', 'danger', 'neutral'
);

CREATE TYPE sync_status AS ENUM (
    'pending', 'in_progress', 'completed', 'failed'
);

CREATE TABLE pipeline_pulse_core.opportunity (
    id SERIAL PRIMARY KEY,
    
    -- String fields with proper lengths
    name VARCHAR(255) NOT NULL CHECK (LENGTH(TRIM(name)) > 0),
    description TEXT,
    
    -- Numeric fields with precision
    amount_local DECIMAL(15,2) NOT NULL CHECK (amount_local > 0),
    amount_sgd DECIMAL(15,2) NOT NULL CHECK (amount_sgd > 0),
    probability INTEGER NOT NULL CHECK (probability BETWEEN 0 AND 100),
    
    -- Currency with validation
    local_currency CHAR(3) NOT NULL CHECK (local_currency ~ '^[A-Z]{3}$'),
    
    -- Enums for controlled values
    health_status opportunity_health_status NOT NULL DEFAULT 'neutral',
    
    -- Timestamps with timezone
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Foreign keys with constraints
    territory_id INTEGER NOT NULL REFERENCES pipeline_pulse_core.territory(id),
    account_id INTEGER NOT NULL REFERENCES pipeline_pulse_core.account(id),
    created_by INTEGER NOT NULL REFERENCES pipeline_pulse_core.app_user(id),
    updated_by INTEGER NOT NULL REFERENCES pipeline_pulse_core.app_user(id),
    
    -- Unique constraints where needed
    UNIQUE(name, account_id)
);

-- ✅ Good - Proper indexing strategy
CREATE INDEX idx_opportunity_health_status_created 
ON pipeline_pulse_core.opportunity(health_status, created_at DESC)
WHERE health_status IN ('warning', 'danger');

CREATE INDEX idx_opportunity_territory_phase_amount 
ON pipeline_pulse_core.opportunity(territory_id, o2r_phase, amount_sgd DESC);

-- ❌ Bad - Poor data types and missing constraints
CREATE TABLE bad_opportunities (
    id INT,  -- No PRIMARY KEY
    name TEXT,  -- Too wide, no length limit
    amount FLOAT,  -- Imprecise for money
    currency VARCHAR(10),  -- Too wide, no validation
    created TIMESTAMP,  -- No timezone
    probability INT,  -- No range validation
    status VARCHAR(50)  -- Should be ENUM
);
```

#### 🔍 Audit Questions
- [ ] Appropriate data types for each column?
- [ ] DECIMAL used for monetary values (not FLOAT)?
- [ ] TIMESTAMP WITH TIME ZONE for all timestamps?
- [ ] ENUMs used for controlled vocabularies?
- [ ] CHECK constraints for data validation?
- [ ] Proper PRIMARY KEY and FOREIGN KEY constraints?

### 3.3 Security & Access Control

#### ✅ Best Practices
```sql
-- ✅ Good - Role-based security
-- Application roles
CREATE ROLE pipeline_pulse_app;
CREATE ROLE pipeline_pulse_readonly;
CREATE ROLE pipeline_pulse_admin;

-- Schema permissions
GRANT USAGE ON SCHEMA pipeline_pulse_core TO pipeline_pulse_app;
GRANT USAGE ON SCHEMA pipeline_pulse_analytics TO pipeline_pulse_readonly;

-- Table permissions
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA pipeline_pulse_core TO pipeline_pulse_app;
GRANT SELECT ON ALL TABLES IN SCHEMA pipeline_pulse_core TO pipeline_pulse_readonly;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA pipeline_pulse_core TO pipeline_pulse_admin;

-- Sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA pipeline_pulse_core TO pipeline_pulse_app;

-- Row Level Security (RLS)
ALTER TABLE pipeline_pulse_core.opportunity ENABLE ROW LEVEL SECURITY;

CREATE POLICY opportunity_territory_policy ON pipeline_pulse_core.opportunity
    USING (territory_id IN (
        SELECT territory_id 
        FROM pipeline_pulse_core.user_territory 
        WHERE user_id = current_setting('app.current_user_id')::INTEGER
    ));

-- ✅ Good - Audit table
CREATE TABLE pipeline_pulse_audit.opportunity_audit (
    id SERIAL PRIMARY KEY,
    operation CHAR(1) NOT NULL CHECK (operation IN ('I', 'U', 'D')),
    opportunity_id INTEGER NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_by INTEGER NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Audit trigger
CREATE OR REPLACE FUNCTION pipeline_pulse_audit.opportunity_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO pipeline_pulse_audit.opportunity_audit (
            operation, opportunity_id, old_values, changed_by
        ) VALUES (
            'D', OLD.id, to_jsonb(OLD), OLD.updated_by
        );
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO pipeline_pulse_audit.opportunity_audit (
            operation, opportunity_id, old_values, new_values, changed_by
        ) VALUES (
            'U', NEW.id, to_jsonb(OLD), to_jsonb(NEW), NEW.updated_by
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO pipeline_pulse_audit.opportunity_audit (
            operation, opportunity_id, new_values, changed_by
        ) VALUES (
            'I', NEW.id, to_jsonb(NEW), NEW.created_by
        );
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ❌ Bad - Poor security practices
-- Overly permissive role
GRANT ALL PRIVILEGES ON DATABASE pipeline_pulse TO public;

-- No RLS or access control
CREATE TABLE sensitive_data (
    id INT,
    ssn VARCHAR(11),  -- Sensitive data without protection
    salary DECIMAL(10,2)
);
```

#### 🔍 Audit Questions
- [ ] Dedicated application roles created?
- [ ] Principle of least privilege followed?
- [ ] Row Level Security enabled where needed?
- [ ] Audit triggers implemented for sensitive tables?
- [ ] No usage of default 'public' schema for app tables?

### 3.4 Performance Optimization

#### ✅ Best Practices
```sql
-- ✅ Good - Strategic indexing
-- Composite index for common query pattern
CREATE INDEX idx_opportunity_territory_status_created 
ON pipeline_pulse_core.opportunity(territory_id, health_status, created_at DESC)
WHERE health_status IN ('warning', 'danger');

-- Partial index for active records
CREATE INDEX idx_opportunity_active_amount 
ON pipeline_pulse_core.opportunity(amount_sgd DESC, updated_at DESC)
WHERE o2r_phase < 4;

-- Expression index for search
CREATE INDEX idx_opportunity_name_search 
ON pipeline_pulse_core.opportunity 
USING gin(to_tsvector('english', name));

-- ✅ Good - Partitioning for large tables
CREATE TABLE pipeline_pulse_core.sync_log (
    id SERIAL,
    session_id UUID NOT NULL,
    record_type VARCHAR(50) NOT NULL,
    operation VARCHAR(20) NOT NULL,
    record_id INTEGER,
    status sync_status NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE pipeline_pulse_core.sync_log_2024_01 
PARTITION OF pipeline_pulse_core.sync_log
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- ✅ Good - Materialized view for analytics
CREATE MATERIALIZED VIEW pipeline_pulse_analytics.territory_performance AS
SELECT 
    t.id AS territory_id,
    t.name AS territory_name,
    COUNT(o.id) AS total_opportunities,
    SUM(o.amount_sgd) AS total_pipeline_sgd,
    AVG(o.amount_sgd) AS avg_deal_size_sgd,
    COUNT(CASE WHEN o.health_status = 'danger' THEN 1 END) AS critical_opportunities,
    MAX(o.updated_at) AS last_updated
FROM pipeline_pulse_core.territory t
LEFT JOIN pipeline_pulse_core.opportunity o ON t.id = o.territory_id
GROUP BY t.id, t.name;

-- Unique index on materialized view
CREATE UNIQUE INDEX idx_territory_performance_territory_id 
ON pipeline_pulse_analytics.territory_performance(territory_id);

-- ❌ Bad - Performance anti-patterns
-- Over-indexing
CREATE INDEX idx_opportunity_name ON opportunity(name);
CREATE INDEX idx_opportunity_amount ON opportunity(amount_sgd);
CREATE INDEX idx_opportunity_currency ON opportunity(local_currency);
CREATE INDEX idx_opportunity_status ON opportunity(health_status);
-- ... too many single-column indexes

-- Poor query patterns
SELECT * FROM opportunity;  -- SELECT *
SELECT * FROM opportunity WHERE UPPER(name) LIKE '%ACME%';  -- Function in WHERE
```

#### 🔍 Audit Questions
- [ ] Indexes created based on actual query patterns?
- [ ] No over-indexing (max 5-7 indexes per table)?
- [ ] Composite indexes ordered by selectivity?
- [ ] Partial indexes used where appropriate?
- [ ] Large tables partitioned appropriately?
- [ ] Materialized views used for complex analytics?

### 3.5 Data Integrity & Consistency

#### ✅ Best Practices
```sql
-- ✅ Good - Comprehensive constraints
CREATE TABLE pipeline_pulse_core.opportunity (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL CHECK (LENGTH(TRIM(name)) > 0),
    
    -- Ensure amounts are consistent
    amount_local DECIMAL(15,2) NOT NULL CHECK (amount_local > 0),
    amount_sgd DECIMAL(15,2) NOT NULL CHECK (amount_sgd > 0),
    local_currency CHAR(3) NOT NULL CHECK (local_currency ~ '^[A-Z]{3}$'),
    
    -- Business rule: SGD amounts should be reasonable vs local
    CONSTRAINT chk_opportunity_sgd_conversion 
    CHECK (
        (local_currency = 'SGD' AND amount_sgd = amount_local) OR
        (local_currency != 'SGD' AND amount_sgd BETWEEN amount_local * 0.1 AND amount_local * 10)
    ),
    
    -- Phase progression rules
    o2r_phase INTEGER NOT NULL CHECK (o2r_phase BETWEEN 1 AND 4),
    
    -- Milestone dates must be logical
    proposal_date DATE,
    kickoff_date DATE,
    completion_date DATE,
    
    CONSTRAINT chk_opportunity_date_sequence 
    CHECK (
        (proposal_date IS NULL OR kickoff_date IS NULL OR proposal_date <= kickoff_date) AND
        (kickoff_date IS NULL OR completion_date IS NULL OR kickoff_date <= completion_date)
    ),
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by INTEGER NOT NULL REFERENCES pipeline_pulse_core.app_user(id),
    updated_by INTEGER NOT NULL REFERENCES pipeline_pulse_core.app_user(id),
    
    -- Ensure updated_at is not before created_at
    CONSTRAINT chk_opportunity_timestamps 
    CHECK (updated_at >= created_at)
);

-- ✅ Good - Trigger for automatic updated_at
CREATE OR REPLACE FUNCTION pipeline_pulse_core.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_opportunity_updated_at 
    BEFORE UPDATE ON pipeline_pulse_core.opportunity
    FOR EACH ROW 
    EXECUTE FUNCTION pipeline_pulse_core.update_updated_at_column();

-- ✅ Good - Referential integrity
ALTER TABLE pipeline_pulse_core.opportunity 
ADD CONSTRAINT fk_opportunity_territory 
FOREIGN KEY (territory_id) REFERENCES pipeline_pulse_core.territory(id)
ON DELETE RESTRICT;  -- Prevent deletion of territories with opportunities

-- ❌ Bad - Poor data integrity
CREATE TABLE bad_opportunity (
    id INT,  -- No PRIMARY KEY
    name VARCHAR(255),  -- No NOT NULL or CHECK
    amount DECIMAL(10,2),  -- No positive check
    phase INT,  -- No range validation
    territory_id INT,  -- No foreign key
    created_at TIMESTAMP  -- No default value
);
```

#### 🔍 Audit Questions
- [ ] All tables have PRIMARY KEY constraints?
- [ ] FOREIGN KEY constraints properly defined?
- [ ] CHECK constraints validate business rules?
- [ ] NOT NULL constraints on required fields?
- [ ] Triggers handle automatic field updates?
- [ ] Referential integrity enforced appropriately?

---

## 4. Cross-Cutting Compliance Checks

### 4.1 Security & Authentication

#### 🔍 Frontend Security Audit
- [ ] No hardcoded API keys or secrets in frontend code?
- [ ] Environment variables used for configuration?
- [ ] XSS protection via proper input sanitization?
- [ ] CSRF protection for form submissions?
- [ ] Secure token storage (httpOnly cookies or secure storage)?

#### 🔍 Backend Security Audit
- [ ] All API endpoints properly authenticated?
- [ ] Role-based access control implemented?
- [ ] Input validation on all endpoints?
- [ ] SQL injection prevention (no raw SQL)?
- [ ] Rate limiting implemented?
- [ ] CORS properly configured?

#### 🔍 Database Security Audit
- [ ] Database users follow principle of least privilege?
- [ ] No default passwords or weak authentication?
- [ ] Sensitive data encrypted at rest?
- [ ] Row Level Security enabled where needed?
- [ ] Audit logging for sensitive operations?

### 4.2 Documentation & Code Quality

#### 🔍 Documentation Audit
- [ ] All public APIs documented (OpenAPI/Swagger)?
- [ ] Complex business logic has inline comments?
- [ ] Database schema documented?
- [ ] Environment setup instructions clear?
- [ ] Deployment procedures documented?

#### 🔍 Code Quality Audit
- [ ] Consistent code formatting (Prettier, Black)?
- [ ] Linting rules enforced (ESLint, Ruff)?
- [ ] No unused imports or variables?
- [ ] Dead code removed?
- [ ] TODO comments tracked and addressed?

### 4.3 Performance & Monitoring

#### 🔍 Performance Audit
- [ ] Database queries optimized with proper indexes?
- [ ] N+1 query problems avoided?
- [ ] Proper caching strategy implemented?
- [ ] Large datasets paginated?
- [ ] Images and assets optimized?

#### 🔍 Monitoring Audit
- [ ] Application logs structured and searchable?
- [ ] Error tracking implemented (Sentry)?
- [ ] Performance monitoring in place?
- [ ] Health check endpoints available?
- [ ] Alerting configured for critical issues?

---

## 5. Automated Compliance Tools

### 5.1 Frontend Tools
```json
{
  "eslint": "Type safety, unused vars, best practices",
  "prettier": "Code formatting consistency",
  "@typescript-eslint/eslint-plugin": "TypeScript-specific rules",
  "eslint-plugin-react-hooks": "React hooks best practices",
  "husky": "Pre-commit hooks",
  "lint-staged": "Staged file linting",
  "vitest": "Unit testing",
  "@testing-library/react": "Component testing",
  "playwright": "E2E testing"
}
```

### 5.2 Backend Tools
```python
ruff = "Linting and formatting"
black = "Code formatting"
mypy = "Static type checking"
pytest = "Testing framework"
pytest-cov = "Code coverage"
bandit = "Security vulnerability scanning"
safety = "Dependency vulnerability checking"
pre-commit = "Git hooks for quality checks"
```

### 5.3 Database Tools
```sql
-- pgAdmin: Database management and query optimization
-- pg_stat_statements: Query performance monitoring
-- pg_stat_activity: Connection and activity monitoring
-- EXPLAIN ANALYZE: Query execution plan analysis
```

This comprehensive compliance audit checklist ensures that Pipeline Pulse follows industry best practices across all layers of the application stack, maintaining high code quality, security, and performance standards.