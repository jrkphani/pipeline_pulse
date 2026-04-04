# /e2e — Generate and Run E2E Tests

Invokes the **e2e-runner** agent to write or run Playwright E2E tests.

## Usage

```
/e2e generate <feature>     # Write new E2E tests for a feature
/e2e run                    # Run all E2E tests
/e2e run <spec file>        # Run specific spec
/e2e debug <spec file>      # Run with Playwright inspector
```

## Examples

```
/e2e generate pipeline grid inline editing for sgd_core
/e2e generate auth flow — login, token refresh, logout
/e2e generate XLSX export with filtered rows
/e2e generate keyboard navigation Tab/Enter/Arrow in grid
/e2e run pipeline-grid.spec.ts
```

## Test Scenarios by Feature

### Pipeline Grid (always test these)
- [ ] Grid renders with opportunity rows
- [ ] Double-click cell enters edit mode
- [ ] Tab moves to next editable cell
- [ ] Enter confirms edit and saves
- [ ] Escape cancels edit, reverts value
- [ ] Column filter filters rows
- [ ] Multi-row selection with Shift+Click
- [ ] SGD core column always visible (pinned left)

### Auth Flow
- [ ] Unauthenticated access → redirect to /auth/login
- [ ] Login with valid credentials → redirect to /pipeline
- [ ] Token refresh happens transparently (background)
- [ ] Logout clears session and redirects

### XLSX Export
- [ ] Export button triggers file download
- [ ] Downloaded file is valid .xlsx
- [ ] File contains correct headers and data

## Run Commands

```bash
# All E2E tests
npx playwright test

# Specific spec
npx playwright test tests/pipeline-grid.spec.ts

# With UI (visual inspector)
npx playwright test --ui

# Debug mode
npx playwright test --debug tests/auth.spec.ts

# Headed (see the browser)
npx playwright test --headed
```
