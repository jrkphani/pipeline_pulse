# Pipeline Pulse — Complete Tech Stack v2.0
> Aligned to SRS v4.0 / BRD v6.1 | April 2026
> **Breaking change from v1.0:** Zoho CRM dependency fully removed. AG Grid Community replaces @tanstack/react-table. SheetJS CE replaces papaparse for exports.

---

## Frontend Stack

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
  "grid": {
    "engine": "ag-grid-community (MIT) + @ag-grid-community/react",
    "note": "Community Edition only — all FR-GRID requirements covered. No Enterprise license required.",
    "covers": [
      "Virtual row rendering (FR-GRID-008)",
      "Cell-level inline editing (FR-GRID-001)",
      "Column freeze/pinning (FR-GRID-006)",
      "Auto-filter per column (FR-GRID-007)",
      "Multi-row selection (FR-GRID-009)",
      "Keyboard navigation — Tab/Enter/Arrow/Ctrl+Home/End (FR-GRID-002)"
    ]
  },
  "routing": { "router": "@tanstack/react-router" },
  "data": {
    "api": "@tanstack/react-query 5.0+",
    "sse": "native EventSource API (document extraction progress streaming)",
    "websocket": "socket.io-client (concurrent edit notifications)"
  },
  "forms": {
    "validation": "react-hook-form + zod",
    "note": "Forms used only for auth and settings — deal entry is grid-native (FR-GRID-005)"
  },
  "exports": {
    "xlsx": "xlsx (SheetJS CE, MIT) — all .xlsx file generation (NFR-PERF-003)",
    "pdf": "@react-pdf/renderer — PDF report exports"
  },
  "utilities": {
    "dates": "date-fns",
    "currency": "dinero.js",
    "classnames": "clsx + tailwind-merge"
  },
  "dev": {
    "linting": "ESLint + Prettier + stylelint",
    "testing": "Vitest + React Testing Library",
    "e2e": "Playwright",
    "mocking": "msw (Mock Service Worker) — network-level API intercepts"
  }
}
```

---

## Backend Stack

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
    "cache": "Redis 7+"
  },
  "authentication": {
    "jwt": "python-jose[cryptography]",
    "permissions": "casbin or custom RBAC",
    "note": "JWT httpOnly cookies only. No localStorage. No OAuth/SSO in v1.0."
  },
  "ai_document_ingestion": {
    "ocr": "AWS Textract (via boto3) — Stage 1: raw text + table extraction from PDFs",
    "extraction": "AWS Bedrock Claude/Titan (via boto3) — Stage 2: intelligent field mapping",
    "storage": "AWS S3 (via boto3) — document upload storage, pre-signed URLs with expiry",
    "note": "5-stage pipeline per FR-DOCAI: OCR → Extraction → Field Mapping → Review Grid → Save"
  },
  "integrations": {
    "currency": "httpx for Currency Freaks API",
    "aws": "boto3 (Secrets Manager, Textract, Bedrock, S3)"
  },
  "async": {
    "queues": "Celery + Redis (document ingestion queue, NFR-SCAL-003)",
    "scheduler": "APScheduler or Celery Beat (weekly FX rate refresh)",
    "sse": "sse-starlette (extraction progress streaming to frontend)",
    "websocket": "python-socketio (concurrent edit notifications)"
  },
  "monitoring": {
    "logging": "structlog",
    "metrics": "prometheus-client",
    "tracing": "OpenTelemetry",
    "errors": "Sentry SDK"
  }
}
```

---

## Infrastructure

```json
{
  "cloud": {
    "provider": "AWS",
    "region": "ap-southeast-1 (Singapore)",
    "services": [
      "ECS/EKS", "RDS PostgreSQL 15+", "ElastiCache Redis",
      "Secrets Manager", "Textract", "Bedrock", "S3", "CloudWatch", "ALB"
    ]
  }
}
```

---

## Frontend `package.json` — Key Dependencies

