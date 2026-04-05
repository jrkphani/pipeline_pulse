# Pipeline Pulse Brand Guidelines
> **v3.0** | Aligned to BRD v6.1 / SRS v4.2 / Tech Stack v2.0 | April 2026

---

## 1. Introduction

### 1.1 Brand Philosophy & Core Principles

Pipeline Pulse embodies **precision, clarity, and intelligence** in revenue operations. Priorities:
- **Data Clarity**: Complex insights made instantly understandable — information-dense, not sparse
- **Professional Trust**: Enterprise-grade aesthetics that inspire confidence
- **Operational Efficiency**: Every element serves a purpose in the revenue workflow
- **Spreadsheet Familiarity**: The interface must feel like Excel — that is the primary adoption mechanism
- **Ambient Intelligence**: AI surfaces in context, inline, and without interruption

### 1.2 Target Audience

**Role Roster (9 roles)**:

| Role | Primary Need | Post-Login Landing |
|---|---|---|
| SDR | Lead creation, AI Q tree, ICP scoring | /demand-gen/leads |
| AE / Account Executive | Pipeline grid, minimal data entry | /pipeline |
| Presales Consultant (PC) | Discovery tracking, proposal ownership | /pipeline (own deals) |
| Presales SA | Technical Q tree, Solution Fit review | /pipeline (Stage 3+) |
| Presales Manager | Full team visibility, SA activation | /dashboard |
| AWS Alliance Manager | Co-sell, ACE compliance, funding | /pipeline (Alliance View) |
| CRO / Sales Leadership | Full-funnel KPI, AI weekly review | /dashboard |
| Finance Manager | Revenue milestones, O2R, FX | /dashboard |
| System Administrator | User management, SOP governance | /admin/users |

---

## 2. Colour System

### 2.1 Core Brand Colours

#### Primary Purple
- **Light Mode**: `oklch(0.606 0.25 292.717)`
- **Dark Mode**: `oklch(0.541 0.281 293.009)`
- **Usage**: Primary actions, brand presence, key metrics, active tab indicators

#### Background & Surface
- **Light Background**: `oklch(1 0 0)` (Pure white)
- **Dark Background**: `oklch(0.141 0.005 285.823)` (Deep charcoal)

### 2.2 Semantic Colours

#### Deal Health Indicators (Grid Cell Backgrounds)
Health status is expressed as **cell background tints** in grid views — never as floating badges overlaid on data.

- **On Track (Green)**: `oklch(0.6 0.2 142)` — cell bg tint: 10% opacity
- **Minor Issues (Amber)**: `oklch(0.828 0.189 84.429)` — cell bg tint: 15% opacity
- **Critical (Red)**: `oklch(0.577 0.245 27.325)` — cell bg tint: 12% opacity
- **Blocked / Neutral (Gray)**: `oklch(0.552 0.016 285.938)` — cell bg tint: 8% opacity

### 2.3 Data Visualisation Palette (Charts Only)
1. `oklch(0.646 0.222 41.116)` — Orange
2. `oklch(0.6 0.118 184.704)` — Cyan
3. `oklch(0.398 0.07 227.392)` — Blue
4. `oklch(0.828 0.189 84.429)` — Yellow
5. `oklch(0.769 0.188 70.08)` — Gold

### 2.4 Stage Badge Colours

| Stage | Badge Fill | Badge Text |
|---|---|---|
| 1 · New Hunt | `#FAECE7` (coral-50) | `#712B13` (coral-900) |
| 2 · Discovery | `#FAEEDA` (amber-50) | `#633806` (amber-900) |
| 3 · Proposal | `#E6F1FB` (blue-50) | `#0C447C` (blue-800) |
| 4 · Negotiation | `#E1F5EE` (teal-50) | `#085041` (teal-800) |
| 5 · Order Book | `#EAF3DE` (green-50) | `#27500A` (green-900) |

**Stage badge rules**:
- Minimum width: 88px; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: 600
- Used in: pipeline grid Stage column, deal detail horizontal progress bar, pipeline health doughnut chart

### 2.5 Days-in-Stage Health Colours (Text colour on Days in Stage column)
- **< 15 days**: `#3B6D11` (green) — on track
- **15–30 days**: `#854F0B` (amber) — watch list
- **> 30 days**: `#A32D2D` (red) — stalled

> Thresholds are admin-configurable per stage via /admin/reference-data. Only the three colour states are hardcoded.

