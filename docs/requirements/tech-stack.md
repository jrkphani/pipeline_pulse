## Pipeline Pulse Complete Tech Stack

### Frontend Stack

```json
{
  "core": {
    "framework": "React 19.1+ with TypeScript 5.8+",
    "build": "Vite 6.1+",
    "state": "Zustand 5.0+"
  },
  "ui": {
    "styling": "Tailwind CSS 4.1+ with @tailwindcss/vite plugin",
    "components": "shadcn/ui (latest)",
    "icons": "lucide-react",
    "charts": "recharts 3.0+ (shadcn/ui charts)"
  },
  "routing": {
    "router": "@tanstack/react-router",
    "navigation": "react-router-dom (if preferring traditional)"
  },
  "data": {
    "api": "@tanstack/react-query 5.81+",
    "websocket": "socket.io-client",
    "sse": "native EventSource API"
  },
  "forms": {
    "validation": "react-hook-form + zod",
    "tables": "@tanstack/react-table 8.21+"
  },
  "utilities": {
    "dates": "date-fns",
    "currency": "dinero.js",
    "classnames": "clsx + tailwind-merge",
    "csv": "papaparse",
    "pdf": "@react-pdf/renderer"
  },
  "dev": {
    "linting": "ESLint + Prettier",
    "testing": "Vitest + React Testing Library",
    "e2e": "Playwright"
  }
}
```

### Backend Stack

```json
{
  "core": {
    "framework": "FastAPI 0.109.0",
    "python": "3.13+ (3.13.5 verified)",
    "async": "asyncio + httpx"
  },
  "database": {
    "primary": "PostgreSQL 15+",
    "orm": "SQLAlchemy 2.0.35+ (async)",
    "migrations": "Alembic 1.13.1",
    "driver": "psycopg[binary] 3.2.9 (Python 3.13 compatible)"
  },
  "authentication": {
    "jwt": "python-jose[cryptography]",
    "oauth": "authlib (for Zoho OAuth)",
    "permissions": "casbin or custom RBAC",
    "session_management": "fastapi-sessions (with database persistence)"
  },
  "integrations": {
    "zoho": "zcrmsdk 3.1.0",
    "currency": "httpx 0.26.0 for Currency Freaks API",
    "aws": "boto3 1.34.0 (for Secrets Manager)"
  },
  "async": {
    "websocket": "python-socketio 5.11.0"
  },
  "monitoring": {
    "logging": "structlog 24.1.0",
    "metrics": "prometheus-client 0.19.0",
    "tracing": "OpenTelemetry 1.22.0",
    "errors": "Sentry SDK 1.40.0"
  },
  "utilities": {
    "validation": "Pydantic 2.8.2+ (pydantic-settings 2.4.0 for config)",
    "currency": "py-moneyed 3.0 + babel 2.14.0",
    "testing": "pytest 7.4.0 + pytest-asyncio 0.23.0",
    "api-docs": "FastAPI built-in + ReDoc",
    "email": "email-validator 2.2.0"
  }
}
```

### Infrastructure & DevOps

```json
{
  "containerization": {
    "runtime": "Docker",
    "orchestration": "Docker Compose (dev), K8s (prod)"
  },
  "cloud": {
    "provider": "AWS",
    "services": [
      "ECS/EKS (container hosting)",
      "RDS (PostgreSQL)",
      "Secrets Manager",
      "CloudWatch",
      "S3 (exports/backups)",
      "ALB (load balancing)"
    ]
  },
  "cicd": {
    "pipeline": "GitHub Actions or GitLab CI",
    "deployment": "ArgoCD or AWS CodeDeploy"
  },
  "monitoring": {
    "apm": "New Relic or DataDog",
    "logs": "CloudWatch + ELK Stack",
    "uptime": "Pingdom or UptimeRobot"
  }
}
```

### Detailed Package Requirements

#### Frontend `package.json` dependencies:

