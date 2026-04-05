# Pipeline Pulse — Wireframe Decisions WF5–WF17 (Admin + Reports)
**Status:** All Decided ✓ | April 2026

---

## WF5 — Reports · Velocity

**Route:** `/reports/velocity`

| Decision | Choice |
|---|---|
| Panel 1 | Stage funnel table — count + value by stage with MoM delta column |
| Panel 2 | Bottleneck bar chart — avg days per stage, highlight stages above SLA |
| Stall register | Inline list below panels — deal name, stage, days stalled, custodian |
| Date range | Rolling 90-day default, picker allows custom range |
| Export | SheetJS xlsx — all three panels in **separate sheets** |

---

## WF5b — Reports · Revenue vs Target

**Route:** `/reports/revenue-target`

| Decision | Choice |
|---|---|
| Phase 1 scope | Deal value (SGD core) + monthly spread across committed close dates + RAG status vs target |
| RAG thresholds | Red < 70% · Amber 70–90% · Green ≥ 90% |
| Finance O2R view | **DEFERRED to Phase 4** — blocked on: Invoice ID, Receipt Date, Milestone %, Payment Terms |
| Target source | Target Management module (FR-TARGET) |

---

## WF6 — Reports · Channels

**Route:** `/reports/channels`

| Decision | Choice |
|---|---|
| Primary chart | Lead Source × Seller heat matrix — cell = deal count + SGD value |
| Cell interaction | Click → `/pipeline` pre-filtered by that Lead Source + Seller combination |
| Row totals | Lead Source total column. Column totals: per-Seller aggregate row |
| Colour scale | Per-row intensity (darkest = highest value in that lead source row) |
| No side panel | Cell click routes to pipeline grid directly — no intermediate panel |

---

## WF7 — Reports · Pipeline Health

**Route:** `/reports/pipeline-health`

| Decision | Choice |
|---|---|
| Stage distribution | Doughnut chart — deal count by stage, coloured by stage badge colours |
| GTM breakdown | Stacked bar chart — SGD value by GTM Motion (SAP / VMware / GenAI / Data / AMS) |
| Weighted forecast | Table — stage × probability weight × SGD value = weighted value |
| Probability weights | Read from Reference Data (/admin/reference-data) — admin-configurable |
| Forecast total | Pinned footer row on table — sum of all weighted values |
| FX rate indicator | TopBar pill shows current SGD rate. All values in SGD core |

---

## WF8 — Reports · Lead-to-Close Funnel

**Route:** `/reports/funnel`

| Decision | Choice |
|---|---|
| Funnel stages | 8-stage: MQL → SQL → Discovery → Proposal → Final Review → Onboarding → Closed Won / Closed Lost |
| Drop-off analysis | Below funnel — per-stage conversion rate + absolute drop count |
| Time-in-stage | Avg days at each stage shown as label beneath each funnel segment |
| Period selector | Quarter / Half-year / Year / Custom |
| Drill-down | Click funnel stage → `/pipeline` pre-filtered to that stage |

---

## WF9 — Reports · White Space

**Route:** `/reports/white-space`

| Decision | Choice |
|---|---|
| Primary view | Account × Solution matrix — cell = current status (Active / Won / Blank) |
| Blank cell = opportunity | Blank cells highlighted — no fill, dashed border |
| Cell interaction | Click → `/pipeline` pre-filtered by Account + Solution. No side panel. |
| Account scope | Accounts with ≥1 closed-won deal in the period |
| Solution columns | SAP Migration · VMware Exit · GenAI · Data · AMS · App Modernisation |

---

## WF10 — Admin · User Management

**Route:** `/admin/users`

| Decision | Choice |
|---|---|
| Grid columns | Name · Email · Role · Status · Last Login · Actions |
| Edit pattern | Side panel (not modal) |
| Role change effect | Takes effect on **next login only** — current session unaffected. Banner shown to admin. |
| Deactivate | Soft delete — user record retained, login blocked |
| Invite | Email invite flow — user self-registers, admin approves role |
| Bulk operation | Bulk deactivate only — no other bulk operations in Admin |

