## Pipeline Pulse Complete Tech Stack

### Frontend Stack

```json
{
  "core": {
    "framework": "React 18.3+ with TypeScript 5.3+",
    "build": "Vite 5.0+",
    "state": "Zustand 4.5+"
  },
  "ui": {
    "styling": "Tailwind CSS 3.4+",
    "components": "shadcn/ui (latest)",
    "icons": "lucide-react",
    "charts": "recharts 2.10+ (shadcn/ui charts)"
  },
  "routing": {
    "router": "@tanstack/react-router",
    "navigation": "react-router-dom (if preferring traditional)"
  },
  "data": {
    "api": "@tanstack/react-query 5.0+",
    "websocket": "socket.io-client",
    "sse": "native EventSource API"
  },
  "forms": {
    "validation": "react-hook-form + zod",
    "tables": "@tanstack/react-table"
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
    "framework": "FastAPI 0.109+",
    "python": "3.11+ (3.12 preferred)",
    "async": "asyncio + httpx"
  },
  "database": {
    "primary": "PostgreSQL 15+",
    "orm": "SQLAlchemy 2.0+ (async)",
    "migrations": "Alembic",
    
  },
  "authentication": {
    "jwt": "python-jose[cryptography]",
    "oauth": "authlib (for Zoho OAuth)",
    "permissions": "casbin or custom RBAC"
  },
  "integrations": {
    "zoho": "zohocrm-python-sdk-8.0",
    "currency": "httpx for Currency Freaks API",
    "aws": "boto3 (for Secrets Manager)"
  },
  "async": {
    
    
    "websocket": "python-socketio"
  },
  "monitoring": {
    "logging": "structlog",
    "metrics": "prometheus-client",
    "tracing": "OpenTelemetry",
    "errors": "Sentry SDK"
  },
  "utilities": {
    "validation": "Pydantic 2.0+",
    "currency": "py-moneyed + babel",
    "testing": "pytest + pytest-asyncio",
    "api-docs": "FastAPI built-in + ReDoc"
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
    "@hookform/resolvers": "^3.3.4",
    "@radix-ui/react-accordion": "^1.1.2",
    "@radix-ui/react-alert-dialog": "^1.0.5",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@radix-ui/react-tabs": "^1.0.4",
    "@radix-ui/react-toast": "^1.1.5",
    "@react-pdf/renderer": "^3.4.0",
    "@tanstack/react-query": "^5.18.0",
    "@tanstack/react-router": "^1.15.0",
    "@tanstack/react-table": "^8.11.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "date-fns": "^3.3.0",
    "dinero.js": "^1.9.1",
    "lucide-react": "^0.320.0",
    "papaparse": "^5.4.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.49.0",
    "recharts": "^2.10.0",
    "socket.io-client": "^4.7.0",
    "tailwind-merge": "^2.2.0",
    "tailwindcss-animate": "^1.0.7",
    "zod": "^3.22.4",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.41.0",
    "@testing-library/react": "^14.1.0",
    "@types/node": "^20.11.0",
    "@types/papaparse": "^5.3.14",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "postcss": "^8.4.0",
    "prettier": "^3.2.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "vitest": "^1.2.0"
  }
}
```

#### Backend `requirements.txt`:

```txt
# Core Framework
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# Database
sqlalchemy[asyncio]==2.0.25
asyncpg==0.29.0
alembic==1.13.1


# Authentication & Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
authlib==1.3.0
casbin==1.23.0

# Zoho Integration
zohocrm-python-sdk-8.0==1.0.0
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
pydantic==2.5.0
pydantic-settings==2.1.0
python-dotenv==1.0.0
pendulum==3.0.0

# Testing
pytest==7.4.0
pytest-asyncio==0.23.0
pytest-cov==4.1.0
httpx==0.26.0  # for testing
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
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/pipeline_pulse


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
│   │   │   └── database.py
│   │   ├── models/
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

This tech stack provides:

- **Real-time**: WebSocket/SSE for live updates
- **Type Safety**: Full TypeScript frontend, Pydantic backend
- **Performance**: Vite build, React Query caching
- **Maintainability**: Clean architecture, comprehensive testing
- **Enterprise Ready**: Monitoring, security, audit trails