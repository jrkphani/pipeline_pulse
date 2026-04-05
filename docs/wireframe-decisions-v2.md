# Pipeline Pulse — Wireframe Decisions v2.0
**Session date:** April 2026 | **Status:** Decisions locked | **Fidelity:** Mid-fi
**Based on:** BRD v6.1 (Consolidated) + Wireframe Decisions v2.0

---

## Global Shell Decisions

| Decision | Choice |
|---|---|
| Primary daily users | AE/Seller, SDR, Presales Consultant, SA (daily) · CRO/Management (2–3×/week) |
| Sidebar | Collapses to icon-only (64px) by default; expands on hover |
| Branding | 1CloudHub logo mark + "Pipeline Pulse" sub-label |
| Sidebar colour | Light — matches main content area (no dark sidebar) |
| Dashboard nav | Sidebar section — all roles access it |
| Global search | Command palette (Cmd+K / Ctrl+K) — no persistent search bar in top nav |

### Role-Based Post-Login Redirects

| Role | Post-Login Landing |
|---|---|
| SDR | /demand-gen/leads |
| AE / Account Executive | /pipeline |
| Presales Consultant (PC) | /pipeline — filtered to own assigned deals |
| Presales SA | /pipeline — filtered to own assigned deals, Stage 3+ only |
| Presales Manager | /dashboard — full team pipeline and presales capacity view |
| AWS Alliance Manager | /pipeline — Alliance View tab active |
| CRO / Sales Leadership | /dashboard — full-funnel KPI scorecard |
| Finance Manager | /dashboard — Revenue milestone and O2R receipt view |
| System Administrator | /admin/users |

### Sidebar Nav Icons

| Section | Icon |
|---|---|
| Dashboard | 4-square grid |
| Demand Gen | Funnel shape |
| Pipeline | Lightning bolt |
| Reports | Bar chart (3 bars) |
| Notifications | Bell |
| Admin | Gear/cog |

### Sidebar Nav Structure

```
Dashboard                   /dashboard
Demand Gen
  ├── Leads                 /demand-gen/leads
  └── Graduation Queue ★   /demand-gen/graduation  [badge: count]
Pipeline                    /pipeline
Reports                     /reports/*
Notifications               /notifications
Admin (Admin role only)     /admin/*
```

---

## Command Palette (⌘K)

**Decision:** Search implemented as a command palette — no persistent search bar. TopBar shows a small pill "⌘K Search…" as the only search affordance.

| Property | Value |
|---|---|
| Trigger | Cmd+K (Mac) · Ctrl+K (Windows) · tap search icon (mobile) |
| Appearance | Centred modal overlay ~640px wide over current page |
| Backdrop | Dimmed — grid/page remains visible behind overlay |
| Dismiss | Escape key or click outside |
| Results | Instant as user types — no submit button |
| Keyboard nav | Arrow keys to move, Enter to select |
| Default state | 5 most recently visited deals/leads shown before typing |

### Command Palette Scope

| Category | Examples |
|---|---|
| Search — Deals | "OCBC", "SAP" — account name + opportunity name |
| Search — Leads | Company name, contact name, lead ID |
| Navigate | "Pipeline", "Dashboard", "Demand Gen", "Reports", "Admin" |
| Quick actions | "New deal", "New lead", "Upload document" |
| Deal actions | "Advance OCBC to Stage 4", "Generate proposal for DBS" |
| AI queries | "Show my stalled deals", "Deals closing this month" |

Result rows: icon + primary label + secondary context (e.g. "OCBC Bank · SGD 2.4M · Stage 3")
Results grouped by: Deals · Leads · Navigation · Actions

### Keyboard Shortcuts
| Shortcut | Action |
|---|---|
| `G P` | Go to Pipeline |
| `G D` | Go to Dashboard |
| `N D` | New Deal |

RLS enforcement: search results scoped to user's visible records.

---

## Design System Decisions

### Stage Badge Colours

| Stage | Badge Fill | Badge Text |
|---|---|---|
| 1 · New Hunt | #FAECE7 (coral-50) | #712B13 (coral-900) |
| 2 · Discovery | #FAEEDA (amber-50) | #633806 (amber-900) |
| 3 · Proposal | #E6F1FB (blue-50) | #0C447C (blue-800) |
| 4 · Negotiation | #E1F5EE (teal-50) | #085041 (teal-800) |
| 5 · Order Book | #EAF3DE (green-50) | #27500A (green-900) |

