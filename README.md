# Pipeline Pulse v2.0

**System of Action** for 1CloudHub's B2B SaaS sales operations.
Purpose-built standalone CRM replacing Zoho CRM — designed for the
AWS APN/ACE partnership motion.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite 5, Tailwind CSS 3.4 |
| Grid | AG Grid Community (MIT) |
| State | Zustand 4.5, TanStack Query 5 |
| Backend | FastAPI 0.109, Python 3.12, SQLAlchemy 2.0 async |
| Database | PostgreSQL 15+ (asyncpg) |
| Cache / Queue | Redis 7 + Celery |
| Document AI | AWS Textract (OCR) + Bedrock (extraction) |
| Storage | AWS S3 (ap-southeast-1) |
| Auth | JWT + RBAC (no external OAuth) |

---

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- PostgreSQL 15+
- Redis 7+

### Frontend
```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

---

## Project Structure

```
pipeline-pulse/
├── frontend/          React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── ui/       shadcn/ui components
│       │   ├── grid/     AG Grid wrappers
│       │   ├── charts/   Recharts components
│       │   ├── docai/    Document AI pipeline UI
│       │   └── common/   Shared components
│       ├── pages/         Route pages
│       ├── stores/        Zustand stores
│       ├── services/      API client layer
│       └── types/         TypeScript types
│
└── backend/           FastAPI backend
    └── app/
        ├── api/v1/    REST endpoints
        ├── core/      Config, DB, security
        ├── models/    SQLAlchemy models (13 tables)
        └── services/  Business logic
```

---

## Key Concepts

- **Relay Race Custodianship** — dynamic deal ownership transfers between SDR → AE → SA → AM
- **IAT Qualification** — structured lead qualification before opportunity creation
- **Temporal Intelligence** — weekly snapshots enable trend analysis and velocity tracking
- **Document AI Pipeline** — 5-stage: Upload → Textract OCR → Bedrock extraction → Review → Save
- **SGD-base Currency** — all deal values normalised to SGD; FX rates refreshed weekly

---

## Roles

| Role | Primary View |
|---|---|
| SDR | /demand-gen/leads |
| AE / Account Executive | /pipeline |
| Presales Consultant | /pipeline (own deals) |
| Presales SA | /pipeline (Stage 3+) |
| Presales Manager | /dashboard |
| AWS Alliance Manager | /pipeline (Alliance View) |
| CRO / Sales Leadership | /dashboard |
| Finance Manager | /dashboard (read-only) |
| System Administrator | /admin/users |

---

*BRD v6.1 · SRS v4.0 · Tech Stack v2.0 · April 2026*