### 2.6 Funding & Program Badges

| Badge Type | Fill | Text |
|---|---|---|
| Customer | `#F1EFE8` | `#5F5E5A` |
| AWS | `#E6F1FB` | `#0C447C` |
| Dual | `#EEEDFE` | `#3C3489` |
| MAP program | `#E1F5EE` | `#085041` |
| MMP program | `#FAEEDA` | `#633806` |
| POC program | `#FAECE7` | `#712B13` |

### 2.7 Document Section Type Colours (Proposal & SOW)

| Section Type | Colour | Meaning |
|---|---|---|
| Fixed | Red — `#A32D2D` | AI-prohibited; sourced verbatim from S3 SOP bucket |
| Variable | Blue — `#0C447C` | CRM data merge only; no AI generation |
| AI-Drafted | Purple — `#3C3489` | Sonnet/Opus generation |
| AI + Variable | Amber — `#854F0B` | Haiku narrative frame + CRM values interpolated |

### 2.8 Audit Diff Colours (Admin Routes)
- **Removed value**: `#A32D2D` text with strikethrough
- **Added value**: `#3B6D11` text — no decoration
- **Diff row background**: Removed = 8% red tint; Added = 8% green tint

### 2.9 RAG Status Colours (Revenue vs Target)

| Status | Threshold | Colour |
|---|---|---|
| Red | < 70% of target | `oklch(0.577 0.245 27.325 / 0.15)` |
| Amber | 70–90% of target | `oklch(0.828 0.189 84.429 / 0.15)` |
| Green | ≥ 90% of target | `oklch(0.6 0.2 142 / 0.12)` |

---

## 3. Typography

### 3.1 Font Stack
```css
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono: "JetBrains Mono", "SF Mono", Monaco, monospace;
```

### 3.2 Type Scale

| Usage | Size | Weight |
|---|---|---|
| H1 (Dashboard) | 3rem | 700 |
| H2 | 2.25rem | 700 |
| H3 | 1.875rem | 600 |
| UI Large (nav) | 1.125rem | 500 |
| UI Default (controls) | 0.875rem | 400 |
| UI Small (captions, badge text) | 0.75rem | 400 |
| Grid Cell Text | 0.8125rem (13px) | 400 |
| Grid Header | 0.75rem (12px) | 600, uppercase, letter-spacing 0.05em |
| Metric Display (KPI cards) | 2.5rem | 600 |
| Command Palette Input | 1rem | 400 |

---

## 4. Spacing & Layout

### 4.1 Breakpoints
- **Mobile**: <768px — Read-only KPI metric cards + bottom navigation bar only. No grid editing.
- **Tablet**: 768px–1024px — Read-only grid, icon-only sidebar
- **Desktop**: 1024px–1440px — Full grid interaction, all features
- **XL Desktop**: >1440px — Side panel can remain open alongside full grid

### 4.2 Key Widths
- **Sidebar**: 280px (collapses to 64px icon-only; bottom nav on mobile)
- **Side Panel** (deal detail / admin edit): **480px**, slides in from right
- **AI Insights Panel**: **380px**, slides in from right (distinct from Side Panel)
- **Command Palette**: 640px wide, centred overlay

### 4.3 Application Shell
```
┌─────────────────────────────────────────────────────────────────────┐
│  TopBar (64px) — Logo · ⌘K pill · Notifications bell · User avatar │
├──────────┬──────────────────────────────────────────────────────────┤
│ Sidebar  │  Content Area (fluid)                                    │
│ (280px)  ├──────────────────────────────────────────────────────────┤
│          │  [Tab bar 40px — BOTTOM of screen for Pipeline section]  │
│ Dashboard│  ┌──────────┬────────────┬─────────┬──────┬────────────┐ │
│ Demand   │  │Pipeline ●│Closed Deals│Rev/Tgt  │Vel.  │Alliance ★  │ │
│   Gen    │  └──────────┴────────────┴─────────┴──────┴────────────┘ │
│ Pipeline │  [Grid / Chart Content]                                  │
│ Reports  │                                                          │
│ Admin    │                                                          │
└──────────┴──────────────────────────────────────────────────────────┘
```

### 4.4 Workbook Tab Structure (bottom, Excel-style)

