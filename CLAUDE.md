# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pipeline Pulse is an Opportunity-to-Revenue (O2R) tracker for 1CloudHub that integrates with Zoho CRM. It provides real-time pipeline analytics, multi-currency support, and comprehensive reporting capabilities.

## Architecture

### Backend (FastAPI + Python)
- **Framework**: FastAPI with uvicorn
- **Database**: PostgreSQL (production) / SQLite (local development)
- **ORM**: SQLAlchemy with Alembic migrations
- **Main Integration**: Zoho CRM SDK v8
- **Entry Point**: `backend/main.py`

### Frontend (React + TypeScript)
- **Framework**: React 18 with Vite
- **State Management**: Zustand with persistent storage
- **UI**: Tailwind CSS + shadcn/ui components
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation

## Development Commands

### Backend
```bash
cd backend
pip install -r requirements.txt
python main.py  # Runs on http://localhost:8000

# Database migrations
alembic upgrade head  # Apply migrations
alembic revision -m "Description"  # Create new migration

# Run tests
pytest
```

### Frontend
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
npm run build  # Production build
npm run lint  # Run ESLint
npm run test  # Run Playwright tests
```

## Key Implementation Details

### Authentication & Security
- **User Auth**: Direct Access Mode (no authentication required)
- **CRM Auth**: Zoho OAuth2 with token management
- **Secrets**: All stored in AWS Secrets Manager
- **JWT**: HS256 algorithm, 30-minute expiration

### Database Schema
Key tables:
- `deals`: Synced from Zoho CRM
- `crm_record`: OAuth tokens and connection status
- `token_management`: JWT session tokens
- `sync_logs`: Data synchronization history

### State Management (Frontend)
Uses Zustand with slices:
- `useAppStore`: Main application state (deals, filters, search)
- `useUIStore`: UI state (navigation, modals, themes)
- `useAuthStore`: Authentication state

### API Endpoints
- `/api/v1/crm/*`: CRM integration endpoints
- `/api/v1/sync/*`: Data synchronization
- `/api/v1/deals/*`: Deal management
- `/api/v1/analytics/*`: Analytics and reporting

### Environment Variables
Required in `.env`:
```
DATABASE_URL=postgresql://...
JWT_SECRET_KEY=...
ZOHO_CLIENT_ID=...
ZOHO_CLIENT_SECRET=...
AWS_REGION=us-east-1
```

## Important Conventions

### Code Style
- **Python**: Follow PEP 8, use type hints
- **TypeScript**: Strict mode enabled, use interfaces over types
- **Components**: Functional components with hooks
- **API Calls**: Use the centralized `api.ts` service

### Error Handling
- Backend: Use FastAPI's HTTPException
- Frontend: Handle errors in React Query mutations/queries
- Always log errors with appropriate context

### Testing
- Frontend: Playwright for E2E tests
- Backend: Pytest with fixtures
- Test files adjacent to source files

### Zoho CRM Integration
- **Always use SDK v8** - Never use direct API calls
- Token refresh handled automatically by `improved_zoho_token_store.py`
- Rate limiting: 150 requests/minute
- Bulk operations preferred over individual requests

### Currency Handling
- All amounts stored in USD in database
- Conversion happens at display time
- Use `currencyService.ts` for all conversions
- Exchange rates cached for 24 hours

## Common Tasks

### Adding a New API Endpoint
1. Create endpoint in `backend/app/api/endpoints/`
2. Add to router in `backend/app/api/routes.py`
3. Create corresponding service in `backend/app/services/`
4. Add frontend API call in `frontend/src/services/api.ts`

### Adding a New Component
1. Create in `frontend/src/components/`
2. Use shadcn/ui components where possible
3. Add to page in `frontend/src/pages/`
4. Update navigation if needed in `frontend/src/data/navigation.data.ts`

### Modifying Database Schema
1. Update model in `backend/app/models/`
2. Create migration: `alembic revision -m "description"`
3. Review and edit migration file
4. Apply: `alembic upgrade head`

### Debugging Zoho OAuth Issues
1. Check `backend/docs/OAUTH_TROUBLESHOOTING_GUIDE.md`
2. Verify tokens in `token_management` table
3. Check Zoho API console for app status
4. Review logs for specific error codes

## Deployment

- **Frontend**: AWS S3 + CloudFront
- **Backend**: AWS ECS Fargate
- **Database**: AWS RDS PostgreSQL
- **Secrets**: AWS Secrets Manager
- **CI/CD**: GitHub Actions

Always ensure:
- Environment-specific configs are correct
- Database migrations are applied
- Secrets are properly configured
- Health checks are passing