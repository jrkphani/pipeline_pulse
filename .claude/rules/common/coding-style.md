# Coding Style — Pipeline Pulse

## Core Principles

**Immutability first.** Never mutate state directly. Zustand uses Immer — use draft syntax inside `set()`.

**Small, focused files.** 500-line hard limit. If a file grows beyond 400 lines, split it.

**Co-location.** Types live next to the code that uses them. Don't create `types/` mega-folders.

**Explicit over implicit.** No magic string literals — use typed enums or const maps for opportunity stages, user roles, etc.

## File Organisation

```
src/
├── components/
│   ├── grid/
│   │   ├── PipelineGrid.tsx         # Main grid component (< 300 lines)
│   │   ├── PipelineGrid.types.ts    # Grid-specific types
│   │   ├── column-defs.ts           # All ColDef definitions
│   │   ├── cell-editors/            # Custom cell editors
│   │   └── cell-renderers/          # Custom renderers
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   └── TopBar.tsx
│   └── ui/                          # shadcn re-exports only
├── stores/
│   ├── opportunity.store.ts
│   ├── ui.store.ts
│   └── auth.store.ts
├── hooks/
│   ├── useOpportunities.ts
│   ├── useOpportunity.ts
│   └── useAuth.ts
└── lib/
    ├── api-client.ts                # Axios instance + interceptors
    ├── excel-export.ts              # ALL SheetJS logic lives here
    ├── format.ts                    # Currency, date formatters
    └── utils.ts                     # cn() and misc utilities
```

## Naming Conventions

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` with `use` prefix
- Stores: `camelCase.store.ts`
- Types/Interfaces: PascalCase, no `I` prefix
- Constants: `SCREAMING_SNAKE_CASE`
- Files: kebab-case for non-component files

## TypeScript Standards

```typescript
// Use explicit return types on exported functions
export function formatSGD(amount: Decimal): string { ... }

// Prefer interface for object shapes
interface Opportunity {
  id: string;
  sgd_core: number;
  stage: OpportunityStage;
  custodian_id: string;
}

// Use discriminated unions for state
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// Const assertions for enums
const OPPORTUNITY_STAGES = ['prospect', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] as const;
type OpportunityStage = typeof OPPORTUNITY_STAGES[number];
```

## Python Standards

```python
# Use dataclasses for value objects
@dataclass(frozen=True)
class SGDAmount:
    value: Decimal
    currency: str = "SGD"

# Type hints everywhere
async def get_opportunity(
    opportunity_id: UUID,
    db: AsyncSession,
) -> Opportunity | None:
    ...

# Pydantic v2 validators
class OpportunityCreate(BaseModel):
    sgd_core: Decimal = Field(gt=0, decimal_places=2)

    @model_validator(mode='after')
    def validate_iat(self) -> 'OpportunityCreate':
        ...
```
