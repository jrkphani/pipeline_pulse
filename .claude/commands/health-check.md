---
name: health-check
description: Reviews the codebase for health score logic correctness, validates Green/Yellow/Red/Blocked transitions against business rules, and checks temporal snapshot integrity.
user_invocable: true
---

# Health Check Command

You are performing a comprehensive review of the Pipeline Pulse health scoring system and temporal snapshot integrity.

## Steps

### 1. Locate Health Scoring Implementation
- Search for health status enums, types, and constants
- Find the health calculation logic (backend services, frontend display)
- Identify all places where health status is read, written, or displayed

### 2. Validate Health Status Rules

#### Green (On Track)
Verify the implementation checks ALL of:
- All milestones met on time
- No overdue actions or payments
- Regular updates provided (within last 7 days)
- No reported blockers
- Positive customer engagement signals

#### Yellow (Minor Issues)
Verify ANY of these triggers Yellow:
- Kickoff delayed 14+ days after PO received
- Project execution running 60+ days
- High probability deal (80%+) without PO after 30 days
- Low probability deal (≤20%) consuming significant resources
- No updates for 7-14 days
- Minor milestone delays (<14 days)

#### Red (Critical)
Verify ANY of these triggers Red:
- Proposal stalled 30+ days without PO
- Payment overdue 45+ days after invoice
- Deal past expected closing date without revenue
- Critical milestone delayed 14+ days
- No updates for 14+ days
- Multiple yellow conditions present (escalation rule)

#### Blocked (External)
Verify:
- Requires explicit flag (cannot be auto-calculated)
- Reason is mandatory (reject empty reasons)
- Valid reasons: customer blockers, third-party approvals, legal/compliance, budget freeze, force majeure

### 3. Check Transition Logic
- Health status transitions must be logged
- Verify the escalation rule: multiple Yellow → Red
- Blocked can only be set/cleared manually
- Phase changes should trigger health recalculation
- Verify no code path allows setting health without validation

### 4. Validate Temporal Snapshot Integrity
- Snapshots must be immutable once created
- Snapshot creation must be atomic
- Check that snapshots capture: opportunity states, health scores, phase distribution, pipeline value (SGD)
- Verify snapshot queries use time-range filters (no full-table scans)
- Check retention policy implementation (2 years daily, indefinite monthly)

### 5. Output Report

```
## Health Check Report

### Health Scoring Logic
| Rule | Status | Location | Notes |
|------|--------|----------|-------|
| Green conditions | ✅/❌ | [file:line] | [details] |
| Yellow triggers  | ✅/❌ | [file:line] | [details] |
| Red triggers     | ✅/❌ | [file:line] | [details] |
| Blocked rules    | ✅/❌ | [file:line] | [details] |
| Escalation (Y→R) | ✅/❌ | [file:line] | [details] |

### Transition Integrity
- [List any invalid transition paths found]
- [List missing transition logging]

### Temporal Snapshots
| Check | Status | Notes |
|-------|--------|-------|
| Immutability | ✅/❌ | [details] |
| Atomicity | ✅/❌ | [details] |
| Data completeness | ✅/❌ | [details] |
| Query efficiency | ✅/❌ | [details] |
| Retention policy | ✅/❌ | [details] |

### Issues Found
1. [Prioritized list of issues]

### Recommendations
1. [Prioritized fixes]
```
