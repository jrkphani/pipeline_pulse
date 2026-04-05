# Pipeline Pulse — BRD v6.1 Summary (Claude Code Reference)
> Consolidated BRD v6.1 | Merges: BRD v5.3 + v6.0 + v6.1 + Wireframe Decisions v2.0
> Source of truth for business intent; SRS v4.2 provides technical detail

---

## What Pipeline Pulse Is

A **purpose-built, standalone CRM and revenue intelligence platform** for 1CloudHub's B2B SaaS sales operations. System of Action — not system of record. Replaces `1CH_Unified_Deal_Tracker.xlsx` and Zoho CRM (cancelled).

**Five Foundational Principles:**
1. Excel Elimination — 100% pipeline in Pipeline Pulse within 60 days
2. Spreadsheet-First Interface — indistinguishable from working in Excel
3. Zero Re-Entry Between Stages — SDR context auto-transfers to AE on graduation
4. AI-Assisted Discovery — real-time Q trees across all solution domains
5. Ambient AI — always logging, always guiding, never requiring users to open a box

---

## Stakeholders — 9 Roles

| Role | Type | Frequency | Primary Need |
|---|---|---|---|
| CRO / Sales Leadership | Primary | Daily | Full-funnel KPI, forecast accuracy, AI weekly review |
| AE / Account Executive | Primary | Daily | Minimal data entry, lead context pre-loaded, AI proposals |
| Presales Consultant (PC) | Primary | Daily | Discovery tracking, proposal ownership, AI-generated SOW drafts |
| Presales SA | Primary | Daily | Technical Q tree, Solution Fit output, tech handover |
| SDR | Primary | Daily | Lead creation, AI Q tree, ICP scoring, graduation gate |
| AWS Alliance Manager | Primary | Weekly | Funding compliance, ACE tracking, co-sell, dual-funded deals |
| Presales Manager ★ v5.3 | Primary | Daily | Full pipeline visibility, PC/SA workload, SA activation on any deal |
| Finance Manager ★ v5.3 | Primary | Weekly | Revenue milestone tracking, invoice status, FX rate management |
| System Administrator | Support | As needed | User management, SOPs ★, model config ★, Apollo.io API key |

### Presales Manager — Key Permissions
- Full pipeline visibility across all deals (not just assigned)
- Can activate SA on any deal from Stage 3 onwards
- Approves Proposal & SOW for deals ≤ SGD 500K
- View-only for TCO sessions, Solution Fit results

### Finance Manager — Key Permissions
- **Read-only** pipeline grid (limited column set only)
- Full access: Revenue vs Target, O2R Phase IV, FX rate settings
- **No access**: demand gen, deal detail editing, documents, SOPs, proposals, TCO

---

## RBAC Matrix — 9 Roles × Key Areas

| Permission Area | SDR | AE | PC | SA | PM | AM | CRO | Fin | Admin |
|---|---|---|---|---|---|---|---|---|---|
| Lead grid | Full | Full | Own | Own | Full | Full | Full | — | Full |
| Pipeline grid | — | Full | Own | Own S3+ | Full | Full | Full | Read | Full |
| Deal detail | — | Edit | Own | Own S3+ | Full | Full | Read | Read | Full |
| Document intelligence | — | Upload | Upload | View | View | View | — | — | Full |
| Revenue milestones | — | View | View | — | View | View | Full | Full | Full |
| Dashboard | — | Own | Own | Own | Team | Own | Full | Rev only | Full |
| Reports | — | Limited | Limited | — | Team | Alliance | Full | Rev only | Full |
| FX rate settings | — | — | — | — | — | — | — | Edit | Full |
| Admin section | — | — | — | — | — | — | — | — | Full |
| TCO sessions ★ | — | Run | Run | Run | View | View | View | — | View |
| Proposal & SOW ★ | — | Trigger | Trigger | — | Approve | — | Approve | — | — |
| Solution Fit results ★ | — | View | View | View | View | — | View | — | — |
| /admin/sops ★ | — | — | — | — | — | — | — | — | Full |
| /admin/model-config ★ | — | — | — | — | — | — | — | — | Full |
| /admin/catalog ★ | — | — | — | — | — | — | — | — | Full |
| /admin/templates ★ | — | — | — | — | — | — | — | — | Full |