```json
{
  "dependencies": {
    "@ag-grid-community/react": "^31.0.0",
    "ag-grid-community": "^31.0.0",
    "@tanstack/react-query": "^5.18.0",
    "@tanstack/react-router": "^1.15.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "socket.io-client": "^4.7.0",
    "xlsx": "^0.18.5",
    "zod": "^3.22.4",
    "zustand": "^4.5.0",
    "dinero.js": "^1.9.1",
    "date-fns": "^3.3.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.320.0",
    "react-hook-form": "^7.49.0"
  },
  "devDependencies": {
    "msw": "^2.3.0",
    "stylelint": "^16.0.0",
    "stylelint-config-standard": "^36.0.0"
  }
}
```

> **NEVER add:** `@ag-grid-enterprise/*`, `papaparse`, `@tanstack/react-table`

---

## Mock Service Worker (MSW) — Mandatory for Dev & Test

> **MSW is the only permitted mocking strategy for network calls.** Do not use hardcoded React state, `useState` with fake data, or custom fetch wrappers as substitutes.

### Why MSW (not hardcoded state mocks)

Two categories of Pipeline Pulse workflows are impossible to test correctly without network-level intercepts:

1. **AI queue workflows** — DocAI extraction (FR-DOCAI) has a 5-stage SSE progress stream. Hardcoded state cannot simulate the server-sent event sequence, upload latency, or partial-failure states (e.g., Textract timeout at Stage 1). MSW intercepts the SSE endpoint and streams fake events with realistic timing.

2. **Q Tree metadata uploads** — The Admin Q Tree upload wizard (WF12) is a 4-step flow gated by sequential API responses (parse → preview → metadata → publish). Hardcoded state collapses all four steps into one component render cycle, hiding race conditions and error states that only manifest with real async latency.

### Install

```bash
npm install --save-dev msw@^2.3.0
npx msw init public/ --save
```

### Setup — `src/mocks/`

```
src/mocks/
├── browser.ts        # MSW browser worker setup
├── server.ts         # MSW Node server for Vitest
└── handlers/
    ├── opportunities.ts
    ├── leads.ts
    ├── docai.ts      # SSE stream simulation
    └── qtree.ts      # Q Tree upload wizard steps
```

```typescript
// src/mocks/browser.ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);

// src/mocks/server.ts — used by Vitest
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```typescript
// src/mocks/handlers/docai.ts — SSE stream simulation
import { http, HttpResponse } from 'msw';

export const docaiHandlers = [
  http.get('/api/v1/documents/stream/:sessionId', async ({ params }) => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const stages = [
          { stage: 1, label: 'Running OCR...', pct: 20 },
          { stage: 2, label: 'Extracting fields...', pct: 40 },
          { stage: 3, label: 'Mapping to schema...', pct: 60 },
          { stage: 4, label: 'Awaiting review...', pct: 80 },
          { stage: 5, label: 'Complete', pct: 100 },
        ];
        for (const event of stages) {
          await new Promise(r => setTimeout(r, 800));  // Simulate real latency
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
        controller.close();
      },
    });
    return new HttpResponse(stream, {
      headers: { 'Content-Type': 'text/event-stream' },
    });
  }),
];
```

```typescript
// src/mocks/handlers/qtree.ts — 4-step upload wizard
import { http, HttpResponse } from 'msw';

export const qtreeHandlers = [
  // Step 1: parse uploaded .md file
  http.post('/api/v1/admin/q-tree/parse', async () => {
    await new Promise(r => setTimeout(r, 1200));  // Simulate parse time
    return HttpResponse.json({ sections: 5, questions: 23, warnings: [] });
  }),
  // Step 2: preview already returned by parse
  // Step 3: set metadata
  http.post('/api/v1/admin/q-tree/metadata', async () =>
    HttpResponse.json({ id: 'qtree-draft-001', status: 'staged' })
  ),
  // Step 4: publish
  http.post('/api/v1/admin/q-tree/publish/:id', async () =>
    HttpResponse.json({ version: 'v1.3.0', publishedAt: new Date().toISOString() })
  ),
];
```

### Vitest Integration

```typescript
// src/test/setup.ts
import { server } from '../mocks/server';
import { beforeAll, afterAll, afterEach } from 'vitest';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```typescript
// vitest.config.ts — include setup file
export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup.ts'],
    environment: 'jsdom',
  },
});
```

