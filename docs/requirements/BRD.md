# Business Requirements Document (BRD) - Pipeline Pulse

## 1. Introduction

The Pipeline Pulse project aims to transform raw Zoho CRM data into actionable insights, providing revenue leaders with real-time pipeline intelligence. This document outlines the business needs, project goals, and comprehensive functional requirements from a business perspective.

## 2. Business Need

Current sales pipeline analysis often relies on manual data extraction and static reports, leading to outdated insights, delayed decision-making, and a lack of real-time visibility into sales performance and potential bottlenecks. There is a critical need for an automated, real-time system that integrates directly with Zoho CRM, standardizes data, and provides dynamic, actionable insights.

### Key Business Challenges

- **Data Fragmentation**: Sales data scattered across multiple systems and formats
- **Currency Inconsistency**: Global team entering deals in local currencies without standardized SGD conversion
- **Limited Visibility**: No real-time tracking of opportunity progression through revenue realization
- **Manual Processes**: Time-consuming data preparation and report generation
- **Reactive Management**: Inability to proactively identify at-risk deals or expansion opportunities

## 3. Project Goals

- **Automate Data Ingestion**: Establish a robust, automated process for synchronizing sales data from Zoho CRM into the Pipeline Pulse system
- **Provide Real-time Visibility**: Enable users to view up-to-the-minute sales pipeline data and key performance indicators
- **Enhance Data Quality & Consistency**: Ensure data accuracy, standardize currency to SGD, and identify discrepancies between CRM and the analytical system
- **Improve Operational Efficiency**: Reduce manual effort in data preparation and reporting, allowing sales operations and leadership to focus on strategic analysis
- **Facilitate Proactive Issue Resolution**: Provide tools for monitoring sync health, identifying conflicts, and enabling timely resolution of data discrepancies
- **Enable Revenue Intelligence**: Transform opportunity data into predictive insights for revenue forecasting and risk management
- **Support GTM Strategy**: Align system capabilities with 1CloudHub's Go-to-Market motion tracking requirements

## 4. Scope

The scope includes:

- Zoho CRM data synchronization and integration
- Currency standardization and conversion
- O2R (Opportunity-to-Revenue) tracking across four phases
- GTM motion tracking for customer journey management
- Advanced analytics and reporting
- Bulk update capabilities
- System administration and monitoring

### Out of Scope

- Direct integration with accounting systems
- Customer-facing portals
- Mobile application development (Phase 1)

## 5. Stakeholders

- **Primary Stakeholders**
  - Sales Leadership (VP Sales, Regional Directors)
  - Sales Operations Managers
  - Revenue Operations Team
  - Account Executives
  - Customer Success Managers

- **Secondary Stakeholders**
  - Finance Team (for revenue recognition)
  - AWS Alliance Team (for partner metrics)
  - Executive Leadership (for strategic insights)
  - System Administrators
  - Development Team

## 6. Epics and User Stories

### Epic 1: Zoho CRM Data Synchronization Management

**Description**: This epic covers all functionalities related to the automated and manual synchronization of data between Zoho CRM and the Pipeline Pulse system, ensuring data freshness and integrity.

- **User Story 1.1**: Automated Data Sync
  - As a System Administrator, I want the system to automatically synchronize data from Zoho CRM at regular intervals so that the analytical data is always fresh
  - **Acceptance Criteria**:
    - Full sync on initial startup
    - Incremental syncs at configurable intervals (default 15 minutes)
    - Background sync without performance impact
    - Comprehensive logging of success/failure
    - Support for custom field mapping

- **User Story 1.2**: Manual Full Data Sync Trigger
  - As a Sales Operations Manager, I want to manually trigger a full data synchronization
  - **Acceptance Criteria**:
    - "Trigger Full Sync" button on Sync Control Panel
    - Real-time progress indication
    - Ability to cancel ongoing sync
    - Notification upon completion

- **User Story 1.3**: Manual Incremental Data Sync Trigger
  - As a Sales Operations Manager, I want to manually trigger incremental synchronization
  - **Acceptance Criteria**:
    - "Trigger Incremental Sync" button available
    - Only syncs records modified since last sync
    - Progress tracking with record counts

