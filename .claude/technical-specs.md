# Pipeline Pulse Technical Specifications

## Frontend Architecture

### Technology Stack
```typescript
{
  "core": {
    "framework": "React 18.3+",
    "language": "TypeScript 5.3+",
    "build": "Vite 5.0+",
    "state": "Zustand 4.5+",
    "router": "@tanstack/react-router"
  },
  "ui": {
    "components": "shadcn/ui",
    "styling": "Tailwind CSS 3.4+",
    "icons": "lucide-react",
    "charts": "recharts 2.10+"
  },
  "data": {
    "api": "@tanstack/react-query 5.0+",
    "realtime": "SSE + WebSocket",
    "validation": "zod"
  }
}
```

### Design Token System
```css
/* Spacing */
--pp-space-1: 0.25rem;   /* 4px */
--pp-space-2: 0.5rem;    /* 8px */
--pp-space-3: 0.75rem;   /* 12px */
--pp-space-4: 1rem;      /* 16px */
--pp-space-6: 1.5rem;    /* 24px */
--pp-space-8: 2rem;      /* 32px */

/* Colors */
--pp-color-primary-500: oklch(0.606 0.25 292.717);
--pp-color-success-500: oklch(0.6 0.2 142);
--pp-color-warning-500: oklch(0.828 0.189 84.429);
--pp-color-danger-500: oklch(0.577 0.245 27.325);
--pp-color-neutral-500: oklch(0.552 0.016 285.938);

/* Typography */
--pp-font-size-xs: 0.75rem;
--pp-font-size-sm: 0.875rem;
--pp-font-size-md: 1rem;
--pp-font-size-lg: 1.125rem;
--pp-font-size-xl: 1.25rem;
--pp-font-size-2xl: 1.5rem;
```

### Component Naming Standards
- Components: `PascalCase` (e.g., `MetricCard.tsx`)
- Hooks: `camelCase` with `use` prefix (e.g., `useOpportunityData.ts`)
- Utilities: `camelCase` (e.g., `formatCurrency.ts`)
- Types: `PascalCase` with suffix (e.g., `OpportunityType.ts`)

## Backend Architecture

### Technology Stack
```python
{
  "core": {
    "framework": "FastAPI 0.109+",
    "language": "Python 3.11+",
    "async": "asyncio + httpx"
  },
  "database": {
    "primary": "PostgreSQL 15+",
    "orm": "SQLAlchemy 2.0+ (async)",
    "migrations": "Alembic",
    "cache": "Redis 7+"
  },
  "integrations": {
    "zoho": "zohocrm-python-sdk-8.0",
    "currency": "Currency Freaks API",
    "aws": "boto3"
  }
}
```

### API Endpoint Standards
```python
# Pattern: /api/v1/{resource}/{action}
POST   /api/v1/sync/full              # Trigger full sync
POST   /api/v1/sync/incremental       # Trigger incremental sync
GET    /api/v1/sync/health            # Get sync health status
GET    /api/v1/sync/stream/{id}       # SSE sync progress

GET    /api/v1/opportunities          # List opportunities
GET    /api/v1/opportunities/{id}     # Get single opportunity
POST   /api/v1/opportunities          # Create opportunity
PUT    /api/v1/opportunities/{id}     # Update opportunity
DELETE /api/v1/opportunities/{id}     # Delete opportunity

GET    /api/v1/o2r/dashboard          # O2R dashboard data
GET    /api/v1/o2r/attention-required # Critical opportunities
POST   /api/v1/o2r/calculate-health   # Calculate health status

POST   /api/v1/finance/convert        # Currency conversion
GET    /api/v1/finance/rates          # Exchange rates
```

### Error Response Format
```json
{
  "error": "Validation Error",
  "message": "Detailed error message",
  "code": "ERR_VALIDATION_001",
  "details": {
    "field": "amount",
    "reason": "Must be positive"
  },
  "request_id": "uuid-v4",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Database Schema

### Naming Conventions
- Schemas: `pipeline_pulse_core`, `pipeline_pulse_analytics`, `pipeline_pulse_audit`
- Tables: Singular, snake_case (e.g., `opportunity`, `sync_session`)
- Columns: Descriptive snake_case (e.g., `amount_sgd`, `health_status`)
- Indexes: `idx_table_column(s)` (e.g., `idx_opportunity_health_status`)
- Constraints: `chk_table_condition`, `fk_table_reference`

### Core Tables
```sql
-- Opportunities
CREATE TABLE pipeline_pulse_core.opportunity (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    amount_local DECIMAL(15,2) NOT NULL,
    amount_sgd DECIMAL(15,2) NOT NULL,
    local_currency CHAR(3) NOT NULL,
    health_status opportunity_health_status NOT NULL,
    o2r_phase INTEGER NOT NULL CHECK (o2r_phase BETWEEN 1 AND 4),
    -- Additional fields...
);

-- Sync sessions
CREATE TABLE pipeline_pulse_core.sync_session (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL UNIQUE,
    sync_type VARCHAR(20) NOT NULL,
    status sync_status NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    -- Additional fields...
);
```

## Integration Specifications

### Zoho CRM Integration
- API Version: v4/v6
- Authentication: OAuth 2.0
- Rate Limit: 1000 calls/hour
- Batch Size: 200 records
- Sync Interval: 15 minutes (configurable)

### Currency Freaks API
- Endpoint: https://api.currencyfreaks.com/v2.0
- Update Schedule: Weekly (Monday 00:00 UTC)
- Supported Currencies: 150+
- Cache Duration: 90 days
- Fallback: Last known rates

## Security Requirements

### Authentication & Authorization
- JWT tokens with 8-hour expiration
- Role-based access control (RBAC)
- API rate limiting per user
- Session management with Redis

### Data Protection
- Encryption at rest (AES-256)
- TLS 1.3 for data in transit
- PII field encryption
- Audit logging for all changes

## Performance Requirements

### Response Times
- API endpoints: <200ms (95th percentile)
- Dashboard load: <3 seconds
- Search results: <2 seconds
- Report generation: <30 seconds

### Scalability
- Support 100+ concurrent users
- Handle 1M+ opportunity records
- Process 50,000 record syncs
- 99.9% uptime SLA

## Development Workflow

### Git Branch Strategy
```bash
main
├── develop
│   ├── feature/sync-engine
│   ├── feature/o2r-tracking
│   └── feature/currency-service
├── release/v1.0.0
└── hotfix/critical-fix
```

### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)

# Types: feat, fix, docs, style, refactor, test, chore
# Example: feat(sync): implement incremental sync with conflict detection
```

### Code Review Checklist
- [ ] TypeScript strict mode compliance
- [ ] Pydantic validation on all endpoints
- [ ] Design tokens used (no hardcoded values)
- [ ] Error handling implemented
- [ ] Tests written (>80% coverage)
- [ ] Documentation updated
- [ ] Security considerations addressed
- [ ] Performance impact assessed
