# Pipeline Pulse — Codebase Compliance Audit

## Your Role

You are a senior engineer conducting a structured compliance audit of the Pipeline Pulse frontend. Your job is to read the actual source files, compare them against the documented standards, and produce a prioritised report. You are not generating code — you are generating findings.

This audit covers **six compliance domains**. Work through each domain completely before moving to the next.

---

## Inputs — Read These First

Before scanning any source file, read the following docs in full. They are the source of truth:

```
docs/implementation-guide-v2.md     ← §2 Tooling, §11 A11y, §12 Iconography, §13 Usage
docs/compliance-checklist-v2.md     ← All audit checklists (frontend, backend, DB, cross-cutting)
docs/tech-stack-v2.md               ← MSW rules, package constraints, forbidden packages
docs/brand-style-guide-v3.md        ← Colour system, z-index, component specs
```

---

## Source Paths to Audit

```
frontend/src/
├── components/
│   ├── layout/          AppShell.tsx, TopBar.tsx, AppSidebar.tsx
│   ├── grid/            PipelineGrid.tsx + all subdirectories
│   ├── ui/              All files
│   ├── command-palette/ All files
│   ├── deal-detail/     All files
│   ├── docai/           All files
│   ├── leads/           All files
│   └── common/          All files
├── pages/
│   ├── pipeline/        All files
│   ├── admin/           All files  ← HIGH PRIORITY — known violation source
│   ├── leads/           All files
│   └── [all others]     All files
├── hooks/               All .ts files
├── lib/
│   ├── api-client.ts
│   ├── ag-grid/         All files
│   └── xlsx/            All files
├── mocks/               handlers.ts + all mock-*.ts files
├── stores/              All files
└── styles/tokens/       design-tokens.css
```

Also check:
```
frontend/.stylelintrc.json         (may not exist yet)
frontend/eslint.config.js
frontend/package.json
frontend/tailwind.config.js
frontend/vitest.config.ts
frontend/src/test/setup.ts         (may not exist yet)
```

---

## Domain 1 — Tooling Enforcement

**Reference:** `docs/implementation-guide-v2.md` §2

Check the following. For each item, state: EXISTS / MISSING / PARTIAL with file path evidence.

1. **stylelint config** — does `.stylelintrc.json` exist at `frontend/`? If yes, does it contain `declaration-property-value-disallowed-list` blocking `#hex`, `hsl()`, and `rgb()` on colour properties? Does it correctly exempt `design-tokens.css` and `index.css`?

2. **ESLint `no-restricted-syntax` rule** — does `eslint.config.js` contain a rule blocking hardcoded colour values in `style={{}}` JSX props? Show the selector if present.

3. **lint:css script** — does `package.json` have a `"lint:css"` script running `stylelint`? Does the main `"lint"` script invoke both ESLint and stylelint?

4. **Pre-commit hook** — does `.husky/pre-commit` or `lint-staged` config exist? Does it run both linters?

5. **stylelint in devDependencies** — is `stylelint` and `stylelint-config-standard` in `package.json` devDependencies?

---

## Domain 2 — Design Token Adherence

**Reference:** `docs/implementation-guide-v2.md` §1, §2 and `docs/compliance-checklist-v2.md` §1.3

Grep every `.tsx`, `.ts`, and `.css` file in `frontend/src/` (excluding `design-tokens.css` and `index.css`) for the following patterns. For each match, record: **file path**, **line number**, and **the offending line**.

### 2a — Hardcoded hex colours in `style={{}}` props
Search for: `style=\{\{[^}]*color:\s*['"]#`

### 2b — Hardcoded `hsl()` in `style={{}}` props
Search for: `style=\{\{[^}]*:\s*['"]hsl\(`

### 2c — Hardcoded hex or `hsl()` in CSS files (outside the two exempted files)
Search `frontend/src/styles/**/*.css` (exclude `design-tokens.css`, `index.css`) for:
- Any line matching `:\s*#[0-9a-fA-F]{3,8}`
- Any line matching `:\s*hsl\(`

### 2d — Hardcoded pixel spacing in `style={{}}` props
Search for: `style=\{\{[^}]*:\s*['"][0-9]+px` — flag any that should be using `var(--pp-space-*)`

Produce a **deduplicated table** of all findings:

| File | Line | Violation | Offending Code |
|---|---|---|---|

---

## Domain 3 — AG Grid Compliance

**Reference:** `docs/implementation-guide-v2.md` §4 and `docs/compliance-checklist-v2.md` §1.4

Read every file in `frontend/src/components/grid/` and every page file that imports `AgGridReact`.

Check each instance for:

### 3a — Enterprise imports (P0 — build-breaking)
Search the entire `frontend/src/` tree for any import from `@ag-grid-enterprise`. Report every match as a **critical** finding.