```json
{
  "dependencies": {
    "@hookform/resolvers": "^5.1.1",
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "@react-pdf/renderer": "^4.3.0",
    "@tanstack/react-query": "^5.81.5",
    "@tanstack/react-router": "^1.124.0",
    "@tanstack/react-table": "^8.21.3",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "dinero.js": "^1.9.1",
    "lucide-react": "^0.525.0",
    "papaparse": "^5.5.3",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-hook-form": "^7.59.0",
    "recharts": "^3.0.2",
    "socket.io-client": "^4.8.1",
    "tailwind-merge": "^3.3.1",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.25.73",
    "zustand": "^5.0.6"
  },
  "devDependencies": {
    "@eslint/js": "^9.29.0",
    "@playwright/test": "^1.53.2",
    "@tailwindcss/vite": "^4.1.11",
    "@testing-library/react": "^16.3.0",
    "@types/dinero.js": "^1.9.4",
    "@types/node": "^24.0.10",
    "@types/papaparse": "^5.3.16",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@typescript-eslint/eslint-plugin": "^8.35.1",
    "@typescript-eslint/parser": "^8.35.1",
    "@vitejs/plugin-react": "^4.6.0",
    "eslint": "^9.30.1",
    "eslint-config-prettier": "^10.1.5",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^16.2.0",
    "prettier": "^3.6.2",
    "tailwindcss": "^4.1.11",
    "typescript": "~5.8.3",
    "typescript-eslint": "^8.34.1",
    "vite": "^6.1.6",
    "vitest": "^3.2.4"
  }
}
```

#### Backend `requirements.txt` (Python 3.13 Verified):

```txt
# Core Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# Database
# Updated SQLAlchemy for Python 3.13 compatibility
sqlalchemy[asyncio]==2.0.35
# Note: asyncpg currently doesn't support Python 3.13
# Using psycopg3 as alternative for Python 3.13 compatibility
psycopg[binary]==3.2.9
alembic==1.13.1

# Authentication & Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
authlib==1.3.0
casbin==1.23.0

# Zoho Integration
zcrmsdk==3.1.0
httpx==0.26.0
aiohttp==3.9.1

# Currency & Financial
py-moneyed==3.0
babel==2.14.0

# Async Processing
apscheduler==3.10.4

# WebSocket
python-socketio==5.11.0

# AWS
boto3==1.34.0

# Monitoring & Logging
structlog==24.1.0
prometheus-client==0.19.0
opentelemetry-api==1.22.0
opentelemetry-sdk==1.22.0
opentelemetry-instrumentation-fastapi==0.43b0
sentry-sdk==1.40.0

# Utilities
# Updated to pydantic 2.8.0+ for Python 3.13 support
pydantic==2.8.2
pydantic-settings==2.4.0
email-validator==2.2.0
python-dotenv==1.0.0
pendulum==3.0.0

# Testing
pytest==7.4.0
pytest-asyncio==0.23.0
pytest-cov==4.1.0
faker==22.0.0

# Development
black==23.12.0
ruff==0.1.0
mypy==1.8.0
pre-commit==3.6.0
```

### Environment Configuration

`.env` file structure:

```bash
# Application
APP_NAME=Pipeline Pulse
APP_ENV=development
DEBUG=true
API_V1_PREFIX=/api/v1

# Database
DATABASE_URL=postgresql+psycopg://user:pass@localhost:5432/pipeline_pulse

# Session Management
SESSION_SECRET_KEY=your_long_random_session_secret_key # Generate a strong, random key
SESSION_COOKIE_NAME=pipeline_pulse_session
SESSION_COOKIE_DOMAIN=localhost # Change for production
SESSION_COOKIE_SECURE=False # True for HTTPS in production
SESSION_COOKIE_HTTPONLY=True
SESSION_COOKIE_SAMESITE=Lax # Strict, Lax, None

# Zoho CRM
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REDIRECT_URI=http://localhost:8000/auth/zoho/callback
ZOHO_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_API_DOMAIN=https://www.zohoapis.com
ZOHO_REGION=US

# Currency Settings
BASE_CURRENCY=SGD
CURRENCY_API_KEY=fdd7d81e5f0d434393a5a0cca6053423
CURRENCY_API_URL=https://api.currencyfreaks.com/v2.0
CURRENCY_CACHE_DAYS=7
CURRENCY_UPDATE_SCHEDULE="0 0 * * MON"  # Weekly on Monday

# Security
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# AWS
AWS_REGION=ap-southeast-1
AWS_SECRETS_MANAGER_SECRET_NAME=pipeline-pulse/prod

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=INFO

# Sync Settings
SYNC_INTERVAL_MINUTES=15
SYNC_BATCH_SIZE=5000
SYNC_MAX_RETRIES=3
API_RATE_LIMIT_PER_HOUR=1000

# Frontend
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_APP_VERSION=1.0.0
```

