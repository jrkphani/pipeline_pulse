# /code-review — Pipeline Pulse Code Review

Invokes the **code-reviewer** agent to review staged or recent changes.

## Usage

```
/code-review                    # Review all staged changes
/code-review <file or path>     # Review specific file
/code-review --security         # Security-focused review (invokes security-reviewer)
/code-review --pre-merge        # Full pre-merge checklist
```

## What gets checked

### Domain Correctness
- Correct terminology (`opportunity`, `custodian`, `sgd_core`, `relay_leg`)
- IAT qualification logic integrity
- Temporal snapshot semantics

### Backend
- Async DB operations (AsyncSession throughout)
- Decimal/Numeric for monetary fields (no Float)
- Pydantic v2 patterns
- Proper HTTP status codes and error handling

### Frontend
- TypeScript strict compliance (no `any`)
- AG Grid Community Edition only
- SheetJS through `excel-export.ts` utility
- JWT in httpOnly cookies only
- React Query + Zustand patterns

### Tests
- New code has test coverage
- No skipped tests without TODO

### Security
- No secrets in code
- Auth on all endpoints
- Input validation present

## Output Format

```
[BLOCKER] path/to/file.ts:42
Issue: AG Grid Enterprise import detected
Fix: Replace with ag-grid-community import

[WARN] backend/app/services/opportunity.py:18  
Issue: Missing error handling for null custodian
Fix: Add None check before accessing custodian.id

[SUGGEST] frontend/src/hooks/useOpportunities.ts:35
Issue: staleTime could be configurable
Fix: Extract to constants file for easier tuning
```

**APPROVED** | **APPROVED WITH CHANGES** | **NEEDS REVISION**
