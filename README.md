# Pipeline Pulse

Enterprise-grade sales intelligence platform that transforms Zoho CRM data into actionable revenue insights.

## Overview

Pipeline Pulse provides real-time pipeline visibility, O2R (Opportunity-to-Revenue) tracking through four phases, GTM motion management, and currency-standardized financial insights in SGD.

## Tech Stack

### Frontend

- React 18.3+ with TypeScript
- Vite for build tooling
- Tailwind CSS + shadcn/ui for styling
- Zustand for state management
- React Query for data fetching

### Backend

- FastAPI with Python 3.11+
- PostgreSQL 15+ with SQLAlchemy
- Redis for caching
- Celery for background tasks

### Integrations

- Zoho CRM API
- Currency Freaks API
- AWS Services

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Development Setup

1. Clone the repository:

```bash
git clone https://github.com/1cloudhub/pipeline-pulse.git
cd pipeline-pulse
```

2. Set up the backend:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
```

3. Set up the frontend:

```bash
cd frontend
npm install
```

4. Configure environment variables:

```bash
# Copy example env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit with your configuration
```

5. Start development servers:

```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Redis
redis-server

# Terminal 4 - Celery (optional)
cd backend
celery -A app.tasks worker --loglevel=info
```

## Project Structure

```
pipeline-pulse/
├── .claude/              # Claude Code context files
├── frontend/             # React application
├── backend/              # FastAPI application
├── docker/               # Docker configurations
├── docs/                 # Additional documentation
└── scripts/              # Utility scripts
```

## Key Features

- **Automated Zoho CRM Sync**: Real-time data synchronization with conflict resolution
- **O2R Tracking**: Four-phase opportunity lifecycle management
- **Health Monitoring**: Automated Green/Yellow/Red/Blocked status
- **Currency Intelligence**: Multi-currency to SGD standardization
- **GTM Motion Tracking**: Customer journey aligned with AWS segments
- **Bulk Operations**: Efficient data management capabilities
- **Advanced Analytics**: Comprehensive dashboards and custom reports

## Documentation

See the `.claude` directory for comprehensive documentation:

- Project context and business requirements
- Technical specifications
- Business logic and rules
- Implementation guidelines

## Contributing

1. Follow the coding standards in `.claude/claude-instructions.md`
2. Ensure all tests pass
3. Update documentation as needed
4. Submit PR with clear description

## License

Proprietary - 1CloudHub

## Support

For questions or issues, contact the Pipeline Pulse team at 1CloudHub.