### MSW Rules

| Rule | Detail |
|---|---|
| **Always use MSW** for network mocks | Never fake data with `useState` or hardcoded arrays in components |
| **Never disable** `onUnhandledRequest: 'error'` | Unhandled requests must fail loudly — silent passthrough masks missing handlers |
| **Simulate real latency** in SSE and multi-step handlers | `setTimeout` delays are mandatory for queue and wizard flows |
| **One handler file per API domain** | `opportunities.ts`, `leads.ts`, `docai.ts`, `qtree.ts`, etc. |
| **MSW in Vitest** (`setupServer`) + **MSW in browser dev** (`setupWorker`) | Never use one for the other |

---

## Key Constraints (Non-Negotiable)

| Constraint | Rule |
|---|---|
| AG Grid | Community Edition ONLY — no Enterprise imports |
| SheetJS | `xlsx` package (MIT CE) — never `xlsx-pro` or `exceljs` |
| SheetJS calls | Always in `src/lib/excel-export.ts` — never inline in components |
| Monetary values | `Numeric(15,2)` in DB — never `Float` |
| Auth tokens | httpOnly cookies — never localStorage |
| Alembic | Never create new migrations without explicit instruction |
| Backend models | 13 models are final — no additions without instruction |
| API mocking | MSW only — never hardcoded React state mocks |

---

## Key Integration Patterns

### AG Grid Community (FR-GRID)

```typescript
import { AgGridReact } from '@ag-grid-community/react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';

const gridOptions = {
  modules: [ClientSideRowModelModule],
  defaultColDef: { editable: true, resizable: true, sortable: true, filter: true },
  rowHeight: 30,         // Compact — matches Excel default
  suppressPaginationPanel: true,
  rowModelType: 'clientSide',  // Virtual rendering — pagination PROHIBITED
};
```

### SheetJS CE (NFR-PERF-003)

```typescript
// ONLY in src/lib/excel-export.ts — never in components
import * as XLSX from 'xlsx';

export function exportGridToXlsx(rows: Deal[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pipeline');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
```

### SSE — Extraction Progress

```python
from sse_starlette.sse import EventSourceResponse

@app.get("/api/docai/stream/{session_id}")
async def extraction_stream(session_id: str):
    async def event_generator():
        async for update in docai_service.get_progress_stream(session_id):
            yield {"data": json.dumps(update)}
            # update shape: { stage: 1-5, label: "Running OCR...", pct: 20 }
    return EventSourceResponse(event_generator())
```

---

## Environment Variables (Key)

```bash
VITE_API_URL=/api          # Proxy-relative — NOT bare host
DATABASE_URL=postgresql+asyncpg://...
REDIS_URL=redis://localhost:6379/0
BASE_CURRENCY=SGD
AWS_REGION=ap-southeast-1
AWS_BEDROCK_REGION=us-east-1
AWS_S3_BUCKET_NAME=pipeline-pulse-documents
DOCAI_MIN_CONFIDENCE_THRESHOLD=0.80
DOCAI_TARGET_ACCEPTANCE_RATE=0.85
```

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend Framework | React 18 + TypeScript 5.3 + Vite 5 |
| Data Grid | AG Grid Community (MIT) — spreadsheet-first |
| State Management | Zustand 4.5 |
| Data Fetching | TanStack Query v5 |
| Routing | TanStack Router |
| Styling | Tailwind CSS 3.4 + shadcn/ui |
| Charts | Recharts 2.10 |
| xlsx Export | SheetJS CE (MIT) |
| API Mocking | MSW v2 (network-level — mandatory) |
| Linting | ESLint + stylelint (design token enforcement) |
| Backend | FastAPI 0.109 + Python 3.11+ |
| Database | PostgreSQL 15+ (SQLAlchemy 2.0 async) |
| Cache/Queue | Redis 7 + Celery |
| AI/ML | AWS Bedrock (Claude/Titan) + AWS Textract |
| Storage | AWS S3 |
| Auth | JWT httpOnly cookies + custom RBAC |
| Currency | Currency Freaks API (SGD base) |
| Region | AWS ap-southeast-1 (Singapore) |
