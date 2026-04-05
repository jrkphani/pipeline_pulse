# Pipeline Pulse — Compliance Audit Checklist
> **v2.0** | Aligned to BRD v6.1 / SRS v4.2 / Tech Stack v2.0 | April 2026

---

## 1. Frontend Compliance

### 1.1 File & Component Naming

```typescript
// ✅ Components: PascalCase
PipelineGrid.tsx
DealSidePanel.tsx
ExtractionProgressBar.tsx
MetricCard.tsx
O2RPhaseIndicator.tsx
WorkbookTabs.tsx

// ✅ Hooks: camelCase, "use" prefix
useDealData.ts
useExtractionProgress.ts
useCurrencyConversion.ts
useGridSelection.ts

// ✅ Utilities: camelCase, descriptive
apiClient.ts
formatCurrency.ts
exportOpportunitiesToXlsx.ts  // ← in src/lib/excel-export.ts only
dateHelpers.ts

// ❌ Never
pipeline.tsx, deal.tsx, utils.ts, helpers.ts
```

**Audit checklist:**
- [ ] All component files use PascalCase?
- [ ] Hook files start with "use" prefix?
- [ ] No generic names like "utils" or "helpers"?
- [ ] SheetJS export functions in `src/lib/excel-export.ts` only?
- [ ] AG Grid wrappers in `src/components/grid/` — not inline in pages?

---

### 1.2 Type Safety & TypeScript

```typescript
// ✅ Strict typing
interface OpportunityRowProps {
  opportunity: Opportunity;
  healthStatus: HealthStatus;
  onEditCell?: (field: string, value: unknown) => void;
  readOnly?: boolean;
}

// ✅ Union types for controlled values
type HealthStatus = 'success' | 'warning' | 'danger' | 'neutral';
type SalesStage = 'New Hunt' | 'Discovery' | 'Proposal' | 'Negotiation' | 'Order Book';
type FundingType = 'Customer' | 'AWS' | 'Dual';
type GTMMotion = 'SAP' | 'VMware' | 'GenAI' | 'Data' | 'AMS';

// ✅ Generic response types
interface ApiResponse<T> { data: T; status: number; message: string; }

// ❌ Never — any without justification
const data: any = await fetch(...)  // use: const data: Opportunity[] = ...
```

**Audit checklist:**
- [ ] `strict: true` in tsconfig — no overrides?
- [ ] No `any` type without `// justification:` comment?
- [ ] All props interfaces defined in same file as component?
- [ ] Union types for stages, health status, funding types?
- [ ] Zod schemas for all API response validation?

---

### 1.3 Design Token Compliance

```typescript
// ✅ Always use design tokens
style={{ padding: 'var(--pp-space-6)', borderRadius: 'var(--pp-radius-lg)' }}
className="text-pp-primary-500"

// ❌ Never hardcode
style={{ padding: '24px', color: '#7c3aed', borderRadius: '8px' }}

// ✅ AG Grid theme uses --ag-* variables mapped to PP tokens
// ❌ Never hardcode values in AG Grid theme overrides
```

**Audit checklist:**
- [ ] All spacing uses `var(--pp-space-*)`?
- [ ] All colours use semantic tokens `var(--pp-color-*)`?
- [ ] All typography uses `var(--pp-font-*)`?
- [ ] AG Grid theme uses `--ag-*` variables, not hardcoded values?
- [ ] No `style={{ color: '#hex' }}` inline?

---

### 1.4 AG Grid Compliance (Critical)

