# Pipeline Pulse — Claude Code Configuration
> System of Action for B2B SaaS Sales Operations | 1CloudHub
> Stack: FastAPI + PostgreSQL + React 18 + AG Grid Community + Tailwind 3.4 + Vite 5 + Zustand 4.5

---

## Project Identity

**What this is:** A standalone CRM replacement purpose-built for 1CloudHub's B2B SaaS sales motion.
Not a Zoho extension. Not a generic CRM. A System of Action.

**Domain language — always use these terms:**
- `opportunity` not `deal` (matches backend model)
- `custodian` not `owner` (relay race concept — ownership is temporal)
- `IAT` = Is it Achievable + Targeted (qualification framework, not a config flag)
- `SGD_core` = pipeline value in Singapore Dollars (primary currency unit)
- `temporal_snapshot` = point-in-time pipeline state (never "history record")
- `relay_leg` = one custodian's ownership window
- `white_space` = uncaptured revenue potential in an account

---

## Documentation Map

> **Read the relevant doc(s) before starting any feature.** These are the authoritative references for design, architecture, and business rules. Always prefer these over general knowledge.

| When you are working on… | Read this doc first |
|---|---|
| Any frontend feature | `docs/tech-stack-v2.md` + `docs/implementation-guide-v2.md` |
| Visual design, colours, badges, layout | `docs/brand-style-guide-v3.md` |
| AG Grid, SheetJS, Recharts patterns | `docs/implementation-guide-v2.md` |
| Pre-commit or PR review | `docs/compliance-checklist-v2.md` |
| Any screen or route (what it should look like) | `docs/wireframe-decisions-v2.md` (WF1–WF4) |
| Any Admin or Reports route | `docs/wireframe-decisions-wf5-17.md` (WF5–WF17) |
| Business rules, RBAC, stakeholders, notifications | `docs/brd-v6-1-summary.md` |
| FR requirements, NFRs, data model, AI agents | `docs/srs-v4-0-summary.md` |
| Design philosophy, prohibited patterns, feature list | `docs/design-brief-v2.md` |

### Document Index

```
docs/
├── tech-stack-v2.md              # Stack, packages, env vars, integration code patterns
├── brand-style-guide-v3.md       # Color system, typography, z-index, component CSS, admin patterns
├── implementation-guide-v2.md    # Design tokens, Tailwind config, AG Grid code, SheetJS, Recharts, API client
├── compliance-checklist-v2.md    # Audit checklists: naming, types, AG Grid, auth, DB, forbidden patterns
├── wireframe-decisions-v2.md     # Global shell, Command Palette, WF1 Pipeline, WF2 Deal Detail,
│                                 #   WF3 Dashboard, WF4 Demand Gen — all UX decisions locked
├── wireframe-decisions-wf5-17.md # WF5–9 Reports, WF10–16 Admin, WF17 Command Palette,
│                                 #   full 33-route registry
├── design-brief-v2.md            # Spreadsheet-first mandate, prohibited UI patterns, feature list,
│                                 #   design brief template per feature
├── brd-v6-1-summary.md           # Stakeholders (9 roles), RBAC matrix, dashboard widgets,
│                                 #   notification matrix, AI agent business rules, 5-phase migration
└── srs-v4-0-summary.md           # FR section table, NFRs, data model fields, API endpoints,
                                  #   AI agent technical specs, external integrations
```

### Key Design Decisions (quick reference — full detail in docs)

| Decision | Ruling |
|---|---|
| Modals for deal editing | ❌ NEVER — always Side Panel (480px) |
| Kanban / card view | ❌ NEVER — removed from v1.0 scope entirely |
| Pagination in grid | ❌ NEVER — virtual scroll only |
| AG Grid Enterprise | ❌ NEVER — Community Edition only |
| SheetJS inline in component | ❌ NEVER — always `src/lib/excel-export.ts` |
| localStorage for JWT | ❌ NEVER — httpOnly cookies only |
| Health status as floating badge | ❌ NEVER — cell background tints only |
| Workbook tab bar position | Bottom of screen (Excel model) |
| Side Panel width | 480px |
| AI Insights Panel width | 380px (distinct from Side Panel) |
| Command Palette trigger | ⌘K / Ctrl+K — centred overlay 640px |
| SGD_core column | Always pinned left, never unpinnable |
| Charts location | Analytics tabs and Dashboard ONLY — never Pipeline grid |
| Primary font | Inter |
| Primary purple | `oklch(0.606 0.25 292.717)` |