### 3b — SGD core column pinning (FR-GRID-006)
In `PipelineGrid.tsx` (and any other grid definition files), find the column definition for `sgd_core`. Verify: `pinned: 'left'` AND `lockPinned: true` are both present. Report if either is absent or if the field is not present at all.

### 3c — Virtual scroll vs pagination
Search all grid option objects for `pagination: true` or `paginationPageSize`. Report every match.

### 3d — Health status as badge vs cell class
Search all grid column definitions for any `cellRenderer` on a health/status field that renders a React badge component (look for imports of badge-like components used inside a cellRenderer). Correct pattern is `cellClassRules`.

### 3e — Status bar configuration
For each `AgGridReact` instance, check whether `statusBar` prop is configured with `agTotalAndFilteredRowCountComponent`, `agSelectedRowCountComponent`, and `agAggregationComponent`. Report any grid missing the status bar.

### 3f — SheetJS inline usage
Search all files in `frontend/src/` **outside** of `frontend/src/lib/xlsx/` for:
- `import * as XLSX from 'xlsx'`
- `import XLSX from 'xlsx'`
- `XLSX.utils.` or `XLSX.writeFile`

Report every match outside the `lib/xlsx/` directory.

---

## Domain 4 — Authentication & Security

**Reference:** `docs/compliance-checklist-v2.md` §1.6

### 4a — localStorage for tokens (P0)
Search the entire `frontend/src/` tree for:
- `localStorage.setItem`
- `localStorage.getItem`
- `sessionStorage.setItem`
- `sessionStorage.getItem`

Report every match with file path and line.

### 4b — fetch calls without `credentials: 'include'`
Search for `fetch(` calls anywhere in `frontend/src/` that do NOT include `credentials: 'include'`. Specifically look in `lib/api-client.ts` and any other file making direct `fetch()` calls.

### 4c — Hardcoded secrets
Search for any string literals matching: `apiKey`, `api_key`, `secret`, `password`, `token` assigned to a constant with a non-empty string value (not an env var reference).

---

## Domain 5 — Accessibility & Keyboard

**Reference:** `docs/implementation-guide-v2.md` §11

### 5a — Notifications bell ARIA
Read `frontend/src/components/layout/TopBar.tsx`. Find the bell icon button. Check for:
- `aria-label` attribute (must include unread count in the string)
- `aria-haspopup` attribute (must be `"dialog"`, not `true`)
- `aria-live="polite"` on the unread count badge span
- `Bell` icon has `aria-hidden="true"`

Report each missing attribute as a separate finding.