```typescript
// ✅ Community Edition only
import { AgGridReact } from '@ag-grid-community/react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';

// ❌ Never — Enterprise
import { LicenseManager } from '@ag-grid-enterprise/core';
import { RowGroupingModule } from '@ag-grid-enterprise/row-grouping';

// ✅ Health as cellClassRules — never StatusBadge inside cells
const healthColDef: ColDef = {
  cellClassRules: {
    'pp-cell-health-green': (p) => p.value === 'On Track',
    'pp-cell-health-amber': (p) => p.value === 'Watch',
    'pp-cell-health-red':   (p) => p.value === 'Critical',
  }
};

// ✅ SGD_core always pinned left
const sgdCoreColDef: ColDef = {
  field: 'sgd_core',
  pinned: 'left',
  lockPinned: true,  // User cannot unpin
};

// ✅ Virtual scroll — pagination PROHIBITED
rowModelType: 'clientSide'  // Never: pagination: true
```

**Audit checklist:**
- [ ] No `@ag-grid-enterprise/*` imports anywhere in the codebase?
- [ ] `SGD_core` column always pinned left and not removable?
- [ ] Virtual scroll enabled — no pagination component?
- [ ] Status bar configured: row count + selection count + aggregation?
- [ ] Health status via `cellClassRules` — never badge components inside cells?
- [ ] Keyboard navigation tested: Tab/Enter/Arrow/Ctrl+Home/End/Ctrl+F?
- [ ] All column filters use `agTextColumnFilter` / `agNumberColumnFilter`?

---

### 1.5 SheetJS Compliance

```typescript
// ✅ Only in src/lib/excel-export.ts
import * as XLSX from 'xlsx';

// ❌ Never inline in components
// ❌ Never: import XLSX from 'xlsx' (in a component file)
// ❌ Never: xlsx-pro, exceljs
```

**Audit checklist:**
- [ ] Zero SheetJS imports outside `src/lib/excel-export.ts`?
- [ ] Using `xlsx` package (MIT CE) — not `xlsx-pro` or `exceljs`?
- [ ] Velocity report uses 3 separate sheets per SheetJS export?

---

### 1.6 Auth & Security

```typescript
// ✅ JWT in httpOnly cookies
fetch('/api/v1/resource', { credentials: 'include' })

// ❌ Never — localStorage for tokens
localStorage.setItem('token', jwt)
localStorage.getItem('access_token')
sessionStorage.setItem('token', jwt)

// ✅ Token refresh handled in src/lib/api-client.ts interceptor
// ✅ All API calls use credentials: 'include'
```

**Audit checklist:**
- [ ] Zero `localStorage.setItem` for token storage?
- [ ] Zero `sessionStorage` for token storage?
- [ ] All fetch calls include `credentials: 'include'`?
- [ ] Token refresh handled centrally in `api-client.ts`?
- [ ] No hardcoded API keys or secrets in frontend code?
- [ ] XSS protection via proper input sanitisation in AG Grid cell editors?

---

### 1.7 Component Architecture

```typescript
// ✅ Side panel for all edit operations
<SidePanel open={isOpen} onClose={handleClose} title="Edit Opportunity">
  <OpportunityForm />
</SidePanel>

// ❌ Never — modal dialog for deal editing
<Dialog open={isOpen}>
  <DialogContent>
    <OpportunityForm />
  </DialogContent>
</Dialog>

// ✅ Composition over monolithic components
const MetricCard = ({ title, value, trend }: MetricCardProps) => (
  <Card className="pp-metric-card">...</Card>
);

// ❌ Never — Kanban / card views for deal data
// ❌ Never — multi-step wizard for deal creation (use grid inline entry)
// ❌ Never — full-page modal for create/edit
// ❌ Never — pagination (use virtual scroll)
```

**Audit checklist:**
- [ ] All deal/contact edit operations use Side Panel (480px)?
- [ ] No Dialog/Modal for data editing (only for auth and confirmation)?
- [ ] No Kanban view — grid only?
- [ ] No pagination — virtual scroll only?
- [ ] `cn()` from `src/lib/utils.ts` used for conditional Tailwind classes?
- [ ] shadcn/ui base components extended, not rewritten?

---

### 1.8 Error Handling

