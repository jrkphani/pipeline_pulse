# /plan — Feature Implementation Planning

Invoke the **planner** agent to create a structured implementation plan before writing any code.

## Usage

```
/plan <feature description>
```

## Examples

```
/plan Add inline editing for opportunity stage with validation and relay leg audit trail
/plan Build the authenticated app shell with collapsible sidebar and top bar
/plan Implement XLSX export for filtered pipeline grid rows using SheetJS
/plan Add temporal snapshot on every opportunity SGD core change
```

## What happens

The planner agent will:
1. Read relevant existing files (models, schemas, stores, components)
2. Produce a full file-level impact list
3. Define the build order (backend → API → hooks → store → components)
4. Create a test plan before implementation starts
5. Flag constraint violations and risks
6. Verify against the Pipeline Pulse constraint checklist

## When to use

**Always** invoke `/plan` before implementing features that touch:
- Opportunity model or schema changes
- Temporal snapshot / time-series logic
- Relay race / custodianship transfers
- IAT qualification framework
- Any cross-stack feature (backend + frontend together)
- New authentication flows

**Skip `/plan` for:**
- Bug fixes in a single file
- Pure style/UI changes
- Adding a new column to the grid (no schema change)
- Updating copy or labels