### Proposal & SOW Approval Logic
- AE + PC jointly trigger when: `solution_fit_score ≥ 60` AND `tco_arr_sgd IS NOT NULL`
- Presales Manager approves: deals ≤ SGD 500K
- CRO approval required: deal_value_sgd > SGD 500K (SOW) or > SGD 1M (Proposal)
- Legal review required: non-standard IP clause or custom liability terms

---

## Dashboard — Role-Scoped Content

| Role | Key Widgets |
|---|---|
| SDR | Lead volume by stage, ICP score distribution, graduation rate, Q tree completion |
| AE | Own pipeline, weighted forecast, velocity, win/loss, revenue vs target, TCO sessions ★, proposals ★, solution fit ★ |
| Presales Manager | Full team pipeline, PC/SA workload, SA activation rate, proposal pipeline ★, avg solution fit ★ |
| Alliance Manager | Co-sell pipeline, ACE status, MAP/MMP utilisation, avg TCO ARR ★, funding breakdown ★ |
| CRO | Full-funnel KPI, team vs target, forecast accuracy, top deals at risk, AI weekly review ★ |
| Finance | Revenue milestone schedule, O2R receipt tracking, invoice status, SGD pipeline value, FX rate |

**Dashboard rules:**
- Post-login landing for CRO and Presales Manager
- All metric values clickable — drill through to filtered grid view
- Loads within 2s for all roles
- Mobile: condensed KPI card strip only

---

## Notification System

### Two Layers
| Layer | Description |
|---|---|
| Layer 1 | /notifications — persistent log, 90-day retention, unread badge on bell |
| Layer 2 | AI Insights Panel (380px) — contextual, async Bedrock, session-persistent |

### Delivery Channels
| Channel | Used For |
|---|---|
| In-app (Layer 1) | Rule engine events, logged AI alerts |
| In-app (Layer 2) | Real-time AI nudges, confidence indicators |
| Toast | Immediate confirmations (stage change, doc extracted) |
| Email (AWS SES) ★ | Morning brief (Haiku daily), CRO weekly (Sonnet), milestone alerts, handover brief |
| MS Teams ★ | Deal won broadcasts (Haiku celebratory announcement, incoming webhook) |

### Key Non-Suppressible Events
Stage transition · Stall alert (SLA breach) · MQL approved · PO received · Milestone overdue · Extraction complete · ACE fields incomplete · Approval gate triggered · Dual deal discrepancy

### AI Communications (SOP-governed)
- AE Morning Brief: Haiku, daily 06:00 SGT
- CRO Weekly Review: Sonnet, Monday 07:00 SGT
- Deal Won Broadcast: MS Teams webhook + Email, Full team
- Handover Brief: Sonnet, Order Book stage

---

## Navigation Architecture — 33 Routes

### Authentication
- /login · /forgot-password · /reset-password

### Global Shell (all roles)
- / (smart redirect) · /dashboard · /notifications · /profile

### Demand Generation (SDR, AE, PM)
- /demand-gen/leads · /demand-gen/leads/:id · /demand-gen/graduation

### Pipeline (AE, PC, SA, PM, AM, CRO)
- /pipeline (6 workbook tabs: Pipeline, Closed Deals, Rev vs Target, Velocity, Channels, Alliance View ★)
- /deals/:id (9 vertical tabs — see Wireframe Decisions WF2)

### Reports
- /reports/pipeline-health · /reports/revenue · /reports/velocity
- /reports/funnel · /reports/channels · /reports/white-space · /reports/saved