### Project Structure

```
pipeline-pulse/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # shadcn components
│   │   │   ├── charts/       # Chart components
│   │   │   ├── dashboard/    # Dashboard widgets
│   │   │   └── common/       # Shared components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities
│   │   ├── pages/           # Route pages
│   │   ├── services/        # API services
│   │   ├── stores/          # Zustand stores
│   │   ├── types/           # TypeScript types
│   │   └── styles/          # Global styles & tokens
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/
│   │   │   │   └── deps.py
│   │   │   └── api.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   ├── database.py
│   │   │   └── session.py    # New: Session configuration and store
│   │   ├── models/
│   │   │   └── session.py    # New: Database model for sessions
│   │   ├── schemas/
│   │   ├── services/
│   │   │   ├── zoho/
│   │   │   ├── currency/
│   │   │   └── sync/
│   │   ├── tasks/          # Celery tasks
│   │   └── main.py
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
│
├── docker/
│   ├── frontend.Dockerfile
│   ├── backend.Dockerfile
│   └── docker-compose.yml
│
└── docs/
```

### Version Compatibility Notes

**Important**: This tech stack has been validated with the following specific compatibility requirements:

**Python 3.13 Compatibility Status (Updated Jan 2025)**:
- ✅ **Working**: FastAPI, SQLAlchemy 2.0.35+, Pydantic 2.8.2+, psycopg 3.2.9+
- ❌ **Not Compatible**: asyncpg (use psycopg instead)
- ⚠️ **Required Updates**: Must use specific versions listed above for Python 3.13

1. **Tailwind CSS v4 + Vite**:
   - Requires Vite 6.x (not 7.x) for `@tailwindcss/vite` plugin compatibility
   - Uses modern `@import "tailwindcss"` syntax instead of PostCSS directives
   - No PostCSS configuration needed

2. **Python 3.13 + SQLAlchemy**:
   - SQLAlchemy 2.0.35+ required for Python 3.13 compatibility
   - Pydantic 2.8.2+ with pydantic-settings 2.4.0+ for configuration
   - psycopg[binary] 3.2.9 driver for PostgreSQL async support (asyncpg not yet Python 3.13 compatible)

3. **React 19 + TypeScript 5.8**:
   - Latest stable versions with full async/concurrent features
   - TanStack ecosystem (Router, Query, Table) fully compatible

### Key Integration Points

1. **Zoho CRM SDK Setup**:
```python
from zcrmsdk import ZCRMRestClient
config = {
    'currentUserEmail': 'user@example.com',
    'client_id': ZOHO_CLIENT_ID,
    'client_secret': ZOHO_CLIENT_SECRET,
    'redirect_uri': ZOHO_REDIRECT_URI,
    'token_persistence_path': './tokens'
}
ZCRMRestClient.initialize(config)
```

2. **Currency Freaks Integration**:
```python
async def fetch_exchange_rates():
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{CURRENCY_API_URL}/latest",
            params={
                'apikey': CURRENCY_API_KEY,
                'base': BASE_CURRENCY
            }
        )
        return response.json()
```

3. **Real-time Updates with SSE**:
```python
from fastapi import FastAPI
from sse_starlette.sse import EventSourceResponse

@app.get("/api/sync/stream/{session_id}")
async def sync_stream(session_id: str):
    async def event_generator():
        async for update in sync_service.get_progress_stream(session_id):
            yield {"data": json.dumps(update)}

    return EventSourceResponse(event_generator())
```

