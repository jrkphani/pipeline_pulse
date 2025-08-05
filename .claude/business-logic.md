# Pipeline Pulse O2R Business Logic

## O2R (Opportunity-to-Revenue) Phases

### Phase I: Opportunity (Target Identification)
- Initial opportunity identification
- Qualification and discovery
- Initial value assessment
- Account mapping

### Phase II: Proposal (Documentation)
- Solution design and scoping
- Proposal creation and submission
- Pricing and commercial negotiation
- Contract preparation

### Phase III: Execution (Rocket Launch)
- Purchase order receipt
- Project kickoff
- Implementation/delivery
- Customer acceptance

### Phase IV: Revenue (Dollar Recognition)
- Invoice generation
- Payment collection
- Revenue recognition
- Account expansion planning

## Health Status Calculation Rules

### 🟢 Green (On Track)
- All milestones met on time
- No overdue actions or payments
- Regular updates provided (within last 7 days)
- No reported blockers
- Positive customer engagement signals

### 🟡 Yellow (Minor Issues)
**Trigger any of these conditions:**
- Kickoff delayed 14+ days after PO received
- Project execution running 60+ days
- High probability deal (80%+) without PO after 30 days
- Low probability deal (≤20%) consuming significant resources
- No updates for 7-14 days
- Minor milestone delays (<14 days)

### 🔴 Red (Critical)
**Trigger any of these conditions:**
- Proposal stalled 30+ days without PO
- Payment overdue 45+ days after invoice
- Deal past expected closing date without revenue
- Critical milestone delayed 14+ days
- No updates for 14+ days
- Multiple yellow conditions present

### ⬛ Blocked (External)
**Requires explicit flag with reason:**
- Customer-reported blockers
- Waiting on third-party approvals
- Legal or compliance issues
- Budget freeze or organizational changes
- Force majeure events

## Key Milestone Tracking

### Required Milestones by Phase
**Phase I → II Transition:**
- Opportunity qualified
- Discovery completed
- Initial pricing approved

**Phase II → III Transition:**
- Proposal submitted
- Commercial terms agreed
- PO received

**Phase III → IV Transition:**
- Kickoff completed
- Delivery milestones met
- Customer acceptance received

**Phase IV Completion:**
- Invoice sent
- Payment received
- Revenue recognized

## Currency Standardization Rules

### Base Currency: SGD (Singapore Dollar)

### Conversion Process:
1. User enters amount in local currency
2. System fetches current exchange rate from Currency Freaks API
3. Converts to SGD for all displays and calculations
4. Stores both original and SGD amounts

### Exchange Rate Management:
- **Update Frequency**: Weekly (Monday 00:00 UTC)
- **Rate Source**: Currency Freaks API
- **Cache Duration**: 90 days of historical rates
- **Staleness Indicator**: Show warning after 7 days
- **Fallback**: Use last known rate if API unavailable

### Supported Currencies:
All 150+ currencies supported by Currency Freaks API, including:
- Major: USD, EUR, GBP, JPY, CNY, INR, AUD
- Regional: MYR, THB, IDR, PHP, VND
- Others: As provided by Currency Freaks

## GTM Motion Tracking

### Customer Journey Types:
1. **New Customer**: First-time buyers, greenfield opportunities
2. **Existing Customer**: Upsell, cross-sell, expansion
3. **Dormant Customer**: Win-back, reactivation

### AWS Segment Alignment:
- **Startup**: <$10M revenue, high growth
- **Scale**: $10M-$100M revenue, expanding
- **Enterprise**: $100M+ revenue, strategic accounts
- **Deep Engagement**: Co-innovation partners

### Playbook Assignment:
Automatically assigned based on:
- Customer segment
- Journey stage
- Deal size
- Product mix
- Historical performance

## Sync Conflict Resolution

### Conflict Detection:
Automatic detection when:
- Same field modified in both systems
- Last modified timestamps differ
- Validation rules conflict

### Resolution Strategies:
1. **CRM Wins**: Zoho CRM data takes precedence (default)
2. **Local Wins**: Pipeline Pulse data takes precedence
3. **Merge**: Combine non-conflicting changes
4. **Manual**: User reviews and decides

### Special Cases:
- Amount changes >20% require manual review
- Phase regression requires reason capture
- Territory changes need approval
- Deleted records: Soft delete with 90-day retention

## Bulk Operation Rules

### Permission Levels:
- **Standard User**: Up to 100 records
- **Power User**: Up to 1,000 records
- **Admin**: Unlimited (with confirmation >5,000)

### Validation Requirements:
- Preview all changes before execution
- Validate against business rules
- Check field dependencies
- Ensure CRM sync capability

### Rollback Policy:
- All bulk operations reversible for 24 hours
- Complete audit trail maintained
- Original values preserved
- One-click rollback available

## Performance Thresholds

### Sync Operations:
- Full sync: <60 minutes for 100,000 records
- Incremental sync: <5 minutes for daily changes
- Conflict resolution: <2 seconds per conflict

### Data Freshness:
- Real-time: Critical metrics (pipeline value, health status)
- Near real-time: Opportunity updates (<15 minutes)
- Batch: Analytics and reports (hourly)

### UI Response:
- Page load: <3 seconds
- Search results: <2 seconds
- Chart rendering: <1 second
- Export generation: <30 seconds for 10,000 records