### Lead Status Colours

| Status | Colour |
|---|---|
| Contacted | Blue (#185FA5) |
| Engaged | Amber (#BA7517) |
| MQL Ready | Teal (#0F6E56) |
| ✓ MQL (converted) | Green (#3B6D11) |

### Days in Stage Health (Text colour on grid column)
- < 15d: green text (#3B6D11)
- 15–30d: amber text (#854F0B)
- > 30d: red text (#A32D2D) — stalled

### Funding Badges
- Customer: gray (#F1EFE8 / #5F5E5A)
- AWS: blue (#E6F1FB / #0C447C)
- Dual: purple (#EEEDFE / #3C3489)

### Program Badges
- MAP: teal (#E1F5EE / #085041)
- MMP: amber (#FAEEDA / #633806)
- POC: coral (#FAECE7 / #712B13)

---

## WF1 — Pipeline Grid (/pipeline)

### Q&A Decisions

| Decision | Choice |
|---|---|
| Finance Manager access | Read-only · Limited column set · Bulk edit toolbar hidden |
| Finance Manager visible columns | Account Name · Deal Value (SGD) · Stage · Funding Type · PO ID · Expected Close Date · Revenue milestone columns |
| AWS Alliance Manager access | Full access · Lands on Alliance View tab on login |
| Alliance View implementation | Dedicated workbook tab — 6th tab |
| Alliance View column set | Account · Opportunity · Stage · Deal Value SGD · Funding Type · Program (MAP/MMP) · ACE ID · MAP Status · Seller · Close Date |
| Alliance View filter | Auto-filtered to Funding Type = AWS / Dual on tab activation |
| Default columns (Pipeline tab) | Account Name · Opportunity Name · Stage (badge) · Deal Value (SGD) · Seller · GTM Motion · Close Date · Days in Stage · Funding Type · Program (MAP/MMP/POC) |
| Toolbar controls | New deal button · FX rate indicator · Pipeline value status bar · Filter chips |
| Workbook tabs | Excel-style at BOTTOM of screen |
| Row click | Opens /deals/:id |
| Bulk edit toolbar | Appears below toolbar on row selection · Hidden for Finance Manager |
| Excel import | One-time wizard in Admin only (/admin/import) |

### Workbook Tab Structure (bottom, Excel-style)

| # | Tab | Notes |
|---|---|---|
| 1 | Pipeline | Default |
| 2 | Closed Deals | |
| 3 | Rev vs Target | Phase 1: deal value + RAG vs target only |
| 4 | Velocity | Stage funnel + stall register |
| 5 | Channels | Lead source × seller heat matrix |
| 6 | Alliance View ★ | Auto-selected for Alliance Manager on login; auto-filtered AWS/Dual |

### States
1. Default view — full grid with all columns
2. Filters active — Stage 3+ and AWS/Dual chips applied
3. Rows selected — bulk edit toolbar visible
4. Finance Manager read-only view — limited columns, no bulk toolbar, cells disabled
5. Alliance View tab — ACE-specific columns, pre-filtered AWS/Dual

---

## WF2 — Deal Detail (/deals/:id)

### Q&A Decisions

| Decision | Choice |
|---|---|
| Sub-section layout | Vertical tabs on the LEFT, content panel on the RIGHT |
| Page header | Minimal — deal name + back arrow |
| Back navigation | Back arrow top-left → /pipeline |
| Field editing | Edit mode toggle — switches whole page to edit mode |
| Stage visualisation | Horizontal progress bar (all 5 stages, current highlighted) |
| RACI visibility | Progress bar + RACI panel below for current stage actions |
| Solution Fit score display | Traffic light — Fit / Partial Fit / No Fit + supporting signals listed |
| TCO Session interaction | Structured wizard: Infra → Licences → Services → TCO output |
| TCO Session access | AE / PC / SA: can run · PM / AM / CRO: read-only output |
| Proposal & SOW CTA | Inside Solution Fit tab — unlocks when score ≥ 60 AND TCO ARR populated |
| Proposal & SOW output | Dedicated 9th tab — generated output, quality score, version history (read-only) |
| Approval gate (> SGD 500K) | CTA disabled with tooltip in Solution Fit tab only — no banner or stage badge |

### Vertical Tab Structure — 9 Tabs

| # | Tab | Notes |
|---|---|---|
| 1 | Overview | Core fields + 12 AI read-only fields (6 TCO + 6 Solution Fit) |
| 2 | Stage Timeline | History + RACI + Meeting Summary entry point |
| 3 | AI Q Tree | Discovery accordion — SAP / VMware / GenAI / Data / AMS |
| 4 | Solution Fit ★ | Traffic light · Signals · Proposal & SOW CTA |
| 5 | TCO Session ★ | Wizard: Infra → Licences → Services → Output |
| 6 | Documents | AI extraction — uploaded SOW / PO / Handover |
| 7 | Revenue · O2R | Milestones — KPI cards + monthly schedule |
| 8 | Linked Records | Dual-funded indicator dot |
| 9 | Proposal & SOW ★ | Generated output — draft, quality score, version history (read-only) |

*Tabs 3–5: presales discovery workflow. Tab 9: post-generation output view only — no trigger logic.*

### Overview Tab — 12 AI Read-Only Fields

**TCO Creator (6 fields):**
| Field | Description |
|---|---|
| TCO ARR (SGD) | Annual recurring revenue estimate |
| 3-Year Savings | Projected 3-year savings vs current state |
| Current Infra Cost | Customer's stated current infrastructure spend |
| Migration Cost Est. | Professional services + migration effort |
| Net Savings (3yr) | 3-year savings minus migration cost |
| Recommended Program | MAP / MMP / None |

**Solution Fit (6 fields):**
| Field | Description |
|---|---|
| Fit Status | Fit / Partial Fit / No Fit |
| Primary Solution Area | Highest-scoring: SAP / VMware / GenAI / Data / AMS |
| Areas Matched | Count of areas with positive fit signals |
| Confidence | High / Medium / Low |
| Signals Confirmed | Confirmed pain points out of total available |
| Last Evaluated | Timestamp of most recent evaluation |

---

## WF3 — Dashboard (/dashboard)

### Q&A Decisions

| Decision | Choice |
|---|---|
| Roles with distinct views | All 6: CRO · AE · SDR · Presales Manager · Finance Manager · Alliance Manager |
| Content structure | KPI cards across top, charts and tables below — consistent shell |
| Morning Brief — AE | Haiku daily brief — dismissible card above KPI cards · 06:00 SGT |
| Morning Brief — CRO | Sonnet weekly review — dismissible card · Monday 07:00 SGT |
| Morning Brief — other roles | No card — SDR / Finance / PM / AM do not receive |
| Presales Manager view | Workload-first — PC/SA capacity table dominates |
| Finance Manager view | Split layout: left O2R receipt tracker · right invoice status + FX rate |
| Alliance Manager view | Two-column: left ACE opportunity status · right funding breakdown |

### Widget Sets by Role

| Role | Key Widgets |
|---|---|
| SDR | Lead volume by stage (L1/L2/L3), ICP score distribution, graduation rate, Q tree completion |
| AE | Own pipeline value, deals by stage, weighted forecast, velocity, win/loss, revenue vs personal target, TCO sessions ★, proposals generated ★, solution fit scores ★ |
| PC / SA | Assigned deals by stage, presales cycle time, Q tree completion, proposal draft status ★ |
| Presales Manager | Full team pipeline, PC/SA workload, SA activation rate, proposal pipeline ★, avg solution fit ★ |
| Alliance Manager | Co-sell pipeline, ACE status, MAP/MMP utilisation, dual-funded breakdown, avg TCO ARR ★ |
| CRO | Full-funnel KPI: lead → deal → closed, team vs target, forecast accuracy, top deals at risk, AI weekly review digest ★ |
| Finance | Revenue milestone schedule, O2R receipt tracking, invoice status, pipeline value SGD, FX rate indicator |

---

## WF4 — Demand Gen Lead Grid (/demand-gen/leads)

### Q&A Decisions

| Decision | Choice |
|---|---|
| Layout | Spreadsheet-first grid (same shell as Pipeline) |
| Stage visualisation | Mini 4-stage progress bar per row |
| ICP score | 1–5 star rating (AI-enriched via Apollo.io) |
| N/T/ICP signals | Three signal dots — green/gray |
| Q tree session | Lead row click → Lead detail page with live Q tree |
| MQL Queue tab | REMOVED — promoted to sidebar nav as "Graduation Queue" |
| Graduation Queue | Sidebar nav under Demand Gen — badge shows count of ready leads |
| /demand-gen/graduation | Full-width grid · MQL Ready filter · Assignment + Approve in toolbar |

### Default Grid Columns
Lead ID · Company · Contact/Role · CTY · GTM Motion · Source Type · ICP ★ · Lead Status bar · N·T·ICP signals · Meeting? · SDR · Attempts · Last Activity

### MQL Gate — 5 Criteria
1. Meeting Booked = Yes
2. DM/Influencer Confirmed
3. Pain Point Confirmed = Yes
4. Budget Indicator filled (Aware / Exploring / Confirmed)
5. Timeline filled (Within 3 months / 3–6 months / 6+ months)

→ Auto-flags MQL Ready → AE + PC assigned on /demand-gen/graduation → human approval → Deal ID created

### /demand-gen/graduation Page
**Auto-filter:** MQL Ready = Yes AND MQL Approved By = null

**Columns:** Lead ID · Company · Contact/Role · GTM Motion · SDR · ICP ★ · N·T·ICP · AE Assigned (dropdown) · PC Assigned (dropdown) · [Approve MQL] button

**Row behaviour:**
- [Approve MQL] enabled only when AE + PC both assigned
- On approval: Lead Status → MQL · Deal ID created · Row removed · Badge decrements
- Toast: "Deal created · D-SG-024 · OCBC Bank → [View Deal]"

---

## RBAC Summary

| Role | Pipeline | Demand Gen | Graduation | Dashboard | Reports | Admin |
|---|---|---|---|---|---|---|
| SDR | — | Full (own) | Own leads | Own (leads) | — | — |
| AE | Full (own) | View | Assign + Approve | Own | Limited | — |
| PC | Own deals | — | — | Own | Limited | — |
| SA | Own (S3+) | — | — | Own | — | — |
| Presales Manager | Full (all) | Full | Full | Team | Team | — |
| Alliance Mgr | Full | — | — | Alliance | Alliance | — |
| CRO | Full | Full | Full | Full | Full | — |
| Finance | Read only | — | — | Revenue only | Revenue | FX rates |
| Admin | Full | Full | Full | Full | Full | Full |

---

## Notification Architecture

**Layer 1 — Notifications Centre (/notifications):**
Persistent log · filter by type · mark as read · 90-day retention · unread badge on bell

**Layer 2 — AI Insights Panel (380px):**
Slide-in right panel · contextual to current page · async from Bedrock · session-persistent state

**Non-suppressible events (6):**
Stage transition · Stall alert · MQL approved · PO received · Milestone overdue · Extraction complete

**AI comms (SOP-governed):**
Morning brief (AE · Haiku daily) · CRO weekly review (Sonnet) · Deal Won (MS Teams webhook) · Handover brief (Sonnet) · Proposal Draft Ready · Whitespace Opportunity

---

## Wireframes Backlog

| # | Screen | Route | Status |
|---|---|---|---|
| 5 | Reports · Velocity | /reports/velocity | Decided ✓ |
| 5b | Reports · Revenue vs Target | /reports/revenue-target | Decided ✓ (Phase 1) |
| 6 | Reports · Channels | /reports/channels | Decided ✓ |
| 7 | Reports · Pipeline Health | /reports/pipeline-health | Decided ✓ |
| 8 | Reports · Lead-to-Close Funnel | /reports/funnel | Decided ✓ |
| 9 | Reports · White Space | /reports/white-space | Decided ✓ |
| 10–16 | Admin routes | /admin/* | Decided ✓ |
| 17 | Command Palette | ⌘K overlay | Decided ✓ |

*See wireframe-decisions-wf5-17.md for full specs on WF5–WF17.*
