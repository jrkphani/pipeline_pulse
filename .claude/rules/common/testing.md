# Testing Rules — Pipeline Pulse

## TDD Mandate

All backend services follow TDD:
1. **RED** — Write a failing test that describes the behaviour
2. **GREEN** — Write minimal code to pass the test
3. **REFACTOR** — Clean up without breaking tests

Frontend business logic (stores, hooks, utilities) also uses TDD.
Components use React Testing Library for integration-style tests.

## Coverage Requirements

| Layer | Target | Tool |
|-------|--------|------|
| Services (Python) | 80% | pytest-cov |
| API Routes | 60% | pytest |
| React Hooks | 75% | Vitest |
| Zustand Stores | 75% | Vitest |
| Utilities | 90% | Vitest |
| Components | Integration tests | RTL |
| Grid Interactions | E2E | Playwright |

## Backend Test Patterns

```python
# Always use async test client
@pytest.mark.asyncio
async def test_create_opportunity_validates_sgd_core(
    async_client: AsyncClient,
    auth_headers: dict,
):
    response = await async_client.post(
        "/api/v1/opportunities",
        json={"sgd_core": -100, "name": "Test Deal"},
        headers=auth_headers,
    )
    assert response.status_code == 422

# Service tests use in-memory DB
async def test_opportunity_service_sets_custodian(
    db: AsyncSession,
):
    service = OpportunityService(db)
    opp = await service.create(OpportunityCreate(...))
    assert opp.custodian_id is not None
```

## Frontend Test Patterns

```typescript
// Zustand store tests
import { renderHook, act } from '@testing-library/react';
import { useOpportunityStore } from '@/stores/opportunity.store';

it('updates sgd_core optimistically', () => {
  const { result } = renderHook(() => useOpportunityStore());
  act(() => result.current.updateSGDCore('opp-1', 150000));
  expect(result.current.opportunities[0].sgd_core).toBe(150000);
});

// Hook tests with React Query
it('fetches opportunities on mount', async () => {
  server.use(rest.get('/api/v1/opportunities', handler));
  const { result } = renderHook(() => useOpportunities(), { wrapper });
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(10);
});
```

## No Skipped Tests Rule

No `test.skip()` or `xit()` without a TODO comment:
```typescript
// OK
test.skip('inline edit with concurrent user — TODO: implement locking first', ...);

// NOT OK
test.skip('some test', ...);
```

## Test File Naming

- Unit tests: `*.test.ts` / `*.test.tsx`
- Integration: `*.integration.test.ts`
- E2E: `*.spec.ts` (Playwright convention)
- Test files co-located with source: `opportunity.service.test.py` next to `opportunity.service.py`