```typescript
// ✅ Error boundaries wrapping grid sections
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    errorReportingService.report(error, info);
  }
}

// ✅ Async error handling with proper state
const { data, error, isLoading } = useQuery({...});
if (error) return <GridErrorState error={error} />;
if (isLoading) return <GridSkeleton />;
```

**Audit checklist:**
- [ ] Error boundaries wrapping major sections (grid, side panel, charts)?
- [ ] Loading states: AG Grid skeleton rows, not full-page spinners?
- [ ] Empty states: grid shows "+ Add Opportunity" CTA with context?
- [ ] API errors surface as toasts, not console.error only?

---

## 2. Backend Compliance

### 2.1 Python Conventions

```python
# ✅ Async DB sessions — always
async def get_opportunities(db: AsyncSession) -> list[Opportunity]:
    result = await db.execute(select(Opportunity).where(Opportunity.archive_flag == False))
    return result.scalars().all()

# ❌ Never — sync session in async context
def get_opportunities(db: Session):

# ✅ SQLAlchemy ORM — no raw SQL
stmt = select(Opportunity).where(Opportunity.stage == stage)

# ❌ Never — raw SQL
db.execute("SELECT * FROM opportunities WHERE stage = :stage", {"stage": stage})

# ✅ Decimal for monetary values
from decimal import Decimal
sgd_core: Decimal  # maps to Numeric(15,2)

# ❌ Never — Float for monetary fields
sgd_core: float
```

**Audit checklist:**
- [ ] All DB functions use `AsyncSession`?
- [ ] No raw SQL — SQLAlchemy ORM only?
- [ ] All monetary fields typed as `Decimal` in Python?
- [ ] Pydantic v2 — `model_validator` not deprecated v1 validators?
- [ ] `match` statements used where appropriate (Python 3.11+)?

---

### 2.2 API Design

```python
# ✅ Pydantic v2 for all request/response validation
class OpportunityUpdate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    stage: SalesStage | None = None
    sgd_core: Decimal | None = None  # Numeric(15,2)

# ✅ Dependency injection for auth
@router.patch("/{id}")
async def update_opportunity(
    id: UUID,
    payload: OpportunityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

# ✅ Structured error responses
raise HTTPException(status_code=422, detail={"field": "sgd_core", "error": "Must be positive"})
```

**Audit checklist:**
- [ ] All endpoints have Pydantic v2 request/response models?
- [ ] All endpoints protected by `Depends(get_current_user)`?
- [ ] RBAC enforced: role checked for each resource action?
- [ ] Rate limiting configured on auth endpoints?
- [ ] CORS restricted to known origins?

---

### 2.3 Database Compliance

