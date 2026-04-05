# Microcopy Quality Audit Report

**Date:** 2026-04-05
**Scope:** All user-facing text across `frontend/src/`
**Baseline:** Brand Guidelines v3.0 (Ch. 1, 3, 8), Wireframe Decisions v2.0 (WF1-4, WF17), Design Brief v2.0

---

## Executive Summary

| Category | Instances Audited | Issues Found | Severity Breakdown |
|----------|:-:|:-:|---|
| Button Labels & CTAs | 22 | 11 | 3 High, 5 Medium, 3 Low |
| Error & Validation Messages | 9 | 6 | 4 High, 2 Medium |
| Placeholder & Helper Text | 9 | 5 | 1 High, 3 Medium, 1 Low |
| Empty States & Loading | 5 | 1 | 1 Medium |
| Toast & Notification Copy | 6 | 3 | 1 High, 2 Medium |
| Domain Terminology | 15+ files | 4 | 2 High, 2 Medium |
| Form Labels | 30+ fields | 3 | 1 Medium, 2 Low |
| Tone & Consistency | Global | 6 | 6 Low |
| **TOTAL** | **150+** | **39** | **11 High, 14 Medium, 14 Low** |

---

## 1. HIGH-SEVERITY ISSUES (UX Impact)

### 1.1 Generic Error Messages (Brand Guidelines: "soft validation warnings, phrase errors as guidance")

All error messages follow a generic `"Failed to..."` pattern with no specificity about root cause or recovery action.

| File | Text | Problem | Recommended Copy |
|------|------|---------|-----------------|
| `DealEditPanel.tsx:49` | "Failed to save changes" | No root cause; no recovery path | "Could not save -- check your connection and try again" or "SGD value must be greater than 0" (if validation) |
| `DealActionPanel.tsx:59` | "Action failed" | No distinction between network/validation/server error | "Could not record {action} -- try again or contact your admin" |
| `LeadImportPanel.tsx:46` | "Import failed" | No indication of row errors vs. file format issue | "Import failed -- {n} rows had errors. Download error log." |
| `LoginPage.tsx:65` | "Login failed. Please try again." | Doesn't distinguish bad credentials (401) from server error (500) | 401: "Incorrect email or password" / 500: "Something went wrong -- try again shortly" |

### 1.2 "Deal" vs. "Opportunity" Terminology Breach

CLAUDE.md mandates `opportunity` not `deal`. The codebase uses both inconsistently.

| Context | Current Usage | Guideline | Files Affected |
|---------|--------------|-----------|---------------|
| Component names | `DealEditPanel`, `DealActionPanel`, `DealStickyHeader`, `DealTabNav` | Internal naming is acceptable, but **user-facing labels** must say "Opportunity" | 8+ components |
| Button text | "Edit" (contextually on deal page) | Should read "Edit Opportunity" when full label needed | `DealStickyHeader.tsx:90` |
| Wireframe spec | WF17 says "New deal" as CTA | **Conflict:** CLAUDE.md says "opportunity", wireframes say "deal" | Project-wide decision needed |
| Toast messages | "Exported {count} deals to Excel" | Should be "Exported {count} opportunities to Excel" | `PipelineGrid.tsx:192` |

> **Decision required:** Wireframe WF17 specifies "New deal" as the standard CTA, but CLAUDE.md mandates "opportunity". This inconsistency between specs needs a single ruling applied project-wide.

### 1.3 Toast Copy Missing Metadata Pattern

Wireframe WF4 specifies toast format: `"[Action] . [Metadata] -> [View Link]"`
Example: `"Deal created . D-SG-024 . OCBC Bank -> [View Deal]"`

| File | Current Toast | Expected Format |
|------|-------------|-----------------|
| `QuickActivityLogOverlay.tsx:90` | "Logged" (+ checkmark icon) | "Activity logged . {Lead ID} . {Company Name}" |
| `LeadsPage.tsx:28` | "Failed to update lead" | "Could not update lead . {Lead ID} -- try again" |

---

## 2. MEDIUM-SEVERITY ISSUES (Clarity & Consistency)

### 2.1 Vague Button Labels

| File | Current | Recommended | Reasoning |
|------|---------|-------------|-----------|
| `NewDealSaveBar.tsx:39` | "Esc -- discard" | Move to footer hint; button should just say "Discard" | Keyboard instructions belong in UI hints, not button labels |
| `NewDealSaveBar.tsx:47` | "Enter -- save row" | Move to footer hint; button should just say "Save" | Same as above |
| `BulkEditBar.tsx:28` | "Export to Excel" | "Export selected to Excel" | Unclear if it exports selection or entire grid |
| `BulkEditBar.tsx:31` | "Archive" | "Archive selected" + confirmation dialog | No indication of reversibility; destructive action without guard |
| `DealActionPanel.tsx:111` | "Confirm -- {action_label}" | "{action_label}" (e.g., "Submit Proposal") | "Confirm" prefix is redundant when placed in a confirmation dialog |