---

## Repository Layout

```
pipeline-pulse/
├── docs/                     # ← All design, UX, and spec documents (read before building)
│   ├── tech-stack-v2.md
│   ├── brand-style-guide-v3.md
│   ├── implementation-guide-v2.md
│   ├── compliance-checklist-v2.md
│   ├── wireframe-decisions-v2.md
│   ├── wireframe-decisions-wf5-17.md
│   ├── design-brief-v2.md
│   ├── brd-v6-1-summary.md
│   └── srs-v4-0-summary.md
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── models/           # 13 SQLAlchemy models (source of truth)
│   │   ├── schemas/          # Pydantic v2 schemas
│   │   ├── api/              # Route handlers
│   │   ├── services/         # Business logic
│   │   └── core/             # Config, DB, auth
│   ├── alembic/              # Single migration (clean state)
│   └── tests/
└── frontend/                 # Vite + React app
    ├── src/
    │   ├── components/
    │   │   ├── grid/          # AG Grid wrappers (PipelineGrid, etc.)
    │   │   ├── layout/        # AppShell, Sidebar, TopBar
    │   │   └── ui/            # shadcn/ui re-exports
    │   ├── stores/            # Zustand stores
    │   ├── hooks/             # React Query hooks
    │   ├── pages/             # Route pages
    │   └── lib/               # Utilities (api-client.ts, excel-export.ts)
    └── tests/
```

---

## Critical Constraints (Non-Negotiable)

### AG Grid
- **Community Edition ONLY** — never add Enterprise imports or features
- Use `@ag-grid-community/react` + `ag-grid-community` packages only
- No `@ag-grid-enterprise/*` anywhere
- Row data flows through React Query → Zustand → AG Grid `rowData` prop

### Data Grid Rules
- Inline editing via AG Grid cell editors — never open a modal for single-cell edits
- `SGD_core` column always visible and pinned left (FR-GRID-006)
- Virtual row rendering enabled by default — never disable for "performance testing"
- All column filters use AG Grid's built-in `agTextColumnFilter` / `agNumberColumnFilter`
- Health status expressed as **cell background tints** via `cellClassRules` — never floating badges

### SheetJS (xlsx)
- MIT CE only — `xlsx` package, never `xlsx-pro` or `exceljs`
- All `.xlsx` exports go through `src/lib/excel-export.ts` utility
- Never write SheetJS calls inline in components

### Backend Models
- 13 models are final — do not add new models without explicit instruction
- Single Alembic migration — always `alembic upgrade head`, never create additional migrations without instruction
- All monetary values stored as `Numeric(15,2)` — never `Float`
- `opportunity.sgd_core` is the canonical pipeline value field

### Auth
- JWT tokens — access (15min) + refresh (7 days)
- Token refresh handled in `src/lib/api-client.ts` interceptor
- Never store tokens in localStorage — httpOnly cookies only

---

## Build Commands

```bash
# Backend
cd backend
python -m uvicorn app.main:app --reload           # Dev server
alembic upgrade head                               # Run migration
pytest tests/ -v                                   # Run tests
ruff check app/ && ruff format app/               # Lint + format

# Frontend
cd frontend
npm run dev                                        # Dev server (Vite 5)
npm run build                                      # Production build
npm run typecheck                                  # tsc --noEmit
npm run lint                                       # ESLint
npm run test                                       # Vitest
npm run test:e2e                                   # Playwright
```

---

## Code Standards