- **User Story 1.4**: Live Sync Progress Monitoring
  - As a Sales Operations Manager, I want to view live progress of ongoing synchronization
  - **Acceptance Criteria**:
    - Real-time progress bar with percentage
    - Current record type being processed
    - Estimated time to completion
    - Error notifications during sync

- **User Story 1.5**: Sync History Review
  - As a Sales Operations Manager, I want to view history of past synchronization events
  - **Acceptance Criteria**:
    - Sortable table with sync history
    - Timestamp, type, status, duration, record count
    - Ability to view detailed logs
    - Export sync history to CSV

- **User Story 1.6**: Conflict Resolution Management
  - As a Sales Operations Manager, I want to identify and resolve data conflicts
  - **Acceptance Criteria**:
    - Conflict detection during sync
    - Side-by-side comparison of conflicting values
    - Resolution strategies (CRM wins, Local wins, Manual merge)
    - Audit trail of resolutions

- **User Story 1.8**: Handle Sync Interruptions
  - As a System Administrator, I want the system to gracefully handle sync interruptions and resume from the last successful point
  - **Acceptance Criteria**:
    - Automatic detection of interrupted syncs
    - Resume capability from last successful record
    - No duplicate processing of records
    - Clear status of partial sync completion

- **User Story 1.9**: Manage API Rate Limits
  - As a System Administrator, I want the system to respect and manage Zoho API rate limits
  - **Acceptance Criteria**:
    - Real-time rate limit monitoring
    - Automatic throttling when approaching limits
    - Queue management for deferred requests
    - Admin alerts at 80% limit usage

### Epic 2: System Health and Monitoring

**Description**: Comprehensive insights into operational health of the Pipeline Pulse system.

- **User Story 2.1**: Global Data Freshness Indicator
  - As a User, I want to see how recently data was synchronized
  - **Acceptance Criteria**:
    - Visual indicator in application header
    - Color-coded freshness status
    - Auto-refresh without page reload
    - Click for detailed sync status

- **User Story 2.2**: API Rate Limit Monitoring
  - As a System Administrator, I want to monitor Zoho API usage
  - **Acceptance Criteria**:
    - Real-time API call counter
    - Rate limit warnings at 80% usage
    - Historical usage graphs
    - Automatic throttling when approaching limits

- **User Story 2.3**: System Performance Dashboard
  - As a System Administrator, I want to monitor system performance
  - **Acceptance Criteria**:
    - Response time metrics
    - Database performance indicators
    - User activity tracking
    - System resource utilization

### Epic 3: O2R (Opportunity-to-Revenue) Tracking

**Description**: Track opportunities through four phases from initial opportunity to revenue recognition with standardized health monitoring.

#### O2R Health Status Logic

The system implements a color-coded health status system:

- **🟢 Green (On Track)**: Opportunity progressing normally
  - All milestones met on time
  - No overdue actions or payments
  - Regular updates provided
  - No reported blockers

- **🟡 Yellow (Minor Issues)**: Warning signs requiring monitoring
  - Kickoff delayed 14+ days after PO received
  - Project execution running 60+ days
  - High probability deal (80%+) without PO
  - Low probability deal (≤20%) consuming resources

- **🔴 Red (Critical)**: Immediate attention required
  - Proposal stalled 30+ days without PO
  - Payment overdue 45+ days after invoice
  - Deal past closing date without revenue
  - Critical milestone significantly delayed

- **⬛ Blocked (External)**: External factors blocking progress
  - Customer-reported blockers
  - Waiting on third-party approvals
  - Legal or compliance issues
  - Budget freeze or organizational changes

- **User Story 3.1**: Phase-based Opportunity Tracking
  - As a Sales Manager, I want to track opportunities through O2R phases
  - **Acceptance Criteria**:
    - Visual phase progression (Phase I-IV)
    - Milestone tracking within each phase
    - Health signals based on phase duration
    - Automated phase transitions

- **User Story 3.2**: Revenue Milestone Management
  - As a Revenue Operations Manager, I want to track key revenue milestones
  - **Acceptance Criteria**:
    - Proposal submission tracking
    - PO receipt confirmation
    - Kickoff date management
    - Invoice and payment tracking
    - Revenue recognition dates