### Admin (System Administrator only, except /admin/fx-rates which Finance can access)
- /admin/users · /admin/reference-data · /admin/q-tree · /admin/integrations
- /admin/fx-rates · /admin/doc-ai · /admin/import · /admin/system
- /admin/sops ★ · /admin/model-config ★ · /admin/catalog ★ · /admin/templates ★

---

## AI Agent Architecture (BRD v6.0)

### Orchestrator (AWS Bedrock Agents)
Central intelligence hub. Routes all sub-agent calls. Reads SOP from S3 before every routing decision. Anti-conflict: max 1 nudge per user per 30-min window (compliance events exempt). Quiet hours: 21:00–06:00 SGT.

### Data Feed Agents (P0)
- **Enrichment Agent** [Hybrid/Haiku]: Apollo.io on lead creation, ICP rescore weekly
- **Doc Intelligence Agent** [Hybrid/Sonnet]: Textract OCR → field extraction → review grid → save
- **Field Inference Agent** [Hybrid/Haiku]: Pre-fill new deal fields from account history

### Discovery Agents (P0)
- **Discovery/Q Tree Agent** [AI/Sonnet]: Next-best-question routing, domain auto-detection
- **Meeting Summary Agent** [AI/Sonnet]: Call notes → structured field suggestions

### Solutioning Agents (P1)
- **Solution Fit Agent** [Hybrid/Haiku]: Scoring formula (rules) + narrative (Haiku). Traffic light output.
- **TCO Creator Agent** [Hybrid/Haiku]: AWS Pricing API via MCP. Structured wizard output.

### Commercial Agents (P1)
- **Proposal & SOW Agent** [AI/Sonnet+Opus]: Quality gate: fit_score ≥ 60 AND tco_arr_sgd NOT NULL. Opus escalation for >SGD 500K deals.
- **ACE Compliance Agent** [Rule Engine]: Zero Bedrock. Pure rules enforcement.

### Pipeline Intel Agents (P1)
- **Stall Detection** [Rule Engine/Celery Beat]: Runs every 6hrs. SLA thresholds from Reference Data.
- **Competitive Intel** [Hybrid/Haiku]: Intent signal classification.

### Execution Agents (P1)
- **Relay Race/Handover Agent** [Hybrid/Sonnet]: Triggered at Order Book stage.
- **Milestone Watch Agent** [Hybrid/Haiku]: Via Communications Agent.

### Planning Agents (P1)
- **Target Retirement Agent** [Hybrid/Haiku]: SQL arithmetic + Haiku morning brief narrative.
- **White Space Agent** [Hybrid/Haiku]: Account × Solution coverage analysis.

---

## Key Business Rules

- SGD is the base currency for all pipeline values
- All monetary values stored as `NUMERIC(15,2)` — never Float
- FX rates refreshed weekly from Currency Freaks API (Monday)
- Stage SLA thresholds configurable via /admin/reference-data (not hardcoded)
- Days-in-stage colours: <15d green, 15–30d amber, >30d red — thresholds config-driven
- Proposal & SOW: Fixed sections are verbatim from S3 SOP bucket (no AI generation)
- ACE compliance: mandatory fields must be populated within 48hrs of AWS funding type assignment
- RLS: PCs and SAs see only assigned deals; Presales Manager sees all

---

## Five-Phase Migration Plan

| Phase | Description | Key Deliverables |
|---|---|---|
| Phase 1 | Core CRM + Grid | Pipeline grid, deal detail, auth, RBAC, basic CRUD |
| Phase 2 | AI Document Ingestion | Textract OCR + Bedrock extraction + review grid |
| Phase 3 | Analytics & Reporting | Velocity, Channels, Pipeline Health, Revenue vs Target |
| Phase 4 | AI Agents | Orchestrator, Data Feed, Discovery agents + Dashboard |
| Phase 5 | Full AI Lifecycle | Proposal & SOW, Communications, SOP framework |
