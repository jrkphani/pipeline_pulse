# Claude Code Setup for Pipeline Pulse

## Quick Start

This directory contains all the context Claude Code needs to effectively work on the Pipeline Pulse project. When using Claude Code, reference these files to provide comprehensive context.

## Context Files

1. **project-context.md** - High-level project overview, goals, and architecture
2. **business-logic.md** - Detailed business rules, O2R phases, health calculations
3. **technical-specs.md** - Technical standards, API patterns, database schema
4. **claude-instructions.md** - Specific coding patterns and principles to follow
5. **implementation-checklist.md** - Development roadmap and progress tracking

## How to Use with Claude Code

### Initial Setup Command
```bash
claude-code "Review all files in the .claude directory to understand the Pipeline Pulse project. Set up the initial project structure with React + TypeScript frontend and FastAPI + Python backend based on the technical specifications."
```

### Feature Implementation Examples

#### 1. Zoho CRM Sync Engine
```bash
claude-code "Implement the Zoho CRM synchronization module based on business-logic.md section 'Sync Conflict Resolution' and technical-specs.md API endpoints. Follow the error handling patterns in claude-instructions.md. Include rate limiting and conflict detection as specified."
```

#### 2. O2R Health Status Calculator
```bash
claude-code "Create the O2R health status calculation service using the exact rules in business-logic.md under 'Health Status Calculation Rules'. Implement for all four statuses: Green, Yellow, Red, and Blocked. Include comprehensive tests for each status condition."
```

#### 3. Currency Conversion Service
```bash
claude-code "Build the currency conversion service that integrates with Currency Freaks API. Follow the 'Currency Standardization Rules' in business-logic.md. Implement caching, fallback to last known rates, and staleness indicators. All amounts must be displayed in SGD."
```

#### 4. Frontend Components
```bash
claude-code "Create the MetricCard, StatusBadge, and O2RPhaseIndicator components using the design token system specified in technical-specs.md. Follow the component patterns in claude-instructions.md. Use shadcn/ui as the base and extend with Pipeline Pulse styling."
```

### Best Practices for Claude Code

1. **Always Reference Specific Sections**
   ```bash
   # Good
   claude-code "Implement the sync history feature as described in technical-specs.md under 'API Endpoint Standards' - specifically endpoints FR-SYNC-003 and FR-SYNC-006"
   
   # Less Effective
   claude-code "Add sync history feature"
   ```

2. **Include Business Context**
   ```bash
   claude-code "Create the opportunity bulk update feature. Users can select up to 100 records (standard), 1000 (power user), or unlimited (admin). Follow the 'Bulk Operation Rules' in business-logic.md and implement proper validation and rollback as specified."
   ```

3. **Specify Testing Requirements**
   ```bash
   claude-code "Implement the O2R phase transition logic with validation. Include unit tests that cover all scenarios: normal progression, phase skipping, retrograde movement. Test coverage must be >80% as per technical-specs.md."
   ```

4. **Request Documentation**
   ```bash
   claude-code "After implementing the GTM motion tracker, create API documentation following the OpenAPI/Swagger format and update the relevant sections in the .claude directory files."
   ```

## Common Tasks

### Database Setup
```bash
claude-code "Create the PostgreSQL schema and tables based on technical-specs.md 'Database Schema' section. Include all constraints, indexes, and audit triggers. Generate Alembic migrations."
```

### API Implementation
```bash
claude-code "Implement all O2R-related API endpoints listed in technical-specs.md. Use the repository pattern, proper error handling from claude-instructions.md, and Pydantic models for validation."
```

### Testing
```bash
claude-code "Write comprehensive tests for the currency conversion service including: successful conversion, API failure handling, rate staleness, manual overrides, and edge cases with 150+ currencies."
```

### Performance Optimization
```bash
claude-code "Review and optimize the opportunity list query performance. Add appropriate indexes, implement pagination, and ensure queries meet the <200ms response time requirement from technical-specs.md."
```

## Important Notes

1. **Design Tokens**: Never use hardcoded values. Always reference the design token system.
2. **Type Safety**: Use TypeScript strict mode and Pydantic models everywhere.
3. **Error Handling**: Follow the error handling patterns - never let exceptions bubble up.
4. **Business Rules**: The health status calculations and O2R phase rules are critical - implement exactly as specified.
5. **Currency**: Everything displays in SGD, but users enter in their local currency.
6. **Performance**: Keep the performance requirements in mind - responses should be fast.
7. **Security**: Always validate inputs, check permissions, and sanitize outputs.

## Questions to Ask Claude Code

- "Show me the current test coverage for the sync module"
- "Analyze the performance of the opportunity queries and suggest optimizations"
- "Review the codebase for compliance with the design token system"
- "Check if all API endpoints have proper error handling"
- "Verify that the O2R health calculations match the business rules exactly"

## Updating Context

When the project evolves, update these context files:
- Add new business rules to `business-logic.md`
- Update API endpoints in `technical-specs.md`
- Add new patterns to `claude-instructions.md`
- Check off completed items in `implementation-checklist.md`

Remember: Claude Code works best with specific, detailed instructions that reference the exact requirements and patterns defined in these context files.