- **User Story 3.3**: O2R Analytics Dashboard
  - As a Sales Leader, I want to analyze O2R performance metrics
  - **Acceptance Criteria**:
    - Phase velocity analysis
    - Bottleneck identification
    - Territory/service line breakdown
    - Trend analysis over time

- **User Story 3.4**: At-Risk Deal Identification
  - As a Sales Manager, I want to identify deals at risk of slipping
  - **Acceptance Criteria**:
    - Automated risk scoring based on defined criteria
    - Visual risk indicators (green/yellow/red/blocked)
    - Risk factor breakdown with specific triggers
    - Suggested remediation actions
    - Attention required flagging for critical deals

- **User Story 3.5**: Health Status Implementation
  - As a Sales Operations Manager, I want standardized health status logic across all opportunities
  - **Acceptance Criteria**:
    - **Green Status** (On Track):
      - All milestones met on time
      - No overdue actions or payments
      - Regular updates provided
      - No reported blockers
    - **Yellow Status** (Minor Issues):
      - Kickoff delayed 14+ days after PO
      - Project execution running 60+ days
      - High probability (80%+) without PO
      - Low probability (≤20%) consuming resources
    - **Red Status** (Critical):
      - Proposal stalled 30+ days without PO
      - Payment overdue 45+ days after invoice
      - Deal past closing date without revenue
      - Critical milestone significantly delayed
    - **Blocked Status** (External):
      - Customer-reported blockers
      - Third-party approval dependencies
      - Legal/compliance issues
      - Budget freeze or organizational changes

- **User Story 3.7**: Handle Retrograde Phase Movement
  - As a Sales Manager, I want the system to properly handle opportunities that move backward in phases
  - **Acceptance Criteria**:
    - Track phase movement history
    - Flag retrograde movements for review
    - Maintain milestone data from higher phases
    - Include reason capture for phase regression

- **User Story 3.8**: Manage Stale Opportunities
  - As a Sales Operations Manager, I want to identify and handle opportunities that have been inactive for extended periods
  - **Acceptance Criteria**:
    - Auto-flag opportunities inactive for 90+ days
    - Escalation for opportunities stuck in phase for 180+ days
    - Option to archive with reason codes
    - Exclude from active pipeline metrics option

### Epic 4: GTM Motion Tracker

**Description**: Systematic tracking of customer journey aligned with AWS segments and 1CloudHub's sales methodology.

- **User Story 4.1**: Customer Journey Classification
  - As a Sales Operations Manager, I want to classify customers by journey type
  - **Acceptance Criteria**:
    - New vs. existing customer segmentation
    - AWS segment mapping (Startup/Scale/Focus/Deep)
    - Journey stage tracking
    - Automatic classification rules

- **User Story 4.2**: Playbook Assignment
  - As a Sales Manager, I want appropriate playbooks assigned to opportunities
  - **Acceptance Criteria**:
    - Automatic playbook selection based on segment
    - Manual override capability
    - Playbook activity tracking
    - Success rate measurement

- **User Story 4.3**: Expansion Opportunity Identification
  - As a Customer Success Manager, I want to identify expansion opportunities
  - **Acceptance Criteria**:
    - Service gap analysis
    - Usage pattern insights
    - Expansion value calculation
    - Prioritized opportunity list

- **User Story 4.4**: AWS Alignment Tracking
  - As an Alliance Manager, I want to track AWS program utilization
  - **Acceptance Criteria**:
    - Co-sell opportunity tracking
    - MAP funding utilization
    - POC credit tracking
    - Partner tier progress

### Epic 5: Currency Standardization and Financial Intelligence

**Description**: Ensure all financial data is accurately converted and presented in SGD.

- **User Story 5.1**: Multi-Currency Support
  - As a Finance Manager, I want all amounts converted to SGD
  - **Acceptance Criteria**:
    - Automatic currency detection
    - Real-time exchange rate updates
    - Historical rate tracking
    - Conversion audit trail

- **User Story 5.3**: Handle Currency Conversion Failures
  - As a Finance Manager, I want the system to gracefully handle currency conversion failures
  - **Acceptance Criteria**:
    - Fallback to last known exchange rate
    - Clear indicators for amounts using stale rates
    - Manual rate override capability
    - Notification of conversion issues