### 5b — `useGlobalShortcuts` hook existence and usage
- Does `frontend/src/hooks/useGlobalShortcuts.ts` (or similar) exist?
- Does it contain the `isEditing` guard clause (checking for `INPUT`, `TEXTAREA`, `contentEditable`, and AG Grid's `ag-cell-edit-input`)?
- Is it imported and called in `AppShell.tsx` as the single registration point?
- Search for any OTHER file in `frontend/src/` that calls `window.addEventListener('keydown'` — report every match that is NOT inside `useGlobalShortcuts`.

### 5c — AG Grid ARIA properties
In every `AgGridReact` instance, check for `onGridReady` callback that calls `setGridAriaProperty('label', ...)` and `setGridAriaProperty('rowcount', ...)`. Report any grid missing this.

### 5d — Side panel focus management
In any file using `SheetContent` (shadcn/ui side panel), check for `onOpenAutoFocus` and `onCloseAutoFocus` callbacks. Report any `SheetContent` missing both.

### 5e — Icon buttons without aria-label
Search `frontend/src/` for `<button` or `<Button` elements that contain a `lucide-react` icon import and render it as the **only child** (i.e., icon-only buttons) without an `aria-label` prop. These are screen reader traps.

---

## Domain 6 — Iconography

**Reference:** `docs/implementation-guide-v2.md` §12

### 6a — Unicode glyphs for UI affordances (Admin pages — known violation)
Search ALL files in `frontend/src/pages/admin/` and `frontend/src/components/` for:
- `&#10003;` or `&#10007;` or `&#9654;` or `&#8594;` (HTML entities in JSX)
- `✓` or `✗` or `→` or `▶` or `✅` or `❌` or `⚠️` as JSX text content (not inside a string used for non-UI purposes)
- Any raw Unicode escape: `\u2713`, `\u2717`, `\u25BA`, `\u2192`

Report every match with file path and line.

### 6b — lucide-react icon sizing compliance
Spot-check 5 files that use `lucide-react` icons. Verify that:
- TopBar icons use `size={20} strokeWidth={2}`
- Button icons use `size={16} strokeWidth={2}`
- Grid cell action icons use `size={16} strokeWidth={1.5}`

Report any deviation from the sizing convention in `docs/implementation-guide-v2.md` §12.3.

### 6c — Non-lucide icon systems
Search `frontend/src/` for imports from:
- `@heroicons/react`
- `react-icons`
- `@fortawesome`
- Any other icon library that is not `lucide-react`

Report every match.

---

## Domain 7 — MSW Mocking Strategy

**Reference:** `docs/tech-stack-v2.md` (MSW section)

### 7a — MSW handler structure
Read `frontend/src/mocks/handlers.ts` (or equivalent). Check:
- Are handlers split by domain into separate files (`opportunities.ts`, `docai.ts`, `qtree.ts`, etc.) or are they all in one flat file?
- Report the current structure vs the required `src/mocks/handlers/` subdirectory pattern.

### 7b — SSE stream simulation
Search `frontend/src/mocks/` for any handler that intercepts the DocAI SSE endpoint (`/api/v1/documents/stream/` or similar). If found: does it use a `ReadableStream` with `setTimeout` delays between stages? If not found: flag as missing.

### 7c — Q Tree upload wizard handlers
Search `frontend/src/mocks/` for handlers covering the 4-step Q Tree upload flow (`/api/v1/admin/q-tree/parse`, `metadata`, `publish`). Flag any missing steps.

### 7d — Hardcoded state mocks in components
Search `frontend/src/components/` and `frontend/src/pages/` for `useState` calls whose initial value is an array or object with 3+ properties that appears to be seeding fake API data (look for keys like `id:`, `name:`, `account_name:`, `stage:` in the initial state). These are potential replacements for MSW that violate the mocking rule.

### 7e — Vitest MSW integration
Read `frontend/src/test/setup.ts` (or `vitest.setup.ts`). Check:
- Does it call `server.listen({ onUnhandledRequest: 'error' })`?
- Does it call `server.resetHandlers()` in `afterEach`?
- Does it call `server.close()` in `afterAll`?
- Does `vitest.config.ts` include `setupFiles` pointing to this file?

---

## Report Format

Produce a single structured Markdown report with this exact structure:

```markdown
# Pipeline Pulse — Compliance Audit Report
**Date:** [today]
**Auditor:** Claude Code
**Scope:** frontend/src/ + config files

---

## Executive Summary

| Domain | Status | Critical | High | Medium | Low |
|---|---|---|---|---|---|
| 1. Tooling Enforcement | 🔴 / 🟡 / 🟢 | N | N | N | N |
| 2. Design Token Adherence | ... | | | | |
| 3. AG Grid Compliance | ... | | | | |
| 4. Auth & Security | ... | | | | |
| 5. Accessibility & Keyboard | ... | | | | |
| 6. Iconography | ... | | | | |
| 7. MSW Mocking Strategy | ... | | | | |
| **TOTAL** | | | | | |

**Overall Status:** [PASS / NEEDS WORK / FAILING]

---

## Domain 1 — Tooling Enforcement
### Findings
[For each check: EXISTS ✅ / MISSING ❌ / PARTIAL ⚠️ with evidence]

### Required Actions
[Numbered list of specific changes needed, with exact file paths]

---

## Domain 2 — Design Token Adherence
### Findings
[Full table of violations]

### Required Actions

---

## Domain 3 — AG Grid Compliance
### Findings
### Required Actions

---

## Domain 4 — Auth & Security
### Findings
### Required Actions

---

## Domain 5 — Accessibility & Keyboard
### Findings
### Required Actions

---

## Domain 6 — Iconography
### Findings
### Required Actions

---

## Domain 7 — MSW Mocking Strategy
### Findings
### Required Actions

---

## Priority Fix Queue

Ranked by severity (Critical = build-breaking or security risk, High = UX/brand regression, Medium = compliance gap, Low = polish):

| Priority | Severity | Domain | File | Action |
|---|---|---|---|---|
| 1 | Critical | | | |
| 2 | Critical | | | |
...

---

## Files With Zero Violations
[List files that were checked and are fully compliant — gives signal on where the good patterns already exist]
```

---

## Execution Notes

- **Read files, don't assume.** If a file is listed in the audit scope, open and read it before making a finding. Do not infer compliance from filenames.
- **One finding per violation instance.** If the same pattern appears in 12 files, list all 12 — do not collapse into "multiple files".
- **Evidence required.** Every finding must include the file path and either the line number or the offending code snippet (≤3 lines).
- **Distinguish absence from violation.** If a file that should exist (e.g. `.stylelintrc.json`) doesn't exist, that is a MISSING finding, not a violation in existing code.
- **Do not fix during audit.** This pass is read-only analysis. Output the report only. A separate implementation pass will action the findings.
- **Save the report** to `docs/audit-report-[YYYY-MM-DD].md` when complete.
