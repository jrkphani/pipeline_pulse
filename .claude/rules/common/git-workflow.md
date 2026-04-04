# Git Workflow — Pipeline Pulse

## Branch Naming

```
feat/pp-{ticket}-short-description     # New feature
fix/pp-{ticket}-short-description      # Bug fix
refactor/pp-{ticket}-short-description # Code cleanup
chore/pp-{ticket}-short-description    # Build, deps, config
docs/pp-{ticket}-short-description     # Documentation only
```

Examples:
```
feat/pp-042-pipeline-grid-inline-edit
fix/pp-091-sgd-core-decimal-precision
refactor/pp-103-split-opportunity-service
```

---

## Commit Format

```
{type}({scope}): {short description}

[optional body]

[optional footer: refs #ticket]
```

### Types
`feat` | `fix` | `refactor` | `test` | `chore` | `docs` | `perf` | `style`

### Scopes (mandatory)
`grid` | `auth` | `opportunities` | `contacts` | `accounts` | `temporal` | `relay` | `iat` | `exports` | `layout` | `api` | `models` | `config` | `deps`

### Examples
```
feat(grid): add inline sgd_core editing with decimal validation

fix(auth): handle token refresh race condition in api-client

refactor(opportunities): extract relay leg logic into RelayService

test(grid): add playwright e2e for keyboard navigation in pipeline grid

chore(deps): upgrade ag-grid-community to 32.x
```

---

## What Never Gets Committed

```gitignore
.env
.env.local
.env.production
*.pem
*.key
__pycache__/
.alembic/       # temp migration files
node_modules/
dist/
.vite/
```

---

## PR Process

1. Branch from `main`
2. Implement + tests
3. Run full checks: `npm run typecheck && npm run lint && npm run test`
4. Run backend checks: `ruff check app/ && pytest tests/ -v`
5. Create PR with template:
   - **What changed** — 2-3 sentences
   - **Why** — business reason or ticket ref
   - **How tested** — unit tests added, E2E scenarios covered
   - **Screenshot/recording** — for any UI change
6. Code review by at least one other person (or code-reviewer agent)
7. Squash merge to `main` with clean commit message

---

## Never Force Push Main

`git push --force main` is forbidden.
Use `--force-with-lease` on feature branches only.