- **User Story 5.4**: Multi-Currency Reporting Controls
  - As a Finance Manager, I want controls over currency conversion for reporting
  - **Acceptance Criteria**:
    - Option to lock exchange rates for reporting periods
    - Historical rate reconstruction for past periods
    - Variance analysis due to rate changes
    - Original currency amount preservation

### Epic 6: Bulk Operations and Data Management

**Description**: Enable efficient bulk updates and data management operations.

- **User Story 6.1**: Bulk Field Updates
  - As a Sales Operations Manager, I want to update multiple records simultaneously
  - **Acceptance Criteria**:
    - Multi-record selection
    - Field validation before update
    - Preview changes before commit
    - Rollback capability

- **User Story 6.3**: Handle Bulk Operation Failures
  - As a Sales Operations Manager, I want proper handling of bulk operation failures
  - **Acceptance Criteria**:
    - Transaction-based processing (all or nothing)
    - Detailed error reporting per record
    - Partial success handling options
    - Retry mechanism for failed records

- **User Story 6.4**: Bulk Operation Permissions
  - As a System Administrator, I want granular permissions for bulk operations
  - **Acceptance Criteria**:
    - Role-based bulk operation limits
    - Approval workflow for large bulk updates
    - Audit trail with before/after values
    - Emergency rollback capability

### Epic 7: Analytics and Reporting

**Description**: Comprehensive analytics and reporting capabilities for revenue intelligence.

- **User Story 7.1**: Pipeline Analytics Dashboard
  - As a Sales Leader, I want comprehensive pipeline analytics
  - **Acceptance Criteria**:
    - Pipeline value by stage
    - Conversion rate analysis
    - Average deal size trends
    - Win/loss analysis

- **User Story 7.2**: Territory Performance Analysis
  - As a Regional Director, I want to analyze performance by territory
  - **Acceptance Criteria**:
    - Territory-based filtering
    - Comparative analysis
    - Drill-down capabilities
    - Export to Excel/PDF

- **User Story 7.3**: Service Line Analytics
  - As a Service Line Manager, I want to track service-specific metrics
  - **Acceptance Criteria**:
    - Revenue by service type
    - Service adoption rates
    - Cross-sell analysis
    - Service performance trends

- **User Story 7.4**: Executive Reporting
  - As an Executive, I want high-level business intelligence
  - **Acceptance Criteria**:
    - Executive dashboard
    - KPI scorecards
    - Trend analysis
    - Predictive insights

### Epic 9: Error Handling and Recovery

**Description**: Comprehensive error handling, recovery mechanisms, and negative flow management across all system functions.

- **User Story 9.1**: System-wide Error Handling
  - As a User, I want clear error messages and recovery options when things go wrong
  - **Acceptance Criteria**:
    - User-friendly error messages without technical jargon
    - Suggested actions for common errors
    - Error reporting mechanism
    - Context preservation during errors

- **User Story 9.2**: Data Recovery and Rollback
  - As a System Administrator, I want to recover from data corruption or failed operations
  - **Acceptance Criteria**:
    - Point-in-time data recovery
    - Operation rollback capability
    - Data integrity verification
    - Recovery operation audit trail

- **User Story 9.3**: Offline Mode Support
  - As a User, I want to view cached data when systems are unavailable
  - **Acceptance Criteria**:
    - Cached data availability indicator
    - Read-only mode during outages
    - Queue for pending operations
    - Automatic sync upon reconnection

- **User Story 9.4**: Concurrent Access Management
  - As a User, I want protection from conflicts when multiple users access the same data
  - **Acceptance Criteria**:
    - Optimistic locking implementation
    - Real-time collaboration indicators
    - Merge conflict resolution
    - Activity feed for shared records

- **User Story 8.1**: Responsive Design
  - As a User, I want to access Pipeline Pulse from any device
  - **Acceptance Criteria**:
    - Mobile-responsive layouts
    - Touch-friendly controls
    - Optimized data tables
    - Consistent experience

- **User Story 8.2**: Advanced Search and Filtering
  - As a User, I want powerful search capabilities
  - **Acceptance Criteria**:
    - Global search across all data
    - Advanced filter combinations
    - Saved search criteria
    - Search history

