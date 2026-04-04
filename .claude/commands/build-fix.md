# /build-fix — Fix Build and Type Errors

Invokes the **build-error-resolver** agent to diagnose and fix build failures.

## Usage

```
/build-fix                      # Fix whatever is currently failing
/build-fix typecheck            # Fix TypeScript type errors only
/build-fix lint                 # Fix ESLint errors
/build-fix vite                 # Fix Vite build errors
/build-fix backend              # Fix Python/ruff/pytest errors
```

## Protocol

1. Run the failing command and capture full output
2. Identify root cause (type error, missing import, AG Grid generic, etc.)
3. Read the affected file before editing
4. Make minimal targeted fix
5. Re-run the command to verify fix
6. Cascade check: run `npm run typecheck` after any `.ts`/`.tsx` edit

## Common Pipeline Pulse Build Errors

### AG Grid Generic Type Errors
```
Type 'ColDef[]' is not assignable to type 'ColDef<Opportunity>[]'
```
Fix: Parameterise all AG Grid types with `<Opportunity>`

### Zustand Selector Type Loss
```
Property 'opportunities' does not exist on type '{}'
```
Fix: Explicit state type on selector: `useStore((s: OpportunityState) => s.opportunities)`

### React Query v5 Breaking Changes
```
Property 'onSuccess' does not exist on type 'UseQueryOptions'
```
Fix: Move `onSuccess` logic to `useEffect` watching `data`

### Vite Environment Variable
```
Property 'VITE_API_URL' does not exist on type 'ImportMetaEnv'
```
Fix: Add declaration to `src/vite-env.d.ts`

### Decimal Import (Python)
```
NameError: name 'Decimal' is not defined
```
Fix: `from decimal import Decimal`