4. **Session Management (Backend)**:
```python
from fastapi import FastAPI, Depends
from fastapi_sessions.backends.database import DatabaseSessionBackend
from fastapi_sessions.frontends.session_cookie import SessionCookie, SessionCookieParameters
from sqlalchemy.ext.asyncio import AsyncSession
from .models.session import Session  # Your SQLAlchemy Session model
from .core.database import get_db # Your database session dependency

# Define your session data (e.g., user ID)
class SessionData(BaseModel):
    user_id: int

# Configure session cookie
cookie_params = SessionCookieParameters(
    httponly=True,
    secure=settings.SESSION_COOKIE_SECURE,
    samesite=settings.SESSION_COOKIE_SAMESITE,
    domain=settings.SESSION_COOKIE_DOMAIN,
)
cookie = SessionCookie(
    cookie_name=settings.SESSION_COOKIE_NAME,
    secret_key=settings.SESSION_SECRET_KEY,
    cookie_params=cookie_params,
)

# Configure database session backend
# You'll need to implement a custom store that interacts with your SQLAlchemy model
class SQLAlchemySessionStore(DatabaseSessionBackend[UUID, SessionData]):
    def __init__(self, db_session_factory: Callable[[], AsyncSession]):
        self.db_session_factory = db_session_factory

    async def create(self, session_id: UUID, data: SessionData) -> None:
        async with self.db_session_factory() as db:
            new_session = Session(id=session_id, user_id=data.user_id, data=data.json())
            db.add(new_session)
            await db.commit()
            await db.refresh(new_session)

    async def read(self, session_id: UUID) -> Optional[SessionData]:
        async with self.db_session_factory() as db:
            result = await db.execute(select(Session).where(Session.id == session_id))
            session_record = result.scalar_one_or_none()
            if session_record:
                return SessionData.parse_raw(session_record.data)
            return None

    async def update(self, session_id: UUID, data: SessionData) -> None:
        async with self.db_session_factory() as db:
            result = await db.execute(select(Session).where(Session.id == session_id))
            session_record = result.scalar_one_or_none()
            if session_record:
                session_record.data = data.json()
                await db.commit()

    async def delete(self, session_id: UUID) -> None:
        async with self.db_session_factory() as db:
            result = await db.execute(select(Session).where(Session.id == session_id))
            session_record = result.scalar_one_or_none()
            if session_record:
                await db.delete(session_record)
                await db.commit()

# Initialize the store with your database session factory
# store = SQLAlchemySessionStore(get_db) # Assuming get_db returns a session factory

# Example usage in an endpoint
# from fastapi_sessions.session_verifier import SessionVerifier
# from fastapi_sessions.session_verifier import SessionVerifier
# from uuid import UUID

# class SessionVerifier(SessionVerifier[UUID, SessionData]):
#     def __init__(self, *, identifier: str, auto_error: bool, backend: SQLAlchemySessionStore, auth_http_exception: HTTPException):
#         self._identifier = identifier
#         self._auto_error = auto_error
#         self._backend = backend
#         self._auth_http_exception = auth_http_exception

#     async def verify_session(self, session_id: UUID) -> SessionData:
#         data = await self._backend.read(session_id)
#         if data is None:
#             raise self._auth_http_exception
#         return data

# verifier = SessionVerifier(
#     identifier="general_session",
#     auto_error=True,
#     backend=store,
#     auth_http_exception=HTTPException(status_code=403, detail="Invalid session"),
# )

# @app.get("/protected-route", dependencies=[Depends(cookie)], response_model=SessionData)
# async def protected_route(session_data: SessionData = Depends(verifier)):
#     return session_data
```

This tech stack provides:

- **Robust Session Management**: Database-backed sessions for persistent user state.
- **Real-time**: WebSocket/SSE for live updates
- **Type Safety**: Full TypeScript frontend, Pydantic backend
- **Performance**: Vite build, React Query caching
- **Maintainability**: Clean architecture, comprehensive testing
- **Enterprise Ready**: Monitoring, security, audit trails
