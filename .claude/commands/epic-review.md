---
name: epic-review
description: Reviews an epic's implementation against BRD requirements, checks for missing acceptance criteria, and outputs a structured gap analysis.
user_invocable: true
arguments:
  - name: epic
    description: Epic name or number to review
    required: true
---

# Epic Review Command

You are performing a structured review of epic "$ARGUMENTS" against the Pipeline Pulse BRD requirements.

## Steps

### 1. Identify the Epic Scope
- Search the codebase for references to the epic name/number in comments, commit messages, and documentation
- Read relevant BRD sections from `.claude/business-logic.md` and `.claude/technical-specs.md`
- Identify all acceptance criteria for this epic

### 2. Audit Implementation Completeness
For each acceptance criterion:
- Search the codebase for the implementing code
- Verify the implementation matches the requirement (not just that code exists)
- Check for edge cases specified in the BRD
- Note any deviations from the domain model

### 3. Check Domain Model Fidelity
- Verify data structures match the O2R domain model
- Confirm health scoring rules are correctly implemented
- Validate currency handling follows SGD standardisation rules
- Check phase transition logic matches business rules
- Verify custodianship (relay race) rules are enforced

### 4. Identify Gaps
Look for:
- Missing acceptance criteria (specified but not implemented)
- Partial implementations (code exists but incomplete)
- Deviations from business rules
- Missing error handling for domain-specific edge cases
- Missing tests for business logic
- UI/UX gaps (missing states, incorrect labels, wrong calculations)

### 5. Output Structured Gap Analysis

Format your output as:

```
## Epic Review: [Epic Name/Number]

### Summary
[1-2 sentence overall assessment]

### Implementation Status
| Criterion | Status | Notes |
|-----------|--------|-------|
| [AC-1]    | ✅/⚠️/❌ | [Details] |
| ...       | ...    | ...   |

### Domain Model Deviations
- [List any deviations from the O2R model, health scoring rules, currency handling, etc.]

### Missing Implementations
- [List features/criteria that are not yet implemented]

### Partial Implementations
- [List features that exist but are incomplete, with specifics on what's missing]

### Recommendations
1. [Prioritized list of actions to close gaps]
```

Be thorough but concise. Focus on business-critical gaps over cosmetic issues.
