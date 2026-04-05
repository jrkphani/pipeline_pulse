# Pipeline Pulse — SRS v4.2 Summary (Claude Code Reference)
> SRS v4.0 + Admin Patch v4.2 | Aligned to BRD v6.1
> Technical specification — complement BRD summary with this for implementation context

---

## Document Context

This SRS supersedes v3.0 in its entirety. §3.1–§3.19 carried forward from SRS v3.0. §3.20+ are new in v4.0 (AI agent architecture). The Admin patch (v4.2) adds §3.31–§3.33 covering FR-ADMIN-RLS, FR-ADMIN-TEAM, FR-ADMIN-QTREE.

---

## 1. Product Scope

Pipeline Pulse is a System of Action (not record) built around five principles:
1. Excel Elimination — 100% pipeline native in 60 days
2. Spreadsheet-First Interface — indistinguishable from Excel
3. Zero Re-Entry — SDR context auto-transfers to AE on graduation
4. AI-Assisted Discovery — real-time Q trees across solution domains
5. Ambient AI — always logging, always guiding, never requiring users to open a separate tool

---

## 2. FR Sections Summary

| FR Section | Coverage | Priority | Count |
|---|---|---|---|
| §3.1 FR-GRID | Spreadsheet-First Interface | P0 | 12 FRs |
| §3.2 FR-DOCAI | AI-Powered Document Ingestion | P0 | 6 FRs |
| §3.3 FR-IMPORT | Excel Migration Wizard | P0 | 5 FRs |
| §3.4 FR-LEAD | Demand Generation & Lead Stage | P0 | 5 FRs |
| §3.5 FR-DEAL | Native Deal Management | P0 | 6 FRs |
| §3.6 FR-VEL | Deal Velocity & Stage Intelligence | P0 | 5 FRs |
| §3.7 FR-O2R | Opportunity-to-Revenue Tracking | P0 | 9 FRs |
| §3.8 FR-GTM | Go-to-Market Motion Tracker | P1 | 4 FRs |
| §3.9 FR-FIN | Financial Intelligence | P1 | 7 FRs |
| §3.10 FR-BULK | Bulk Operations | P1 | 6 FRs |
| §3.11 FR-ANL | Analytics & Reporting | P1 | 5 FRs |
| §3.12 FR-LEAD-DASH | Lead Performance Dashboard | P1 | 5 FRs |
| §3.13 FR-RLS | Row-Level Security | P0 | 5 FRs |
| §3.14 FR-TEAM | Team Management | P1 | 4 FRs |
| §3.15 FR-TARGET | Target Management | P1 | 6 FRs |
| §3.16 FR-MON | System Monitoring & Health | P1 | 5 FRs |
| §3.17 FR-AUTH | Authentication & Access Control | P0 | 8 FRs |
| §3.18 FR-API | Backend API Endpoints | P0 | Updated in v4.0 |
| §3.19 FR-ERR | Error Handling & Recovery | P1 | 4 FRs |
| §3.20 FR-ORCH | AI Orchestrator ★ | P0 | 5 FRs |
| §3.21 FR-AGENT-FEED | Data Feed Agent Group ★ | P0 | 1 shared FR |
| §3.22 FR-AGENT-DISC | Discovery Agent Group ★ | P0 | 1 shared FR |
| §3.23 FR-AGENT-SOL | Solutioning Agent Group ★ | P1 | 1 shared FR |
| §3.24 FR-AGENT-COM | Commercial Agent Group ★ | P1 | 1 shared FR |
| §3.25 FR-AGENT-PIPE | Pipeline Intel Agent Group ★ | P1 | 1 shared FR |
| §3.26 FR-AGENT-EXEC | Execution Agent Group ★ | P1 | 1 shared FR |
| §3.27 FR-AGENT-PLAN | Planning Agent Group ★ | P1 | 1 shared FR |
| §3.28 FR-DOCGEN | Proposal & SOW Doc Generation ★ | P1 | 4 FRs |
| §3.29 FR-COMMS | Communications Architecture ★ | P1 | 3 FRs |
| §3.30 FR-SOP | SOP Governance Framework ★ | P1 | 3 FRs |
| §3.31 FR-ADMIN-RLS | Admin RLS Configuration ★ | P1 | Admin patch |
| §3.32 FR-ADMIN-TEAM | Admin Team Management ★ | P1 | Admin patch |
| §3.33 FR-ADMIN-QTREE | Q Tree Admin Config ★ | P1 | Admin patch |

