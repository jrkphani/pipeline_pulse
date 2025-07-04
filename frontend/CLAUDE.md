# Frontend CLAUDE.md

This file provides guidance specific to the frontend development of Pipeline Pulse.

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production (includes TypeScript compilation)
npm run build

# Run linting
npm run lint

# Preview production build
npm run preview

# Run tests
npm test

# Run end-to-end tests
npx playwright test
```

## Compliance Requirements

### 1. File & Component Naming Conventions

**Components**: Use PascalCase with descriptive names
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
```

**Hooks**: Use camelCase starting with "use"
```typescript
// ✅ Good
useOpportunityData.ts
useSyncStatus.ts
useCurrencyConversion.ts

// ❌ Bad
OpportunityData.ts
sync-status.ts
```

**Utilities & Services**: Use camelCase with descriptive purpose
```typescript
// ✅ Good
apiClient.ts
formatCurrency.ts
dateHelpers.ts

// ❌ Bad
utils.ts
helpers.ts
```

### 2. Type Safety & TypeScript Compliance

- **No `any` type usage** (except justified cases with comments)
- **All props interfaces properly defined**
- **Union types for limited value sets**
- **Generic types used appropriately**
- **Strict TypeScript configuration enabled**

Example of proper typing:
```typescript
interface OpportunityCardProps {
  opportunity: Opportunity;
  healthStatus: HealthStatus;
  onEdit?: (id: string) => void;
  showActions?: boolean;
}

type HealthStatus = 'success' | 'warning' | 'danger' | 'neutral';
```

### 3. Component Reusability & Architecture

- **Components accept props for customization**
- **No hard-coded text or values in components**
- **Consistent prop interfaces across similar components**
- **Use composition patterns**
- **Extend shadcn/ui base components, don't replace them**

Example:
```typescript
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
```

### 4. Error Boundaries & Error Handling

- **Error boundaries implemented at appropriate levels**
- **All async operations have error handling**
- **Error states displayed to users with recovery options**
- **Errors logged to monitoring service**
- **No unhandled promise rejections**

Example:
```typescript
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
```

### 5. Environment Variables & Configuration

- **All environment variables prefixed with `VITE_`**
- **Environment configuration centralized and typed**
- **Environment variables validated on app startup**
- **No hard-coded URLs or configuration values**
- **Default values provided for non-critical env vars**

Configuration structure in `src/lib/config.ts`:
```typescript
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
```

## Architecture Guidelines

### State Management
- **Zustand for client state**: Simple, lightweight state management
- **TanStack React Query for server state**: Caching, synchronization, background updates
- **No prop drilling**: Use context or state management for deeply nested props

### Routing
- **TanStack React Router**: Type-safe routing with automatic route generation
- **Route-based code splitting**: Lazy load page components
- **Nested layouts**: Use layout components for consistent UI structure

### UI Components
- **shadcn/ui components**: Consistent, accessible component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework
- **Design tokens**: Use CSS custom properties for consistent theming

### Data Fetching
- **API Client**: Centralized HTTP client with error handling and authentication
- **React Query**: Server state management with caching and background sync
- **WebSocket**: Real-time updates for sync progress and live data

## Business Logic Integration

### O2R (Opportunity-to-Revenue) Tracking
Components should handle the four-phase lifecycle:
1. **Opportunity**: Initial deal creation and qualification
2. **Qualified**: Validated opportunities meeting criteria  
3. **Proposal**: Active proposal/negotiation phase
4. **Revenue**: Closed-won deals contributing to revenue

### Health Monitoring System
Support four health states with appropriate UI indicators:
- **Green**: Healthy, on-track opportunities
- **Yellow**: Requires attention, minor issues
- **Red**: Critical issues, immediate action needed
- **Blocked**: Cannot proceed, external dependencies

### Currency Handling
- **Use Dinero.js** for precise financial calculations
- **Format currencies consistently** using utility functions
- **Display both local and SGD amounts** where relevant
- **Handle currency conversion edge cases**

## Security Best Practices

- **No hardcoded API keys or secrets** in frontend code
- **Environment variables for configuration**
- **XSS protection via proper input sanitization**
- **CSRF protection for form submissions**
- **Secure token storage** (consider httpOnly cookies)

## Testing Strategy

- **Vitest**: Unit testing for utilities and hooks
- **React Testing Library**: Component testing focused on user behavior
- **Playwright**: End-to-end testing for critical user flows
- **Mock external dependencies**: API calls, WebSocket connections

## Code Quality Tools

- **ESLint**: Linting with TypeScript and React rules
- **Prettier**: Code formatting consistency
- **Husky**: Pre-commit hooks for quality checks
- **lint-staged**: Run linting only on changed files

## Performance Considerations

- **Lazy loading**: Route-based and component-based code splitting
- **Memoization**: Use React.memo, useMemo, useCallback appropriately
- **Virtual scrolling**: For large data sets (opportunities list)
- **Image optimization**: Proper sizing and formats
- **Bundle analysis**: Monitor bundle size and dependencies

## Monitoring & Analytics

- **Error tracking**: Sentry for production error monitoring
- **Performance monitoring**: Core Web Vitals tracking
- **User analytics**: Track feature usage and conversion funnels
- **Real-time metrics**: Dashboard for application health