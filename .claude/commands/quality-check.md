# Quality Check Command

Run comprehensive quality validation for Pipeline Pulse code

## 🔍 Code Quality Analysis

### Backend Quality Checks

```bash
cd backend

# Type checking (if mypy is available)
python -m mypy app/ --ignore-missing-imports

# Code formatting check
python -m black app/ --check --diff

# Import sorting
python -m isort app/ --check-only --diff

# Security audit
pip-audit

# Test coverage
python -m pytest --cov=app --cov-report=html --cov-report=term

# Linting with flake8 (if available)
python -m flake8 app/ --max-line-length=88 --extend-ignore=E203,W503
```

### Frontend Quality Checks

```bash
cd frontend

# TypeScript type checking
npm run build  # This includes tsc --noEmit

# ESLint validation
npm run lint

# Prettier formatting check
npx prettier --check src/

# Bundle analysis
npm run build && npx vite-bundle-analyzer dist/

# Check for unused dependencies
npx depcheck

# Security audit
npm audit
```

## 🧪 Testing Suite

### Backend Testing

```bash
cd backend

# Unit tests with verbose output
python -m pytest -v

# Specific test categories
python -m pytest -v -k "test_zoho"      # Zoho integration tests
python -m pytest -v -k "test_o2r"       # O2R tracker tests
python -m pytest -v -k "test_api"       # API endpoint tests

# Async tests
python -m pytest --asyncio-mode=auto

# Performance tests
python -m pytest -v -k "performance" --durations=10
```

### Frontend Testing

```bash
cd frontend

# E2E tests
npm test                              # All Playwright tests
npm run test:quick                    # Quick verification
npx playwright test --headed          # With browser UI
npx playwright test --debug           # Debug mode

# Component tests (if available)
npm run test:unit

# Accessibility tests
npx playwright test tests/accessibility.spec.js
```

## 🔒 Security Validation

### Backend Security

```bash
cd backend

# Dependency vulnerabilities
pip-audit --requirement requirements.txt

# Security linting
bandit -r app/ -f json -o security-report.json

# Environment variables validation
python -c "
import os
from dotenv import load_dotenv
load_dotenv()
required_vars = ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'CURRENCYFREAKS_API_KEY']
missing = [var for var in required_vars if not os.getenv(var)]
if missing:
    print(f'Missing environment variables: {missing}')
else:
    print('All required environment variables present')
"
```

### Frontend Security

```bash
cd frontend

# Audit npm packages
npm audit --audit-level=moderate

# Check for exposed secrets
git secrets --scan || echo "Install git-secrets for secret scanning"

# Bundle security analysis
npm run build && npx webpack-bundle-analyzer dist/assets/*.js
```

## 📊 Performance Analysis

### Backend Performance

```bash
cd backend

# Database query analysis
python -c "
from app.core.database import get_db
from sqlalchemy import event
from sqlalchemy.engine import Engine
import time

@event.listens_for(Engine, 'before_cursor_execute')
def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    context._query_start_time = time.time()

@event.listens_for(Engine, 'after_cursor_execute')  
def receive_after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total = time.time() - context._query_start_time
    if total > 0.1:  # Log slow queries
        print(f'Slow query ({total:.3f}s): {statement[:100]}...')
"

# Memory usage profiling
python -m pytest -v --profile
```

### Frontend Performance

```bash
cd frontend

# Build size analysis
npm run build
ls -lah dist/assets/

# Performance budget check
npx bundlesize

# Lighthouse CI (if configured)
npx lhci autorun
```

## 📋 Compliance Checks

### Code Style Compliance

- **Backend**: Black formatting, isort imports, flake8 linting
- **Frontend**: Prettier formatting, ESLint rules, TypeScript strict mode
- **API**: OpenAPI schema validation
- **Database**: Migration consistency check

### Business Logic Validation

```bash
# O2R phase progression validation
python -c "
from app.services.o2r_service import O2RService
from app.core.database import get_db
import asyncio

async def validate_o2r_logic():
    db = next(get_db())
    service = O2RService(db)
    
    # Test phase progression logic
    test_cases = [
        {'phase': 'proposal', 'date': '2024-01-01'},
        {'phase': 'commitment', 'date': '2024-01-15'},
        {'phase': 'execution', 'date': '2024-02-01'},
        {'phase': 'revenue', 'date': '2024-03-01'}
    ]
    
    for case in test_cases:
        result = await service.validate_phase_progression(case)
        print(f'Phase {case[\"phase\"]}: {\"PASS\" if result else \"FAIL\"}')

asyncio.run(validate_o2r_logic())
"
```

## 🚨 Critical Issue Detection

### High-Priority Issues

- SQL injection vulnerabilities in database queries
- Hardcoded credentials or API keys
- Missing error handling in critical paths
- Unsecured API endpoints
- Memory leaks in long-running processes

### Medium-Priority Issues

- Unused imports and variables
- Inconsistent code formatting
- Missing type annotations
- Deprecated dependency usage
- Inefficient database queries

### Quality Gates

- **Code Coverage**: Must be > 80% for critical business logic
- **TypeScript**: Zero type errors allowed
- **Security**: No high/critical vulnerabilities
- **Performance**: API response time < 500ms for 95th percentile
- **Bundle Size**: Frontend bundle < 2MB compressed

## 📊 Report Generation

Generate comprehensive quality report:

```bash
# Create quality report
echo "# Pipeline Pulse Quality Report - $(date)" > quality-report.md
echo "" >> quality-report.md

# Backend metrics
cd backend
echo "## Backend Quality Metrics" >> ../quality-report.md
python -m pytest --cov=app --cov-report=term | tail -5 >> ../quality-report.md

# Frontend metrics  
cd ../frontend
echo "## Frontend Quality Metrics" >> ../quality-report.md
npm run build 2>&1 | grep -E "(error|warning)" >> ../quality-report.md || echo "No build issues" >> ../quality-report.md

# Security summary
echo "## Security Summary" >> ../quality-report.md
npm audit --json | jq '.metadata.vulnerabilities' >> ../quality-report.md

echo "Quality report generated: quality-report.md"
```

## ✅ Success Criteria

**All checks must pass:**

- [ ] Backend code formatting compliant
- [ ] Frontend TypeScript compilation successful
- [ ] All unit tests passing
- [ ] E2E tests passing
- [ ] Security audit clean (no critical vulnerabilities)
- [ ] Performance benchmarks within acceptable limits
- [ ] API documentation up to date
- [ ] Database migrations valid

**Quality Metrics:**

- Code coverage > 80% for business logic
- Zero TypeScript errors
- ESLint warnings < 5
- Bundle size within performance budget
- API response times < 500ms

Usage: `/quality-check [component]` where component is `backend`, `frontend`, `security`, or `all`