---

## 3. Key FR Details

### FR-GRID (Spreadsheet-First)
- FR-GRID-001: Inline cell editing — single click, no modal
- FR-GRID-002: Full Excel keyboard parity: Tab/Enter/Escape/Arrow/Ctrl+C/V/D/A/F
- FR-GRID-006: SGD_core column always pinned left, never unpinnable
- FR-GRID-007: AutoFilter on every column header
- FR-GRID-008: Virtual row rendering — pagination PROHIBITED
- FR-GRID-009: Multi-row selection with bulk action toolbar

### FR-DOCAI (AI Document Ingestion — 5 Stages)
1. **Stage 1 (OCR)**: AWS Textract — raw text + table extraction from PDF/XLSX
2. **Stage 2 (Extraction)**: AWS Bedrock (Sonnet) — field mapping from raw text
3. **Stage 3 (Field Mapping)**: Map extracted fields to CRM schema — rule-governed
4. **Stage 4 (Review Grid)**: Human review in AG Grid — accept/reject/edit extracted fields
5. **Stage 5 (Save)**: Confirmed fields saved to deal record with audit trail

- Acceptance rate target: ≥85% (FR-DOCAI)
- Sonnet escalates to Opus if acceptance_rate < 70%
- Progress streamed via SSE (EventSource API)
- Max file size: 20MB; supported: PDF, XLSX, XLS

### FR-LEAD (Demand Generation)
- L1/L2/L3 pipeline stages
- Apollo.io enrichment on lead creation (60s timeout)
- ICP score: 1–5 stars, AI-enriched
- N/T/ICP signal dots (Need / Timeline / ICP)
- Q Tree sessions during discovery calls
- MQL gate: 5 criteria must be met (Meeting + DM + Pain + Budget + Timeline)
- Graduation gate: human approval (AE + PC assignment) on /demand-gen/graduation

### FR-AUTH (Authentication)
- JWT tokens: access (15min) + refresh (7 days) in httpOnly cookies
- Token refresh handled in frontend api-client interceptor
- NEVER store tokens in localStorage
- RBAC: 9 roles with granular permissions (see BRD summary)
- RLS enforced at PostgreSQL level for deal visibility

### FR-ORCH (AI Orchestrator)
- Routes all AI events via Redis event bus
- Reads relevant SOP file from S3 before any routing decision
- Anti-conflict: max 1 nudge per user per 30-min window
- Compliance events bypass batching (non-suppressible)
- Quiet hours: 21:00–06:00 SGT (compliance events exempt)
- Orchestrator routing: < 200ms latency
- All routing decisions logged: event, user, agents activated, SOP version, timestamp

---

## 4. Non-Functional Requirements

| NFR | Requirement |
|---|---|
| NFR-PERF-001 | Pipeline grid initial load < 3s for 5,000 rows |
| NFR-PERF-002 | AG Grid init < 100ms for 1,000 rows |
| NFR-PERF-003 | XLSX export < 3s for 5,000 rows (SheetJS streaming) |
| NFR-PERF-004 | API p95 latency < 200ms for list endpoints |
| NFR-PERF-005 | Dashboard load < 2s for all roles |
| NFR-PERF-006 | Orchestrator routing latency < 200ms |
| NFR-PERF-007 | Communications Agent batching: 30-minute window |
| NFR-SCAL-001 | Support 50,000+ rows with virtual scroll (no pagination) |
| NFR-SCAL-002 | Support 50 concurrent users without degradation |
| NFR-SCAL-003 | Celery queue for DocAI ingestion bursts |
| NFR-SEC-001 | JWT in httpOnly cookies — never localStorage |
| NFR-SEC-002 | RLS at PostgreSQL level for all deal queries |
| NFR-SEC-003 | All credentials in AWS Secrets Manager (not env files in prod) |
| NFR-DATA-001 | All monetary values: NUMERIC(15,2) — never Float |
| NFR-DATA-002 | All timestamps: TIMESTAMP WITH TIME ZONE |
| NFR-DATA-003 | Single Alembic migration — no additions without instruction |
| NFR-BUNDLE | Frontend initial bundle < 500KB gzipped |