### TypeScript
- Strict mode enabled — no `any`, no `@ts-ignore` without comment
- Use Zod schemas for all API response validation
- React components: functional only, no class components
- Props interfaces defined in same file as component (co-location)
- Exports: named exports for utilities, default export for pages/components

### Python
- Python 3.11+ — use `match` statements where appropriate
- All DB calls via `async def` with `AsyncSession`
- Pydantic v2 — use `model_validator` not deprecated v1 validators
- No raw SQL — SQLAlchemy ORM exclusively
- Services return domain objects, never raw DB rows

### Tailwind
- v3.4 — no v4 syntax
- Use `cn()` from `src/lib/utils.ts` (clsx + tailwind-merge) for conditional classes
- Avoid `style={{}}` props — always prefer Tailwind utilities
- shadcn/ui components are the base — extend, don't rewrite

---

## Testing Requirements

- **Coverage target:** 80% for services layer, 60% for API routes
- **TDD for all services:** Write test first, then implement
- **No skipped tests** without `// TODO:` comment explaining why
- **Vitest** for frontend unit tests
- **Playwright** for E2E — test the grid interactions (inline edit, filter, sort)

---

## Git Workflow

- Branch naming: `feat/pp-{ticket}-short-description` | `fix/pp-{ticket}-description`
- Commit format: `feat(grid): add inline SGD_core editing with validation`
- Scope must be one of: `grid`, `auth`, `opportunities`, `contacts`, `accounts`, `temporal`, `relay`, `iat`, `exports`, `layout`, `api`, `models`, `config`
- Never commit: `.env`, API keys, `node_modules`, `__pycache__`, `.alembic` temp files
- PR template enforced — always include what changed, why, and how tested

---

## Agent Delegation Rules

Delegate to subagents when:
- Task exceeds 200 lines of new code
- Feature touches both backend AND frontend
- Security review needed on auth/token changes
- E2E tests need writing for new grid interactions
- Dead code cleanup after feature removal

Always use **planner** agent first for any feature that touches:
- Opportunity model
- Temporal snapshot logic
- Relay race / custodianship changes
- IAT qualification logic
- SGD currency calculations

---

## Performance Budget

- **Frontend initial bundle:** < 500KB gzipped
- **AG Grid init:** < 100ms for 1,000 rows
- **API p95 latency:** < 200ms for list endpoints
- **Export:** < 3s for 5,000-row XLSX export (SheetJS streaming)
- **Dashboard load:** < 2s for all roles
- **Orchestrator routing:** < 200ms
- **Context window:** Keep active agents < 80 tools, < 10 MCPs enabled

---

## Forbidden Patterns

```typescript
// NEVER — localStorage for auth
localStorage.setItem('token', jwt)

// NEVER — AG Grid Enterprise
import { LicenseManager } from '@ag-grid-enterprise/core'

// NEVER — inline SheetJS
import XLSX from 'xlsx'; // in a component file

// NEVER — any type without justification
const data: any = await fetch(...)

// NEVER — Float for money
amount: Float  // use: Numeric(15,2)

// NEVER — new Alembic migration without instruction
alembic revision --autogenerate -m "..."

// NEVER — modal for deal editing
<Dialog><OpportunityForm /></Dialog>  // use: <SidePanel>

// NEVER — health as badge component in grid cell
<StatusBadge status={health} />  // use: cellClassRules with pp-cell-health-* classes

// NEVER — pagination
pagination: true  // in AG Grid options — use virtual scroll

// NEVER — hardcoded colour values in components
style={{ color: '#7c3aed' }}  // use: var(--pp-color-primary-500)
```

```python
# NEVER — sync DB in async context
def get_opportunities(db: Session):  # must be AsyncSession

# NEVER — raw SQL
db.execute("SELECT * FROM opportunities")

# NEVER — Float for monetary fields
sgd_core: float  # use: Decimal
```

---

## MCP Servers (Active)

Keep under 10 active at once. Disable unused with `disabledMcpServers`.

Recommended active for this project:
- `filesystem` — file operations
- `github` — PR/issue management
- `postgresql` — direct DB queries during development
