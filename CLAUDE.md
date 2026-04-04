# Pipeline Pulse v2.0 — Claude Code Context

## What this project is
Standalone B2B SaaS CRM for 1CloudHub sales operations.
This is NOT a Zoho extension. Zoho has been fully removed.
System of Action — drives workflow, not just stores data.

## Stack (non-negotiable — do not upgrade or swap)
- Frontend: React 18, TypeScript 5.3, Vite 5, Tailwind CSS 3.4
- Grid: ag-grid-community@31 + @ag-grid-community/react (Community Edition, MIT)
- Export: xlsx (SheetJS CE) — NOT papaparse, NOT AG Grid Enterprise export
- State: zustand@4.5 + @tanstack/react-query@5
- Router: @tanstack/react-router@1
- Backend: FastAPI 0.109, Python 3.12, SQLAlchemy 2.0 async, asyncpg
- Database: PostgreSQL 15+ — 13 tables (see models/)
- Auth: JWT only — no OAuth, no Zoho, no SSO in v1.0

## What NOT to do
- Do not add @tanstack/react-table (replaced by AG Grid)
- Do not add papaparse (replaced by SheetJS)
- Do not add any Zoho packages or references
- Do not use Tailwind v4 syntax (@tailwindcss/vite, @import "tailwindcss")
- Do not use Vite 6 — stay on Vite 5
- Do not use Zustand 5 — stay on Zustand 4.5 (different API)
- Do not add dnd-kit, next-themes, sonner, vaul (not in spec)
- Do not create database migrations by hand — use alembic autogenerate

## Database (13 tables)
users, accounts, territories, opportunities, leads,
opportunity_snapshots, stage_events, documents,
revenue_milestones, tco_sessions, ai_q_responses,
notifications, currency_rates

## Key business rules
- All money → SGD. deal_value_sgd is always populated.
- Opportunities have 5 stages: new_hunt, discovery, proposal, negotiation, order_book
- Funding types: customer | aws | dual
- Programs: MAP | MMP | POC | none
- Custodian ≠ Owner (relay race — custodian is who's driving right now)
- IAT score gates opportunity creation from leads
- Weekly snapshots (opportunity_snapshots) power velocity and trend views
- CRO approval required when deal_value_sgd > 500,000

## File locations
- Frontend entry: frontend/src/main.tsx
- Frontend router: frontend/src/router.tsx
- Backend entry: backend/app/main.py
- Backend config: backend/app/core/config.py
- Models: backend/app/models/
- API routes: backend/app/api/v1/