---

## 5. AI Agent Architecture (Technical Detail)

### Two-Data-Feed Constraint
All AI inputs MUST originate from either:
1. Q Tree structured discovery (FR-AGENT-DISC)
2. Document Extraction (FR-AGENT-FEED / FR-DOCAI)

No other input channels are permitted for AI agents.

### Agent Implementation Summary

| Agent | Layer | Bedrock Model | Trigger | Rule vs AI Split |
|---|---|---|---|---|
| Enrichment | Data Feed | Haiku | Lead creation, weekly rescore | 80% rule, 20% Haiku (novel accounts) |
| Doc Intelligence | Data Feed | Sonnet (Opus fallback) | Document upload | Stage 1,3,5 = rule; Stage 2 = Sonnet |
| Field Inference | Data Feed | Haiku | New deal creation | Known accounts = rule; novel = Haiku |
| Discovery/Q Tree | Discovery | Sonnet | Q Tree session open | Pure AI — semantic NLP on free text |
| Meeting Summary | Discovery | Sonnet | Call notes saved | Pure AI — informal → structured |
| Solution Fit | Solutioning | Haiku | Q Tree closes ≥70% complete | Scoring = rule; rationale narrative = Haiku |
| TCO Creator | Solutioning | Haiku | Solution Fit confirms | AWS Pricing API calc = rule; narrative = Haiku |
| Proposal & SOW | Commercial | Sonnet + Opus | Approval confirmed, quality gate pass | Fixed/Variable = no AI; AI-Drafted = Sonnet/Opus |
| ACE Compliance | Commercial | None (Rule Engine) | 48h cron | 100% rules — zero Bedrock |
| Deal Qualification | Pipeline Intel | None | Stage change, Q Tree close | 100% formula — DB computed column |
| Stall Detection | Pipeline Intel | None (Rule Engine) | Celery Beat every 6h | 100% rules — SLA config from Reference Data |
| Competitive Intel | Pipeline Intel | Haiku | Keyword match in Q Tree/notes | Detection = rule; narrative = Haiku |
| Relay Race/Handover | Execution | Sonnet + Opus | Order Book stage transition | Variable sections = rule; risk narrative = Sonnet |
| Milestone Watch | Execution | Haiku (via Comms) | Daily cron | Date comparison = rule; Finance digest = Haiku |
| Target Retirement | Planning | Haiku | Daily 06:00 SGT | Gap arithmetic = SQL; morning brief = Haiku |
| White Space | Planning | Haiku | Post-close milestone complete | Pattern detection = rule; upsell narrative = Haiku |

### Quality Gates
- Proposal & SOW Agent blocked if: `solution_fit_score < 60` OR `tco_arr_sgd IS NULL`
- Opus escalation: deal_value_sgd > SGD 1M (proposal) or > SGD 500K (SOW)
- Discovery completeness warning: if `discovery_completeness_pct < 70%` at SOW generation

---

## 6. Data Model — Key Fields

### Opportunity Model (core entity)
```python
class Opportunity(Base):
    id: UUID
    account_name: str
    opportunity_name: str
    stage: SalesStage           # 'New Hunt' | 'Discovery' | 'Proposal' | 'Negotiation' | 'Order Book'
    sgd_core: Decimal           # NUMERIC(15,2) — canonical pipeline value
    deal_value: Decimal         # NUMERIC(15,2) — local currency
    local_currency: str         # ISO 4217
    custodian_id: UUID          # Current custodian (not owner — temporal)
    gtm_motion: GTMMotion       # 'SAP' | 'VMware' | 'GenAI' | 'Data' | 'AMS'
    funding_type: FundingType   # 'Customer' | 'AWS' | 'Dual'
    expected_close_date: date
    days_at_stage: int          # Computed
    stage_health: HealthStatus  # Computed
    archive_flag: bool          # Soft delete
    created_at: datetime        # TIMESTAMP WITH TIME ZONE
    updated_at: datetime        # TIMESTAMP WITH TIME ZONE (auto-trigger)
```

