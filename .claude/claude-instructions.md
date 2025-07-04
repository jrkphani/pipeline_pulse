# Claude Code Instructions for Pipeline Pulse

## Project Overview
You are working on Pipeline Pulse, an enterprise-grade sales intelligence platform. This document provides specific instructions for implementing features correctly.

## Key Principles

### 1. Always Use Design Tokens
```typescript
// ❌ WRONG
<div style={{ padding: '24px', color: '#7c3aed' }}>

// ✅ CORRECT
<div style={{ padding: 'var(--pp-space-6)', color: 'var(--pp-color-primary-500)' }}>
```

### 2. TypeScript Strict Mode
```typescript
// ❌ WRONG
const handleData = (data: any) => { ... }

// ✅ CORRECT
const handleData = (data: OpportunityData) => { ... }
```

### 3. Error Handling Pattern
```typescript
// Frontend
try {
  const data = await apiClient.getOpportunities();
  setOpportunities(data);
} catch (error) {
  setError(error instanceof Error ? error : new Error('Failed to fetch'));
  showToast({ type: 'error', message: 'Unable to load opportunities' });
}

// Backend
try:
    opportunity = await opportunity_service.create(data)
    return OpportunityResponse.from_orm(opportunity)
except ValueError as e:
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    logger.error(f"Unexpected error: {e}")
    raise HTTPException(status_code=500, detail="Internal server error")
```

### 4. Component Structure
```typescript
// Always use this pattern for components
interface ComponentNameProps {
  // Properly typed props
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  prop1,
  prop2,
  ...props
}) => {
  // Component logic
  return (
    // JSX
  );
};
```

## Feature Implementation Guidelines

### Zoho CRM Sync Implementation
1. Use the Zoho SDK with proper OAuth initialization
2. Implement rate limiting with exponential backoff
3. Handle conflicts with the three-way merge strategy
4. Always validate data before syncing
5. Implement checkpoint recovery for interrupted syncs

### O2R Phase Tracking
1. Phases are 1-4 (not 0-3)
2. Health status calculation happens automatically on data change
3. Use the exact business rules for Green/Yellow/Red/Blocked
4. Implement phase transition validation
5. Track milestone dates for health calculation

### Currency Conversion
1. ALWAYS convert to SGD for display
2. Store both original and SGD amounts
3. Use Currency Freaks API with caching
4. Show staleness indicators after 7 days
5. Implement manual override for admins only

### Database Queries
1. Use SQLAlchemy ORM, never raw SQL
2. Implement repository pattern
3. Use async sessions
4. Add proper indexes for common queries
5. Enable Row Level Security where needed

## Common Patterns

### API Endpoint Pattern
```python
@router.get(
    "/{id}",
    response_model=OpportunityResponse,
    summary="Get opportunity by ID",
    dependencies=[Depends(get_current_user)]
)
async def get_opportunity(
    id: int,
    service: OpportunityService = Depends(get_opportunity_service)
) -> OpportunityResponse:
    return await service.get_by_id(id)
```

### React Query Pattern
```typescript
const useOpportunities = (filters?: OpportunityFilters) => {
  return useQuery({
    queryKey: ['opportunities', filters],
    queryFn: () => apiClient.getOpportunities(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

### State Management Pattern
```typescript
interface OpportunityStore {
  opportunities: Opportunity[];
  loading: boolean;
  error: Error | null;
  fetchOpportunities: () => Promise<void>;
  updateOpportunity: (id: string, data: Partial<Opportunity>) => Promise<void>;
}

const useOpportunityStore = create<OpportunityStore>((set, get) => ({
  opportunities: [],
  loading: false,
  error: null,
  fetchOpportunities: async () => {
    // Implementation
  },
  updateOpportunity: async (id, data) => {
    // Implementation
  },
}));
```

## Testing Requirements

### Frontend Tests
```typescript
describe('OpportunityCard', () => {
  it('should display health status correctly', () => {
    render(<OpportunityCard opportunity={mockOpportunity} />);
    expect(screen.getByText('On Track')).toHaveClass('pp-status--success');
  });
});
```

### Backend Tests
```python
@pytest.mark.asyncio
async def test_create_opportunity_with_currency_conversion():
    # Arrange
    opportunity_data = OpportunityCreate(
        name="Test Deal",
        amount_local=100000,
        local_currency="USD"
    )
    
    # Act
    result = await opportunity_service.create_opportunity(opportunity_data)
    
    # Assert
    assert result.amount_sgd == 135000  # Based on mocked rate
```

## File Organization

### Frontend
```
src/
├── components/
│   ├── opportunities/
│   │   ├── OpportunityCard.tsx
│   │   ├── OpportunityList.tsx
│   │   └── index.ts
│   └── common/
│       ├── MetricCard.tsx
│       └── StatusBadge.tsx
├── hooks/
│   ├── useOpportunities.ts
│   └── useSyncStatus.ts
├── services/
│   ├── api/
│   │   ├── opportunityApi.ts
│   │   └── syncApi.ts
│   └── utils/
│       └── currencyFormatter.ts
└── types/
    ├── opportunity.types.ts
    └── sync.types.ts
```

### Backend
```
app/
├── api/
│   └── v1/
│       └── endpoints/
│           ├── opportunities.py
│           └── sync.py
├── models/
│   └── opportunity.py
├── services/
│   ├── opportunity_service.py
│   └── sync_service.py
└── repositories/
    └── opportunity_repository.py
```

## Important Reminders

1. **NO HARDCODED VALUES** - Always use design tokens or configuration
2. **HANDLE ALL ERRORS** - Never let exceptions bubble up without handling
3. **TYPE EVERYTHING** - No `any` types in TypeScript, no untyped Python
4. **TEST YOUR CODE** - Write tests for all business logic
5. **FOLLOW THE PATTERNS** - Use established patterns from this guide
6. **SECURITY FIRST** - Validate inputs, sanitize outputs, check permissions
7. **PERFORMANCE MATTERS** - Consider pagination, caching, and query optimization

## When Implementing Features

1. Read the relevant section in the BRD/SRS first
2. Check the business logic document for rules
3. Follow the technical specifications
4. Use the design system consistently
5. Write tests alongside implementation
6. Handle edge cases and errors
7. Document complex logic

Remember: Pipeline Pulse is an enterprise application. Quality, security, and reliability are paramount.