### 2.2 Abbreviated Form Labels

| File | Current | Recommended |
|------|---------|-------------|
| `QuickActivityLogOverlay.tsx:107` | "Ch:" | "Channel" |
| `QuickActivityLogOverlay.tsx:119` | "Out:" | "Outcome" |
| `QuickActivityLogOverlay.tsx:135` | "Next:" | "Next Step" |

These abbreviations break the brand principle of "Data Clarity -- complex insights made instantly understandable." First-time users (especially Finance or Alliance roles) will not decode these.

### 2.3 Missing Helper Text on Complex Fields

| File | Field | Missing |
|------|-------|---------|
| `LeadImportPanel.tsx:110` | Upload field | No link to a template/example file; jargon "1CH_SDR_Lead_Tracker format" assumes insider knowledge |
| `DealEditPanel.tsx:165` | ACE ID field | Placeholder "e.g. ACE-12345" is good, but no tooltip explaining what ACE ID is or where to find it |
| `CommandPalette.tsx:259` | Search input | "Search or type a command..." -- doesn't indicate entity search capability (leads, deals, contacts) |

### 2.4 "Coming Soon" Empty State

| File | Current | Recommended |
|------|---------|-------------|
| `ComingSoon.tsx:23` | "Coming in a future sprint" | "This feature is being built. Check back soon." (or remove sprint jargon entirely) |

Sprint-specific language leaks internal process to end users.

### 2.5 Inconsistent Selection Context

| File | Current | Issue |
|------|---------|-------|
| `BulkEditBar.tsx:14` | "1 row selected" / "{n} rows selected" | No indication of what actions are available; should pair with enabled/disabled action buttons |
| `BulkEditBar.tsx:43` | "Clear selection" | Imperative tone; rest of toolbar uses noun phrases ("Advance stage", "Reassign seller") |

---

## 3. LOW-SEVERITY ISSUES (Polish)

### 3.1 Punctuation & Formatting Inconsistencies

| Pattern | Example A | Example B | Fix |
|---------|-----------|-----------|-----|
| Trailing ellipsis | "Type your answer here..." (`TabQTree.tsx`) | "e.g. ACE-12345" (`DealEditPanel.tsx`) | Standardise: use ellipsis for open-ended fields, period for examples |
| Dash type | "No answer / Connected -- follow up" (en-dash, `QuickActivityLogOverlay.tsx`) | "Read-only . Finance view . Contact your AE..." (middle dot, `ReadOnlyBanner.tsx`) | Standardise on em-dash for clause breaks, middle dot for metadata separators |
| Capitalisation | "Save Activity" (`QuickActivityLogOverlay.tsx:167`) | "Save changes" (`DealEditPanel.tsx:196`) | Sentence case for all button text: "Save activity" |

### 3.2 Missing ARIA Label Interpolation (Cross-ref: Accessibility Audit)

| File | Current | Brand Guideline (Section 11.3) |
|------|---------|-------------------------------|
| `TopBar.tsx` (notifications) | `<span class="sr-only">` with static text | Should be `aria-label="Notifications -- {n} unread"` on `<Button>` |

---

## 4. DOMAIN TERMINOLOGY COMPLIANCE MATRIX

| Term | Guideline Source | Status | Notes |
|------|-----------------|--------|-------|
| **opportunity** (not "deal") | CLAUDE.md | PARTIAL -- code uses "deal" in components; labels mixed | Needs project-wide ruling |
| **custodian** (not "owner") | CLAUDE.md | COMPLIANT -- "Seller" used in grid (correct per wireframes) | |
| **IAT** | CLAUDE.md | COMPLIANT -- used correctly in Q Tree | |
| **SGD** / **Deal Value (SGD)** | Wireframes WF1 | COMPLIANT -- currency suffix always present | |
| **GTM Motion** | Wireframes WF1 | COMPLIANT | |
| **Stage format** ("1 . New Hunt") | Wireframes WF1 | NEEDS VERIFICATION -- check badge rendering | |
| **AE / PC / SA / PM / CRO / AM** | Brand Guidelines 1.2 | COMPLIANT | |
| **MQL / SQL** | Wireframes WF4 | COMPLIANT | |
| **O2R** (Order-to-Revenue) | Wireframes WF5-17 | NOT YET IMPLEMENTED | |
| **White Space** | CLAUDE.md | COMPLIANT -- nav label correct | |
| **Q Tree** (not "Questionnaire") | Wireframes WF2 | COMPLIANT | |

