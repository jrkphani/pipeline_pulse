# Pipeline Pulse — Design Brief
> **v2.0** | Aligned to BRD v6.1 / SRS v4.2 | April 2026

---

## Goal

You are an industry-veteran SaaS product designer specialising in enterprise sales operations tools. You understand that **adoption failure in CRM tools is almost always a cognitive friction failure, not a training failure**.

The single most important design constraint: **every data-entry and data-consumption screen must feel like working in Excel**. This is not aesthetic preference — it is the primary adoption mechanism.

---

## Inspiration

The clean simplicity, ease of navigation, and snappiness of [https://zed.dev](https://zed.dev) — information-dense, instant, keyboard-first.

---

## Aesthetic Guidelines

- **Professional Trust with Approachable Intelligence** — enterprise-grade aesthetics, daily usability
- **Data Clarity as First Principle** — complex pipeline insights made instantly understandable
- **Precision Through Visual Hierarchy** — Purple `oklch(0.606 0.25 292.717)` + semantic status colors
- **Operational Efficiency Focus** — every element serves a revenue workflow purpose; no decorative bloat
- **Information Density Over Whitespace** — users expect to see many rows at once (Excel users)
- **Motion with Purpose** — subtle micro-interactions only; no gratuitous animation
- **Status-Driven Color Psychology** — Green/Yellow/Red/Blocked as **cell backgrounds** in grids, never floating badges
- **Typography for Scanning** — Inter font, optimised for rapid data scanning
- **Extraction Feedback** — visual feedback systems for AI document extraction progress

---

## Target Platforms

| Platform | Size | Scope |
|---|---|---|
| Desktop (Primary) | 1024px–1920px | Full grid interaction, all features, inline editing |
| Tablet | 768px–1024px | Read-only or limited edit, icon-only sidebar |
| Mobile | <768px | **Read-only KPI metrics + deal health summary ONLY — no grid editing** |
| XL Monitor | >1440px | Extended column visibility, side panel open alongside full grid |

---

## Spreadsheet-First Mandate

> **This is a non-negotiable design constraint. Violation is a P1 design defect.**

The primary reason Zoho CRM failed at 1CloudHub was not process — it was cognitive friction. Users who live in Excel will not change their mental model for a tool that replaces rows with cards, inline editing with modals, and Tab-to-next-cell with Save buttons.

### Mandatory Grid Behaviours (every data view)

| Behaviour | Requirement |
|---|---|
| Inline cell editing | Single click activates edit mode — no modal opens |
| Tab / Shift+Tab | Move between editable cells |
| Enter | Confirm and move down |
| Escape | Cancel edit |
| Arrow keys | Navigate cells when not in edit mode |
| Ctrl+C / Ctrl+V | Copy-paste including from external Excel |
| Ctrl+D | Fill down |
| Ctrl+A | Select all visible rows |
| Ctrl+F | In-grid search (filters rows as you type) |
| Dropdown cells | Open on click or Alt+Down; type-to-filter |
| Column freeze | Deal ID, Account Name, Opportunity Name always visible |
| Column resize/reorder/show-hide | Exactly like Excel |
| AutoFilter | On every column header (arrow icon on hover) |
| Row striping | Alternating background for readability |
| Health status | Coloured cell backgrounds — **never floating badges** |
| Status bar | Row count, selection count, sum/avg of selected numeric cells |
| Compact row height | 28–32px — never card-style |
| New row | Tab from last cell OR "+ Add Row" at grid bottom |

### Prohibited UI Patterns

| Prohibited | Why | Allowed Alternative |
|---|---|---|
| Full-page modal for create/edit | Context switch breaks flow | Inline editing; side panel for complex fields |
| Kanban/card view | Hides density; **removed from scope entirely** | Grid only |
| Multi-step wizard for deal creation | Feels like an app, not a spreadsheet | Direct row entry in grid |
| Pagination | Breaks "see everything" Excel model | Virtual scrolling |
| Mandatory fields blocking save | Friction gates | Soft validation warnings, partial save with prompts |
| Separate view/edit modes | Doubles cognitive load | Always editable inline |

### Side Panel (not Modal)
For fields needing more space (Deal Notes, Stage Blocker, Document Upload, AI Review): a **480px side panel slides in from the right** keeping the grid visible and scrollable. The user never loses their place.

### Tab Navigation (Workbook Model)
Navigation tabs mirror Excel sheet tabs at the **bottom of the screen** (confirmed UX decision).

| Tab | Equivalent Excel Sheet |
|---|---|
| Pipeline | Master Deal Tracker |
| Closed Deals | Closed Deals Log |
| Revenue vs Targets | Revenue vs Targets |
| Velocity | Velocity Dashboard |
| Channels | Channel Dashboard |
| Alliance View ★ | Alliance Deal Tracker |

---

## App Overview

Pipeline Pulse is a **purpose-built, standalone CRM and revenue intelligence platform** for 1CloudHub's B2B SaaS sales operations. It replaces `1CH_Unified_Deal_Tracker.xlsx` and operates as a **System of Action** — not a system of record — driving workflow decisions across the full sales and delivery lifecycle.

### Success Metrics
- **Excel Elimination**: 100% of active pipeline managed natively within 60 days of go-live
- **Dual-Entry Reduction**: ≥80% of deal fields auto-populated via AI document ingestion
- **Adoption by Familiarity**: ≥90% of users rate interface as "feels like Excel" in usability testing
- **Real-time Pipeline Visibility**: All active deals visible with stage, health, velocity in <3s
- **AWS Funding Compliance**: All MAP/MMP funding fields tracked and flagged natively

---

## Feature List

### Core Features
1. **Pipeline Grid** — spreadsheet-first deal management, inline editing, bulk operations, AG Grid Community
2. **AI Document Ingestion** — upload SOW/PO/Handover → extraction review grid → save to deal
3. **Excel Migration Import** — one-time migration wizard from `1CH_Unified_Deal_Tracker.xlsx`
4. **O2R Tracking** — four-phase health tracking with velocity engine
5. **Deal Velocity & Stall Detection** — stage SLA enforcement, stall ranking, dwell analytics
6. **Currency Standardisation** — multi-currency input, SGD normalisation, FX rate display
7. **Closed Deals Log** — read-only grid of archived won/lost deals
8. **Revenue vs Targets** — grid with summary rows, quarterly booked vs target
9. **Velocity Dashboard** — stage conversion funnel, SLA compliance charts
10. **Channel Dashboard** — lead source efficiency, seller performance pivot grid

### Supporting Features
11. **Authentication & Role Management** — JWT login, RBAC, 9 roles
12. **Global Search & Advanced Filtering** — Command Palette (⌘K) + in-grid Ctrl+F
13. **Reference Data Management** — admin-only editable lookup tables
14. **Bulk Operations Toolbar** — multi-row select, bulk stage update, bulk archive, bulk export
15. **Document Upload & Side Panel** — file attachment, extraction progress via SSE, review interface
16. **Demand Gen Lead Grid** — L1/L2/L3 pipeline, ICP scoring, Q tree, graduation gate
17. **Dashboard** — role-scoped KPI cards, morning brief, AI insights
18. **Admin Console** — user management, SOPs, model config, catalog, templates

---

## Design Brief Template (per Feature)

```markdown
## Feature Name: [Insert Feature Name]

### Screen(s): [List primary screens]

### User Stories:
* As a [role], I want to [action] so that [benefit].

### Key Requirements:
* [Functions the feature must perform]
* [Data displayed or captured]
* [FR-GRID or FR-DOCAI requirements that apply]

### UX Considerations:
* **Spreadsheet-First Compliance:** [How mandatory grid behaviours are enforced]
* **Visual Hierarchy:** [Health as cell backgrounds, not badges]
* **Side Panel Usage:** [What opens side panel vs stays inline]
* **Device Scope:**
  - Mobile (<768px): Read-only KPI cards only
  - Desktop (1024px+): Full interaction
* **Accessibility:** WCAG 2.1 AA, AG Grid ARIA patterns, keyboard navigation
* **Loading States:** AG Grid skeleton rows; SSE progress for extraction
* **Empty States:** Grid empty state with contextual "+ Add" CTA; keep it brief
* **Error Handling:** Cell validation errors inline; extraction errors with retry
* **Performance:** Virtual scroll for 50,000+ rows; React.memo for charts
```

---

## Style Guide Reference

- **Primary Purple**: `oklch(0.606 0.25 292.717)` (light) / `oklch(0.541 0.281 293.009)` (dark)
- **Typography**: Inter font, design token-based sizing (`--pp-font-size-*`)
- **Spacing**: `--pp-space-*` tokens (4px increments: 4px → 64px)
- **Status Colors**: Cell background tints in grids; border accents on metric cards
- **Component Library**: AG Grid Community (grids) + shadcn/ui (panels, cards, toasts) + Recharts (analytics)
- **Animation**: `--pp-duration-*` tokens (150ms–300ms) with `cubic-bezier(0.4, 0, 0.2, 1)` easing

### Enterprise Patterns
- **Data Grids**: AG Grid Community — 28–32px compact rows, sticky headers, virtual scroll, inline edit
- **Grid Health Columns**: Cell background colours — never floating badges
- **Grid Status Bar**: Row count + selected count + sum/avg — always visible
- **Side Panel**: 480px, slides from right, grid remains scrollable behind
- **AI Insights Panel**: 380px, distinct from Side Panel, async from Bedrock
- **Command Palette**: 640px centred overlay, ⌘K trigger
- **Tab Navigation**: Excel sheet tabs at **bottom** of content area
- **Charts**: Recharts — analytics/dashboard tabs **only** (never on Pipeline or Closed Deals)
