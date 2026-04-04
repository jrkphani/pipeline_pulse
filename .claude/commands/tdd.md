# /tdd — Test-Driven Development Workflow

Implements a feature using strict TDD: Red → Green → Refactor.

## Usage

```
/tdd <service or function to implement>
```

## Examples

```
/tdd OpportunityService.transfer_custodian method
/tdd useOpportunities React Query hook
/tdd formatSGD utility function
/tdd IAT qualification validator in OpportunityCreate schema
```

## TDD Protocol

### Step 1 — RED (write failing test)
Write the test first. Run it. Confirm it fails for the right reason.

```python
# Example: backend service test
async def test_transfer_custodian_creates_relay_leg(db, opportunity, new_custodian):
    service = OpportunityService()
    updated = await service.transfer_custodian(
        db, opportunity.id, new_custodian.id, reason="Handoff post-POC"
    )
    # These should FAIL before implementation
    assert updated.custodian_id == new_custodian.id
    relay_legs = await get_relay_legs(db, opportunity.id)
    assert len(relay_legs) == 2  # original + new
    assert relay_legs[-1].custodian_id == new_custodian.id
```

```typescript
// Example: frontend hook test
it('invalidates opportunities cache after update', async () => {
  const { result } = renderHook(() => useUpdateOpportunity(), { wrapper });
  await act(async () => {
    await result.current.mutateAsync({ id: 'opp-1', patch: { sgd_core: 200000 } });
  });
  // Should FAIL before implementation
  expect(queryClient.getQueryState(['opportunities'])?.isInvalidated).toBe(true);
});
```

### Step 2 — GREEN (minimal implementation)
Write the minimum code to make the test pass. No extras.

### Step 3 — REFACTOR (clean up)
- Extract repeated logic
- Improve naming
- Verify coverage still passes
- Run: `pytest tests/ -v --cov=app --cov-report=term-missing`
- Run: `npm run test -- --coverage`

## Coverage Check

After completing TDD cycle, verify coverage meets targets:
- Services: 80%+
- Hooks: 75%+
- Utilities: 90%+