```sql
-- ✅ Decimal for monetary values
sgd_core    NUMERIC(15, 2) NOT NULL
deal_value  NUMERIC(15, 2) NOT NULL

-- ❌ Never
sgd_core    FLOAT          -- loses precision on large SGD values

-- ✅ Strategic indexes (partial on archive_flag = FALSE)
CREATE INDEX idx_opportunity_health_stage
ON opportunity(stage_health, sales_stage, updated_at DESC)
WHERE archive_flag = FALSE;

-- ✅ Full-text search for grid Ctrl+F
CREATE INDEX idx_opportunity_account_search
ON opportunity USING gin(to_tsvector('english', account_name || ' ' || opportunity_name));

-- ✅ Row Level Security
ALTER TABLE opportunity ENABLE ROW LEVEL SECURITY;
CREATE POLICY opp_team_policy ON opportunity
USING (
  created_by = current_setting('app.current_user_id')::UUID
  OR current_setting('app.user_role') IN ('admin', 'sales_leadership', 'presales_manager', 'cro')
);

-- ✅ Audit trigger
CREATE TRIGGER tr_opportunity_updated_at
  BEFORE UPDATE ON opportunity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Audit checklist:**
- [ ] All monetary columns: `NUMERIC(15,2)` — no `FLOAT` or `REAL`?
- [ ] Single Alembic migration — no additional migrations without instruction?
- [ ] 13 models are final — no new models without explicit instruction?
- [ ] All timestamps: `TIMESTAMP WITH TIME ZONE`?
- [ ] Partial indexes on `WHERE archive_flag = FALSE` for all active queries?
- [ ] Full-text search index on `account_name + opportunity_name`?
- [ ] Row Level Security enabled on `opportunity` table?
- [ ] Audit triggers on all core tables?
- [ ] No raw SQL — SQLAlchemy ORM only?

---

## 3. Cross-Cutting Checks

### 3.1 Security Audit
- [ ] No hardcoded API keys or secrets anywhere (use AWS Secrets Manager in prod)?
- [ ] `.env` files not committed (in .gitignore)?
- [ ] JWT tokens in httpOnly cookies — zero localStorage usage?
- [ ] SQL injection prevented (ORM only)?
- [ ] XSS prevention in AG Grid cell editors?
- [ ] RLS enforced at DB level for all deal queries?

### 3.2 Performance Audit
- [ ] AG Grid virtual scroll — no pagination anywhere?
- [ ] `SGD_core` column always pinned left?
- [ ] React Query stale time configured (≥30s for pipeline data)?
- [ ] React.memo on all chart components?
- [ ] SheetJS streaming for >5,000 row exports?
- [ ] Redis caching for FX rates and reference data?
- [ ] Celery queue configured for DocAI ingestion bursts?
- [ ] N+1 queries avoided via SQLAlchemy eager loading?

### 3.3 Performance Budget
| Metric | Target |
|---|---|
| Frontend initial bundle | < 500KB gzipped |
| AG Grid init (1,000 rows) | < 100ms |
| API p95 latency (list endpoints) | < 200ms |
| XLSX export (5,000 rows) | < 3s |
| Dashboard load | < 2s |

### 3.4 Monitoring Audit
- [ ] structlog configured for structured logging?
- [ ] Sentry SDK active for error tracking?
- [ ] OpenTelemetry + prometheus-client for APM?
- [ ] `/health` endpoint available on backend?
- [ ] CloudWatch log groups for `ap-southeast-1`?
- [ ] Alerting on DocAI queue depth and extraction failure rate?

### 3.5 Code Quality
- [ ] Prettier + ESLint enforced (frontend)?
- [ ] Ruff + Black + Mypy enforced (backend)?
- [ ] Pre-commit hooks configured?
- [ ] No unused imports or dead code?
- [ ] No Zoho remnants (`zoho`, `crm_sync`, `sync_session`)?
- [ ] All TODOs tracked with ticket reference?

---

## 4. Forbidden Patterns Reference

```typescript
// Frontend NEVER list
localStorage.setItem('token', jwt)                    // Auth token in localStorage
import { LicenseManager } from '@ag-grid-enterprise'  // AG Grid Enterprise
import XLSX from 'xlsx'  // in a component file        // SheetJS inline
const data: any = await fetch(...)                    // any without justification
style={{ color: '#7c3aed' }}                          // Hardcoded colour value
<Dialog>...deal edit form...</Dialog>                 // Modal for deal editing
pagination: true  // in AG Grid options                // Pagination instead of virtual scroll
```

```python
# Backend NEVER list
def get_opportunities(db: Session):          # Sync session in async context
db.execute("SELECT * FROM opportunities")   # Raw SQL
sgd_core: float                             # Float for monetary fields
alembic revision --autogenerate             # New migration without instruction
```

---

## 5. Automated Tools

**Frontend**: ESLint · Prettier · TypeScript strict · Vitest · Playwright  
**Backend**: Ruff · Black · Mypy · pytest · pytest-asyncio · bandit · safety  
**Database**: pg_stat_statements · EXPLAIN ANALYZE · Alembic  
**Pre-commit**: husky + lint-staged (frontend) · pre-commit (backend)

---

*Pipeline Pulse Compliance Checklist v2.0 | April 2026*