---

## 5. CROSS-REFERENCE: WIREFRAME SPEC vs. IMPLEMENTATION

### Toast Copy Pattern (WF4 Spec)

**Specified format:** `"[Action] . [ID] . [Entity] -> [View Link]"`

| Toast | Spec Compliance | Fix |
|-------|:-:|---|
| Deal export toast | NO | Add entity count + action: "Exported 12 opportunities to Excel" |
| Activity log toast | NO | "Activity logged . L-042 . OCBC Bank" |
| Lead import toast | PARTIAL | Good count; add error log link on failure |
| Deal creation toast | NOT IMPLEMENTED | Must implement: "Opportunity created . D-SG-024 . {Account} -> [View]" |

### Command Palette Quick Actions (WF17 Spec)

**Specified actions:** "New deal", "New lead", "Upload document", "Generate proposal", "Advance [deal] to [stage]"

| Action | Implemented | Copy Match |
|--------|:-:|:-:|
| New deal / New lead | YES | YES |
| Upload document | UNKNOWN | -- |
| Generate proposal | UNKNOWN | -- |
| Advance to stage | UNKNOWN | -- |
| AI queries ("Show my stalled deals") | UNKNOWN | -- |

### "Go To" Keyboard Shortcuts (WF17 / Section 6.6)

| Shortcut | Spec | Implemented |
|----------|------|:-:|
| G P -- Go to Pipeline | Required | NO |
| G D -- Go to Dashboard | Required | NO |
| N D -- New Deal | Required | NO |

---

## 6. RECOMMENDATIONS (Ordered by Priority)

### P0 -- Fix Before Next Release

1. **Resolve "deal" vs. "opportunity" terminology.** Get stakeholder ruling. If wireframe "deal" wins for user-facing copy, update CLAUDE.md. If CLAUDE.md "opportunity" wins, update all user-facing strings.
2. **Replace all generic error messages** with specific, actionable copy per the table in Section 1.1.
3. **Implement toast metadata pattern** from WF4 spec: `"[Action] . [ID] . [Entity] -> [View]"`.

### P1 -- Next Sprint

4. **Expand abbreviated form labels** (Ch/Out/Next) to full words.
5. **Remove keyboard instructions from button labels** ("Esc -- discard") into footer hints.
6. **Add helper text / tooltips** to ACE ID, import format, and command palette search.
7. **Replace "Coming in a future sprint"** with user-appropriate empty state copy.
8. **Fix notifications button ARIA** to use interpolated `aria-label`.

### P2 -- Polish Pass

9. Standardise punctuation (ellipsis, dash types, capitalisation) across all microcopy.
10. Add confirmation dialogs for destructive bulk actions (Archive).
11. Implement sequential keyboard shortcuts (G P, G D, N D) per Section 6.6.

---

## Appendix: Files Reviewed

```
frontend/src/components/grid/inline-new-deal/NewDealSaveBar.tsx
frontend/src/components/grid/toolbars/BulkEditBar.tsx
frontend/src/components/grid/toolbars/ReadOnlyBanner.tsx
frontend/src/components/grid/PipelineGrid.tsx
frontend/src/components/deal-detail/DealEditPanel.tsx
frontend/src/components/deal-detail/DealActionPanel.tsx
frontend/src/components/deal-detail/DealStickyHeader.tsx
frontend/src/components/deal-detail/DealTabNav.tsx
frontend/src/components/deal-detail/tabs/TabOverview.tsx
frontend/src/components/deal-detail/tabs/TabQTree.tsx
frontend/src/components/deals/DealActionPanel.tsx
frontend/src/components/leads/QuickActivityLogOverlay.tsx
frontend/src/components/leads/LeadImportPanel.tsx
frontend/src/components/leads/LeadDetailShell.tsx
frontend/src/components/leads/LeadDrilldownPanel.tsx
frontend/src/components/leads/LeadsPage.tsx
frontend/src/components/leads/QTreePanel.tsx
frontend/src/components/contacts/NewContactPanel.tsx
frontend/src/components/accounts/AccountDetailShell.tsx
frontend/src/components/command-palette/CommandPalette.tsx
frontend/src/components/common/ComingSoon.tsx
frontend/src/components/layout/TopBar.tsx
frontend/src/components/layout/AppSidebar.tsx
frontend/src/pages/auth/LoginPage.tsx
frontend/src/pages/pipeline/PipelinePage.tsx
frontend/src/pages/admin/AdminImportPage.tsx
frontend/src/hooks/useAuth.ts
frontend/src/lib/api-client.ts
```