| # | Tab | Notes |
|---|---|---|
| 1 | Pipeline | Default |
| 2 | Closed Deals | |
| 3 | Rev vs Target | Phase 1: deal value + RAG vs target |
| 4 | Velocity | Stage funnel + bottleneck chart |
| 5 | Channels | Lead source × seller heat matrix |
| 6 | Alliance View ★ | Auto-selected for Alliance Manager on login |

### 4.5 Deal Detail Vertical Tabs (/deals/:id)

| # | Tab | Notes |
|---|---|---|
| 1 | Overview | Core fields + 12 AI read-only fields (6 TCO + 6 Solution Fit) |
| 2 | Stage Timeline | History + RACI + Meeting Summary entry point |
| 3 | AI Q Tree | Discovery accordion — SAP / VMware / GenAI / Data / AMS |
| 4 | Solution Fit ★ | Traffic light · Signals · Proposal & SOW CTA (unlocks at score ≥ 60 + TCO populated) |
| 5 | TCO Session ★ | Structured wizard: Infra → Licences → Services → Output |
| 6 | Documents | AI extraction — SOW / PO / Handover uploads |
| 7 | Revenue · O2R | Milestones — KPI cards + monthly schedule |
| 8 | Linked Records | Dual-funded indicator dot |
| 9 | Proposal & SOW ★ | Generated output — draft, quality score, version history (read-only) |

---

## 5. Component Specifications

### 5.1 AG Grid Theme (Pipeline Pulse Custom Theme)

```css
.ag-theme-pp {
  --ag-row-height: 30px;                    /* Compact — matches Excel default */
  --ag-header-height: 36px;
  --ag-cell-horizontal-padding: 8px;
  --ag-odd-row-background-color: var(--pp-color-neutral-50);
  --ag-row-hover-color: var(--pp-color-primary-50);
  --ag-selected-row-background-color: oklch(var(--pp-color-primary-500) / 0.08);
  --ag-header-background-color: var(--pp-color-neutral-100);
  --ag-font-family: "Inter", sans-serif;
  --ag-font-size: 13px;
  --ag-border-color: var(--pp-color-neutral-100);
}
```

#### Grid Cell Health Classes
```css
/* Applied via AG Grid cellClassRules — NEVER use StatusBadge inside grid cells */
.pp-cell-health-green   { background-color: oklch(0.6 0.2 142 / 0.10); }
.pp-cell-health-amber   { background-color: oklch(0.828 0.189 84.429 / 0.15); }
.pp-cell-health-red     { background-color: oklch(0.577 0.245 27.325 / 0.12); }
.pp-cell-health-blocked { background-color: oklch(0.552 0.016 285.938 / 0.08); }
```

#### Grid Status Bar
```
┌────────────────────────────────────────────────────────────────┐
│  Rows: 47   │   Selected: 3   │   Deal Value Sum: SGD 1.24M   │
└────────────────────────────────────────────────────────────────┘
```

### 5.2 Stage Badges (CSS)
```css
.pp-badge--stage-1 { background: #FAECE7; color: #712B13; }
.pp-badge--stage-2 { background: #FAEEDA; color: #633806; }
.pp-badge--stage-3 { background: #E6F1FB; color: #0C447C; }
.pp-badge--stage-4 { background: #E1F5EE; color: #085041; }
.pp-badge--stage-5 { background: #EAF3DE; color: #27500A; }
```

### 5.3 Funding Badges (CSS)
```css
.pp-badge--customer { background: #F1EFE8; color: #5F5E5A; }
.pp-badge--aws      { background: #E6F1FB; color: #0C447C; }
.pp-badge--dual     { background: #EEEDFE; color: #3C3489; }
.pp-badge--map      { background: #E1F5EE; color: #085041; }
.pp-badge--mmp      { background: #FAEEDA; color: #633806; }
.pp-badge--poc      { background: #FAECE7; color: #712B13; }
```

### 5.4 Side Panel (480px)
- Slides in from right — grid remains visible and scrollable behind it
- **Never use modal dialogs** for deal/contact editing — always side panel
- Admin side panels: always have sub-tabs **Edit | Diff View | Version History** (where applicable)

### 5.5 Command Palette (⌘K)
- **Trigger**: Cmd+K (Mac) · Ctrl+K (Win) · tap search icon (mobile)
- **Appearance**: Centred overlay 640px wide
- **Backdrop**: Dimmed — grid/page remains visible
- **Dismiss**: Escape or click outside
- **Results**: Instant as user types, grouped: Deals · Leads · Navigation · Actions
- **Default state**: 5 most recently visited deals/leads shown before typing