---

## WF11 — Admin · Reference Data

**Route:** `/admin/reference-data`

| Decision | Choice |
|---|---|
| Configurable tables | Stage SLA (days) · Forecast Probability Weights · GTM Motions · Funding Types · Thresholds |
| Default probability weights | NH=10% · QL=25% · Prop=50% · FR=75% · OB=90% · Inv=95% |
| Edit pattern | Side panel — table-specific form fields |
| Audit logging | **Full audit log** — who changed what, old→new value, timestamp. In side panel diff view. |
| Diff view | Previous value in red strikethrough · New value in green |

---

## WF12 — Admin · Q Tree Config

**Route:** `/admin/q-tree`

| Decision | Choice |
|---|---|
| Authoring model | **External authoring only** — admins write `.md` files outside the app, upload via wizard |
| Registry view | Role × Domain grid — cells show questionnaire name + version + last updated |
| Upload Wizard | 1 · Upload `.md` → 2 · Parse & preview → 3 · Set metadata (Role, Domain, version) → 4 · Publish |
| Reorder Wizard | Drag sections (left) + drag questions within section (right) |
| Live Preview | Renders exactly as seen in `/deals/:id` Q Tree session tab |
| Q Tree session UX | **Auto-advance** — selecting answer immediately reveals next question. No Save & Next button. |
| Answer carry-forward | SDR answers fully carry forward to AE/PC on lead graduation. **Zero Re-Entry principle.** |
| Role scoping | One questionnaire per Role × Domain combination |

---

## WF13 — Admin · SOPs

**Route:** `/admin/sops`

| Decision | Choice |
|---|---|
| Grid columns | SOP Name · Agent · Version · Last Updated · Last Updated By · Actions |
| Count | 18 SOP files |
| Side panel | Markdown editor with syntax highlighting + Preview pane (toggle) |
| Diff view | Current vs previous version — green additions, red removals |
| Rollback | Reverts to selected previous version. **Mandatory reason note** required. |
| Audit log | Every change: user + timestamp + old version + new version + change summary |
| Save sequence | Save → version bump → S3 upload → Redis cache flush → audit log entry |

---

## WF14 — Admin · Model Config

**Route:** `/admin/model-config`

| Decision | Choice |
|---|---|
| Grid rows | 25 AI use cases — one row per agent × task combination |
| Columns | Use Case · Agent · Default Model · Override Model · Cost Impact |
| Override options | Haiku / Sonnet / Opus — inline dropdown per row |
| Cost banner | **Always visible at top** — estimated cost vs all-Sonnet baseline. Recalculates on any override change. |
| Save sequence | Save → SOP config table update (PostgreSQL) → Redis cache flush |
| Audit | Timestamp-only (not full diff) — model config is low-stakes operational tuning |

---

## WF15 — Admin · Solution Catalog

**Route:** `/admin/catalog`

| Decision | Choice |
|---|---|
| Count | 8 catalog entries |
| Grid columns | Solution Name · Version · Last Updated · ARR Potential · Actions |
| Side panel fields | Pain Points (one per line) · Qualification Signals · Combination References · ARR Potential (SGD range) |
| Versioning | Each save creates a new version. Previous versions retained. |
| Usage | Read by Solution Fit Agent (scoring) + White Space Agent (upsell mapping) |

---

## WF16 — Admin · Templates

**Route:** `/admin/templates`

| Decision | Choice |
|---|---|
| Grid columns | Template Name · Document Type · Solution Type · Legal Approval Status · Version · Last Updated · Actions |
| Legal Approval Status | Required (gray) / Pending (amber) / Approved (green) |
| Blocking behaviour | Warning banner across `/admin/templates` when any template is Pending |
| Upload flow | Upload DOCX → previous version auto-archived → version bump → new version marked Pending |
| Agent access | Proposal & SOW Agent: only uses templates where Legal Approved = TRUE |