- **User Story 8.3**: Customizable Dashboards
  - As a User, I want to customize my dashboard view
  - **Acceptance Criteria**:
    - Drag-and-drop widgets
    - Widget configuration
    - Multiple dashboard layouts
    - Dashboard sharing

## 7. Non-Functional Requirements

### Performance Requirements

- Page load time < 3 seconds
- Data sync completion < 5 minutes for 10,000 records
- Support for 100+ concurrent users
- 99.9% uptime availability

### Security Requirements

- Role-based access control (RBAC)
- Data encryption at rest and in transit
- Audit logging for all data changes
- Compliance with data protection regulations

### Scalability Requirements

- Support for up to 1 million opportunity records
- Horizontal scaling capability
- Database optimization for large datasets
- Efficient data archival strategy

### Integration Requirements

- RESTful API for external integrations
- Webhook support for real-time events
- Export capabilities (CSV, Excel, PDF)
- Future integration readiness (Slack, Teams)

## 8. Success Metrics

### Quantitative Metrics

- 90% reduction in manual data preparation time
- 95% data accuracy between CRM and Pipeline Pulse
- 80% user adoption within 3 months
- 25% improvement in forecast accuracy
- 50% reduction in time to identify at-risk deals
- 30% improvement in payment collection velocity

### Qualitative Metrics

- Improved decision-making speed
- Enhanced pipeline visibility
- Better cross-team collaboration
- Increased user satisfaction
- Proactive risk management
- Standardized opportunity health monitoring

## 9. Edge Cases and Negative Flows

### 9.1 Data Synchronization Edge Cases

- **Duplicate Records**
  - **Scenario**: Same opportunity exists with different IDs in Zoho CRM
  - **Impact**: Inflated pipeline metrics, duplicate tracking
  - **Handling**: Implement duplicate detection based on multiple fields (name, account, amount)

- **Deleted Records**
  - **Scenario**: Records deleted in Zoho CRM after initial sync
  - **Impact**: Orphaned data in Pipeline Pulse
  - **Handling**: Soft delete with retention period, audit trail for deletions

- **Field Type Changes**
  - **Scenario**: Zoho CRM field changes from text to picklist
  - **Impact**: Data type mismatch, sync failures
  - **Handling**: Type conversion logic, warning notifications to admin

- **Massive Data Updates**
  - **Scenario**: Bulk import of 50,000+ records in Zoho CRM
  - **Impact**: Sync timeout, API rate limit breach
  - **Handling**: Chunked processing, queue management, progress tracking

### 9.2 O2R Tracking Edge Cases

- **Retrograde Phase Movement**
  - **Scenario**: Opportunity moves backward from Phase III to Phase II
  - **Impact**: Negative velocity metrics, confused health status
  - **Handling**: Track phase history, flag retrograde movements for review

- **Skipped Phases**
  - **Scenario**: Opportunity jumps from Phase I to Phase III
  - **Impact**: Missing milestone data, inaccurate velocity calculations
  - **Handling**: Auto-populate missing phase dates, flag for review

- **Zombie Opportunities**
  - **Scenario**: Opportunities stuck in early phases for 180+ days
  - **Impact**: Inflated pipeline, skewed forecasts
  - **Handling**: Auto-flag for archival, exclude from active pipeline metrics

- **Multiple Payment Milestones**
  - **Scenario**: Phased payments across multiple invoices
  - **Impact**: Incorrect revenue recognition timing
  - **Handling**: Support multiple payment tracking per opportunity

### 9.3 Currency Edge Cases

- **Unsupported Currencies**
  - **Scenario**: Opportunity in cryptocurrency or currency not supported by Currency Freaks API
  - **Impact**: Conversion failure, missing financial data
  - **Handling**: Default to USD conversion first, then to SGD

- **Exchange Rate API Unavailability**
  - **Scenario**: Currency Freaks API down during weekly update
  - **Impact**: Cannot update exchange rates
  - **Handling**: Use last known rates (up to 30 days), flag as stale after 7 days, manual update option

- **Extreme Rate Fluctuations**
  - **Scenario**: 20%+ currency movement in a week
  - **Impact**: Dramatic pipeline value changes between updates
  - **Handling**: Rate change alerts, variance reporting, option to trigger immediate update