### AI-Generated Fields (v4.0 additions)
```python
# TCO Creator (6 fields)
tco_arr_sgd: Decimal            # NUMERIC(15,2)
tco_arr_usd: Decimal
recommended_funding_program: str
funding_cash_sgd: Decimal
dual_deal_recommended: bool
tco_confidence_score: Decimal

# Solution Fit (6 fields)
solution_fit_score: int         # 0-100
fit_status: str                 # 'Fit' | 'Partial Fit' | 'No Fit'
primary_solution_area: str
solution_rationale: str
catalog_version: str
last_evaluated_at: datetime

# Q Tree (4 fields)
q_tree_session_id: UUID
q_tree_domain: str              # Auto-detected
discovery_completeness_pct: Decimal
pain_points_logged: int
```

---

## 7. Backend API Structure

```
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout

GET  /api/v1/opportunities
POST /api/v1/opportunities
GET  /api/v1/opportunities/{id}
PATCH /api/v1/opportunities/{id}

GET  /api/v1/leads
POST /api/v1/leads
GET  /api/v1/leads/{id}
PATCH /api/v1/leads/{id}
POST /api/v1/leads/{id}/graduate   # MQL graduation gate

POST /api/v1/documents/upload      # Triggers DocAI pipeline
GET  /api/v1/documents/stream/{session_id}  # SSE progress

GET  /api/v1/reports/velocity
GET  /api/v1/reports/pipeline-health
GET  /api/v1/reports/channels
GET  /api/v1/reports/funnel
GET  /api/v1/reports/white-space

GET  /api/v1/admin/users
POST /api/v1/admin/users
PATCH /api/v1/admin/users/{id}
GET  /api/v1/admin/reference-data
PATCH /api/v1/admin/reference-data/{table}/{id}
GET  /api/v1/admin/sops            # SOP file list
PATCH /api/v1/admin/sops/{id}     # Save + version bump + S3 + Redis flush
GET  /api/v1/admin/model-config
PATCH /api/v1/admin/model-config/{id}

GET  /api/v1/currency/rates        # Current FX rates (Redis-cached)
GET  /health                       # Health check
```

---

## 8. External Integrations

| Integration | Purpose | Auth |
|---|---|---|
| AWS Textract | OCR — Stage 1 of DocAI | boto3, IAM role, ap-southeast-1 |
| AWS Bedrock | AI extraction + all agent generations | boto3, IAM role, us-east-1 |
| AWS S3 | Document storage, SOP bucket, exports | boto3, IAM role, ap-southeast-1 |
| AWS Secrets Manager | All credentials | boto3, IAM role |
| AWS SES | Email delivery (morning brief, alerts) | boto3, ap-southeast-1 |
| MS Teams | Deal won broadcasts | Incoming webhook |
| Apollo.io | Lead enrichment | REST API, key in Secrets Manager |
| Currency Freaks | FX rates | REST API, SGD base, weekly |
| Redis | Celery queue + SOP cache + session | Connection string |

---

## 9. Development Phases

| Phase | FR Coverage | Status |
|---|---|---|
| Phase 1 | FR-GRID, FR-DEAL, FR-AUTH, FR-LEAD (basic), FR-IMPORT | In progress |
| Phase 2 | FR-DOCAI, FR-AGENT-FEED (Doc Intelligence) | Planned |
| Phase 3 | FR-ANL, FR-VEL, FR-O2R, FR-FIN, FR-TARGET | Planned |
| Phase 4 | FR-ORCH, FR-AGENT-FEED (Enrichment), FR-AGENT-DISC, FR-AGENT-PIPE | Planned |
| Phase 5 | FR-AGENT-SOL, FR-AGENT-COM, FR-AGENT-EXEC, FR-AGENT-PLAN, FR-DOCGEN, FR-COMMS, FR-SOP | Planned |