### Legal Status Badge Colours
| Status | Fill | Text |
|---|---|---|
| Required | `#F1EFE8` | `#5F5E5A` |
| Pending | `#FAEEDA` | `#633806` |
| Approved | `#EAF3DE` | `#27500A` |

---

## WF17 — Command Palette (⌘K Overlay)

**Trigger:** `⌘K` (Mac) / `Ctrl+K` (Windows) — global keyboard shortcut + TopBar pill

| Decision | Choice |
|---|---|
| Result sections | Recent Deals (last 5 visited) · Navigate (all app routes) · Actions (context-sensitive) |
| Keyboard shortcuts | `G P` = Go to Pipeline · `G D` = Go to Dashboard · `N D` = New Deal |
| RLS enforcement | Search results scoped to user's visible records (same RLS as grid) |
| Command scoping | Actions differ by role — Finance gets export commands; SDR gets lead-creation actions |
| Default state | Recent Deals shown before any typing |
| Result metadata | Opportunity: name + stage + SGD core + custodian. Account: name + tier + primary AE |

---

## Universal Admin Patterns (All /admin/* Routes)

| Pattern | Rule |
|---|---|
| Primary data display | AG Grid Community — always |
| Edit interaction | Side Panel (480px) — no modals, no inline forms |
| Side panel sub-tabs | Edit \| Diff View \| Version History (where applicable) |
| Bulk operations | Only on /admin/users — no other Admin route |
| Cost banner | Only on /admin/model-config |
| Legal blocking banner | Only on /admin/templates |

---

## Complete Route Registry (33 Routes)

| Route | Access | Description |
|---|---|---|
| /login | Public | JWT login |
| /forgot-password | Public | Password reset request |
| /reset-password | Public | Token-validated reset |
| / | All | Smart redirect by role |
| /dashboard | All | Role-scoped performance view |
| /notifications | All | Persistent notification log |
| /profile | All | User preferences |
| /demand-gen/leads | SDR, AE, PM | Lead grid |
| /demand-gen/leads/:id | SDR, AE, PM | Lead detail + Q tree |
| /demand-gen/graduation | SDR, AE, PM | MQL graduation queue |
| /pipeline | AE, PC, SA, PM, AM, CRO | Active deals workbook |
| /deals/:id | AE, PC, SA, PM | Deal detail (9 vertical tabs) |
| /reports/pipeline-health | AE, PM, CRO | Stage distribution + forecast |
| /reports/revenue | CRO, PM, Finance | Revenue vs target |
| /reports/velocity | CRO, PM | Dwell time + bottleneck |
| /reports/funnel | CRO, PM | Lead-to-close funnel |
| /reports/channels | AE, PM, AM, CRO | GTM × seller matrix |
| /reports/white-space | CRO, PM | Account coverage analysis |
| /reports/saved | AE, CRO, PM | Saved report configs |
| /admin/users | Admin | User management |
| /admin/reference-data | Admin | Lookup table editor |
| /admin/q-tree | Admin | Q tree domain config |
| /admin/integrations | Admin | Apollo.io, Bedrock, Textract settings |
| /admin/fx-rates | Admin, Finance | FX rate management |
| /admin/doc-ai | Admin | DocAI accuracy monitor |
| /admin/import | Admin | One-time Excel migration wizard |
| /admin/system | Admin | Queue health, error feed |
| /admin/sops ★ | Admin | 18 SOP files — markdown editor |
| /admin/model-config ★ | Admin | 25 AI use cases — model assignment |
| /admin/catalog ★ | Admin | Solution Fit product catalog |
| /admin/templates ★ | Admin | Proposal & SOW template library |

*★ Routes added in v6.0 AI architecture patch.*
