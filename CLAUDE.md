# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React + TypeScript + Vite)

```bash
cd frontend
npm install          # Install dependencies
npm run dev         # Start development server
npm run build       # Build for production (includes TypeScript compilation)
npm run lint        # Run ESLint
npm run preview     # Preview production build
```

### Backend (FastAPI + Python)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head        # Run database migrations
uvicorn app.main:app --reload  # Start development server
```

### Database & Services

```bash
# PostgreSQL (ensure running)
# Redis (ensure running)
redis-server

# Background tasks (optional)
cd backend
celery -A app.tasks worker --loglevel=info
```

### Testing & Code Quality

```bash
# Frontend
cd frontend
npm test            # Run tests (Vitest)
npx playwright test # Run e2e tests

# Backend
cd backend
pytest              # Run tests
pytest --cov       # Run tests with coverage
black .             # Format code
ruff .              # Lint code
mypy .              # Type checking
```

## Project Architecture

### High-Level Structure

Pipeline Pulse is an enterprise sales intelligence platform that transforms Zoho CRM data into actionable revenue insights. The application consists of:

- **Frontend**: React 19+ with TypeScript, using Vite for build tooling
- **Backend**: FastAPI with Python 3.11+, PostgreSQL database
- **Integration Layer**: Zoho CRM API synchronization with conflict resolution
- **Real-time Layer**: WebSocket connections for live data updates

### Core Business Logic

#### O2R (Opportunity-to-Revenue) Tracking

Four-phase opportunity lifecycle management:

1. **Opportunity**: Initial deal creation and qualification
2. **Qualified**: Validated opportunities meeting criteria
3. **Proposal**: Active proposal/negotiation phase
4. **Revenue**: Closed-won deals contributing to revenue

#### Health Monitoring System

Automated status tracking with four states:

- **Green**: Healthy, on-track opportunities
- **Yellow**: Requires attention, minor issues
- **Red**: Critical issues, immediate action needed
- **Blocked**: Cannot proceed, external dependencies

#### Currency Standardization
All financial data normalized to SGD using Currency Freaks API with real-time exchange rates.

### Key Technical Components

#### Frontend Stack

- **State Management**: Zustand for client state, TanStack React Query for server state
- **Routing**: TanStack React Router for type-safe navigation
- **UI Components**: shadcn/ui built on Radix UI primitives
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Currency**: Dinero.js for precise financial calculations

#### Backend Stack

- **Database**: PostgreSQL with SQLAlchemy 2.0+ (async)
- **Authentication**: JWT tokens with OAuth support
- **Background Tasks**: APScheduler for scheduled operations
- **WebSocket**: python-socketio for real-time communication
- **Monitoring**: Structured logging with OpenTelemetry, Prometheus metrics
- **External APIs**: httpx and aiohttp for async HTTP calls

#### Integration Architecture

- **Zoho CRM**: zcrmsdk for official API integration
- **Conflict Resolution**: Automated merge strategies with manual override
- **Sync Modes**: Full sync on startup, incremental sync every 15 minutes
- **Error Handling**: Comprehensive retry logic with exponential backoff

### Development Guidelines

#### Code Organization

- Follow existing patterns in the codebase
- Use TypeScript strictly on frontend
- Implement proper error boundaries and error handling
- All async operations should include proper error handling
- Use structured logging for backend operations

#### API Design

- RESTful endpoints for CRUD operations
- WebSocket endpoints for real-time updates
- Consistent error response formats
- API versioning strategy in place

#### Data Flow

1. Zoho CRM → Backend sync engine → PostgreSQL
2. Backend → WebSocket → Frontend for real-time updates
3. Frontend → REST API → Backend for user actions
4. Background tasks handle scheduled operations

### Environment Configuration

#### Required Environment Variables

- Database connection strings
- Zoho CRM API credentials
- Currency API keys
- AWS service credentials (Secrets Manager, CloudWatch)
- Authentication secrets

#### Development Setup

The project includes comprehensive setup instructions in README.md and expects:

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+

### Documentation References

- `/docs/requirements/`: Complete business and technical specifications
- `/docs/requirements/BRD.md`: Business requirements and use cases
- `/docs/requirements/SRS.md`: Detailed functional requirements
- `/docs/requirements/tech-stack.md`: Complete technical stack specifications
- `/docs/requirements/frontend-guide.md`: Frontend development standards

## Guidelines and Best Practices

- **Mock Data Policy**: 
  - Never invent mock data or mock APIs or placeholder functions or classes.