- **Historical Rate Requirements**
  - **Scenario**: Need conversion for dates before Currency Freaks API history
  - **Impact**: Cannot accurately convert historical opportunities
  - **Handling**: Use earliest available rate with disclaimer, manual rate entry option

### 9.4 System Failure Scenarios

- **Zoho CRM Unavailable**
  - **Scenario**: Zoho API downtime or maintenance
  - **Impact**: No data updates, stale information
  - **Handling**: Cached data mode, clear staleness indicators, retry queue

- **Partial Sync Failure**
  - **Scenario**: Sync fails after processing 50% of records
  - **Impact**: Inconsistent data state
  - **Handling**: Transaction rollback, resume capability from last successful record

- **Concurrent Modification**
  - **Scenario**: User modifies record in Pipeline Pulse while sync is running
  - **Impact**: Changes overwritten or conflicts created
  - **Handling**: Optimistic locking, merge strategies, user notifications

### 9.5 User Action Edge Cases

- **Bulk Update Conflicts**
  - **Scenario**: Bulk update attempts on records being synced
  - **Impact**: Inconsistent updates, potential data loss
  - **Handling**: Lock records during sync, queue bulk operations

- **Invalid Data Entry**
  - **Scenario**: User enters negative deal values or dates in future
  - **Impact**: Calculation errors, reporting issues
  - **Handling**: Frontend validation, backend sanitization

- **Permission Boundary Violations**
  - **Scenario**: User attempts to access territories they don't manage
  - **Impact**: Data breach, compliance issues
  - **Handling**: Row-level security, audit logging

### 9.6 Business Logic Edge Cases

- **Circular Dependencies**
  - **Scenario**: Opportunity A blocks B, B blocks C, C blocks A
  - **Impact**: Infinite loops in calculations
  - **Handling**: Dependency cycle detection, break circular references

- **Fiscal Year Transitions**
  - **Scenario**: Opportunities spanning multiple fiscal years
  - **Impact**: Incorrect period allocation
  - **Handling**: Prorated revenue recognition, fiscal year mapping

- **Territory Reassignments**
  - **Scenario**: Mass territory reorganization mid-quarter
  - **Impact**: Historical reporting inconsistencies
  - **Handling**: Point-in-time territory snapshots, as-was vs as-is reporting

## 10. Risks and Mitigation

### Technical Risks

- **Risk**: Zoho API rate limits
  - **Mitigation**: Implement intelligent caching and batch processing
  - **Contingency**: Manual data upload capability

- **Risk**: Data synchronization conflicts
  - **Mitigation**: Robust conflict resolution framework
  - **Contingency**: Conflict queue with manual resolution

### Business Risks

- **Risk**: User adoption resistance
  - **Mitigation**: Comprehensive training and change management
  - **Contingency**: Phased rollout with pilot groups

- **Risk**: Data quality issues
  - **Mitigation**: Data validation and cleansing processes
  - **Contingency**: Data quality dashboard and remediation workflows

### Operational Risks

- **Risk**: System performance degradation
  - **Mitigation**: Performance monitoring and auto-scaling
  - **Contingency**: Manual performance tuning, usage throttling

- **Risk**: Integration breaking changes
  - **Mitigation**: API version management, regression testing
  - **Contingency**: Rollback procedures, API adaptation layer

## 10. Timeline and Phases

### Phase 1: Foundation (Months 1-2)

- Core sync functionality
- Basic O2R tracking
- Currency standardization

### Phase 2: Intelligence (Months 3-4)

- GTM motion tracker
- Advanced analytics
- Bulk operations

### Phase 3: Optimization (Months 5-6)

- Performance optimization
- Advanced integrations
- Mobile optimization

## 11. Dependencies

- Access to Zoho CRM API
- Currency exchange rate service
- Cloud infrastructure (AWS)
- Development and QA resources

## 12. Approval and Sign-off

This document requires approval from:

- VP of Sales
- Director of Sales Operations
- CTO/Head of Engineering
- CFO (for budget approval)

---

*Document Version: 1.0*  
*Last Updated: [Current Date]*  
*Next Review: [Quarterly]*