### 5.6 Notifications

| Layer | Description |
|---|---|
| Layer 1 | Notifications Centre (/notifications) — persistent log, 90-day retention |
| Layer 2 | AI Insights Panel (380px) — contextual, async from Bedrock |
| Toast | Immediate confirmations (stage change, doc extracted) |

### 5.7 Morning Brief Cards (Dashboard)
- **AE**: Haiku daily brief — dismissible card above KPI cards · 06:00 SGT
- **CRO**: Sonnet weekly review — dismissible card · Monday 07:00 SGT
- **Other roles**: No morning brief card

---

## 6. Z-Index Stack

```css
.ag-grid                      { z-index: 1; }
.pp-tab-bar                   { z-index: 10; }  /* workbook tabs at bottom */
.pp-topbar                    { z-index: 20; }
.pp-sidebar                   { z-index: 30; }
.pp-ai-insights                { z-index: 40; }  /* 380px right panel */
.pp-side-panel                { z-index: 50; }  /* 480px right panel */
.pp-command-palette-backdrop  { z-index: 60; }
.pp-command-palette           { z-index: 70; }
.pp-toast-container           { z-index: 80; }  /* always on top */
```

---

## 7. Admin Console Pattern Library

All `/admin/*` routes apply these universal patterns:

| Pattern | Rule |
|---|---|
| Primary data display | AG Grid Community — always |
| Edit interaction | Side Panel (480px) — no modals, no inline forms |
| Side panel sub-tabs | Edit \| Diff View \| Version History (where applicable) |
| Bulk operations | Only on /admin/users — no other Admin route |

### Route-Specific Patterns

| Route | Grid Columns | Audit Pattern |
|---|---|---|
| /admin/users | Name · Email · Role · Status · Last Login | Timestamp-only |
| /admin/reference-data | Table name · Row label · Current value · Last Updated | Full diff (old→new, red/green) |
| /admin/q-tree | Role × Domain matrix | Version history list |
| /admin/sops | SOP Name · Agent · Version · Last Updated · Updated By | Full diff + rollback with mandatory note |
| /admin/model-config | Use Case · Agent · Default Model · Override · Cost Impact | Timestamp-only |
| /admin/catalog | Solution Name · Version · Last Updated · ARR Potential | Version history list |
| /admin/templates | Template Name · Doc Type · Solution Type · Legal Status · Version | Timestamp per version |

### Legal Status Badge Standard (Templates)
- Required: gray badge (`#F1EFE8` / `#5F5E5A`)
- Pending: amber badge (`#FAEEDA` / `#633806`)
- Approved: green badge (`#EAF3DE` / `#27500A`)

---

## 8. CSS Architecture

```css
/* Component naming */
.pp-component {}
.pp-component__element {}
.pp-component--modifier {}

/* AG Grid overrides */
.ag-theme-pp .ag-header-cell-label { text-transform: uppercase; }
.ag-theme-pp .ag-cell { border-right: 1px solid var(--pp-color-neutral-100); }
```

---

## 9. Component Library

All components built with:
- **AG Grid Community** — all data grids (deal pipeline, closed deals, extraction review, reference data, all admin grids)
- **shadcn/ui** — side panel, metric cards, toasts, buttons, tabs, badges, dialogs (settings/auth only)
- **Tailwind CSS** utilities
- **lucide-react** — all icons (outline, 2px stroke)
- **Recharts** — all chart components in analytics tabs and report routes

---

## 10. Development Checklist

Before shipping any component:
1. Check design system for existing patterns
2. Use semantic colour/spacing variables
3. Confirm grid interaction follows spreadsheet-first mandate
4. Confirm side panel is used for edit operations — no modal dialogs
5. Test in both light/dark modes
6. Verify on desktop breakpoints (tablet and mobile as secondary)
7. Run accessibility audit with axe-core
8. Verify AG Grid keyboard navigation paths
9. Verify Command Palette ⌘K trigger and RLS scope
10. Verify toast, Layer 1 notifications, and Layer 2 AI Insights Panel do not overlap in z-index

---

*Pipeline Pulse Brand Guidelines v3.0 | Last Updated: April 2026*
*Aligned to: BRD v6.1 / SRS v4.2 / Wireframe Decisions v2.0 + Admin WF10–17*
