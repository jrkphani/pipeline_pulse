# Software Requirements Specification (SRS) - Pipeline Pulse

## 1. Introduction

This document details the functional and non-functional requirements for the Pipeline Pulse application, serving as a guide for the development and testing teams.

## 2. Overall Description

### 2.1 Product Scope

Pipeline Pulse is a web-based application designed to provide real-time sales pipeline intelligence by integrating with Zoho CRM. It automates data synchronization, offers advanced analytics, provides O2R (Opportunity-to-Revenue) tracking, GTM motion management, and tools for monitoring system health and data integrity.

### 2.2 User Characteristics

* **Sales Leaders**: Require high-level dashboards and aggregated metrics
* **Sales Operations Managers**: Need detailed sync control, conflict resolution, and in-depth data analysis capabilities
* **System Administrators**: Responsible for system configuration, monitoring, and troubleshooting
* **Account Executives**: Track their opportunities through O2R phases
* **Customer Success Managers**: Identify expansion opportunities
* **Finance Team**: Monitor revenue recognition and currency standardization

## 3. Functional Requirements (FR)

### 3.1 FR-SYNC: Data Synchronization

* **FR-SYNC-001**: Automated Full Sync on Startup
  * The system SHALL perform a full data synchronization from Zoho CRM upon application startup
  * Input: Application startup event
  * Output: All configured Zoho CRM modules (e.g., Deals, Contacts, Accounts) are synchronized with the Pipeline Pulse database
  * Dependencies: FR-SDK-001 (Zoho SDK Initialization)

* **FR-SYNC-002**: Automated Incremental Sync
  * The system SHALL perform incremental data synchronization from Zoho CRM at configurable intervals (default: 15 minutes)
  * Input: Scheduled timer event
  * Output: Only modified or new records since the last sync are updated in the Pipeline Pulse database
  * Dependencies: FR-SDK-001

* **FR-SYNC-003**: Manual Full Sync Trigger
  * The system SHALL provide a user interface element (button) to trigger a full data synchronization on demand
  * Input: User clicks "Trigger Full Sync" button
  * Output: A full sync process is initiated in the background
  * Dependencies: FR-API-001 (Backend API for Full Sync)

* **FR-SYNC-004**: Manual Incremental Sync Trigger
  * The system SHALL provide a user interface element (button) to trigger an incremental data synchronization on demand
  * Input: User clicks "Trigger Incremental Sync" button
  * Output: An incremental sync process is initiated in the background
  * Dependencies: FR-API-002 (Backend API for Incremental Sync)

* **FR-SYNC-005**: Live Sync Progress Streaming
  * The system SHALL stream real-time progress updates for an active sync session to the frontend
  * Input: Active sync session ID
  * Output: Continuous stream of JSON objects containing processed_records, total_records, progress_percentage, status, and record_type
  * Dependencies: FR-API-004 (Backend SSE Endpoint)

* **FR-SYNC-006**: Sync History Display
  * The system SHALL display a tabular view of recent sync sessions, including timestamp, type, status, message, records_processed, and duration
  * Input: User navigates to Sync Control Panel
  * Output: A table populated with historical sync data
  * Dependencies: FR-API-003 (Backend API for Sync History)

* **FR-SYNC-007**: Conflict Detection
  * The system SHALL automatically detect data conflicts between Zoho CRM and the local database during synchronization
  * Input: Data record during sync
  * Output: Identified conflicts are flagged and stored

* **FR-SYNC-008**: Conflict Resolution Interface
  * The system SHALL provide a user interface to review and resolve detected data conflicts
  * Input: User selects a conflict
  * Output: Display of conflicting field values (CRM vs. Local) and options for resolution (e.g., "Use CRM," "Use Local," "Merge")

* **FR-SYNC-009**: Sync Scheduling Configuration Interface
  * The system SHALL provide a user interface to view and modify the interval for automated incremental syncs
  * Input: User modifies sync interval
  * Output: Updated sync interval is saved and applied to the background scheduler

* **FR-SYNC-010**: Field Mapping Configuration
  * The system SHALL provide an interface to configure custom field mappings between Zoho CRM and Pipeline Pulse
  * Input: Administrator configures field mappings
  * Output: Mapping rules saved and applied during sync
  * Dependencies: FR-API-006

* **FR-SYNC-011**: Duplicate Record Detection
  * The system SHALL detect and handle duplicate records during synchronization
  * Input: Records from Zoho CRM
  * Output: Duplicate detection based on composite key (name + account + amount)
  * Processing: Flag duplicates, merge options, audit trail

* **FR-SYNC-012**: Deleted Record Management
  * The system SHALL handle records deleted in Zoho CRM
  * Input: Sync comparison results
  * Output: Soft delete with 90-day retention period
  * Processing: Mark as deleted, exclude from active reports, maintain audit trail

* **FR-SYNC-013**: Field Type Change Handling
  * The system SHALL handle field type changes in Zoho CRM
  * Input: Field metadata from CRM
  * Output: Type conversion or error notification
  * Processing: Attempt type coercion, log failures, notify admin

* **FR-SYNC-014**: Large Batch Processing
  * The system SHALL handle bulk imports exceeding 50,000 records
  * Input: Large data set from Zoho CRM
  * Output: Chunked processing with progress tracking
  * Processing: 5,000 record chunks, queue management, rate limit respect

* **FR-SYNC-015**: Sync Interruption Recovery
  * The system SHALL recover from interrupted sync operations
  * Input: Incomplete sync session
  * Output: Resume from last successful record
  * Processing: Checkpoint management, duplicate prevention, status tracking

* **FR-SYNC-016**: API Rate Limit Management
  * The system SHALL manage Zoho API rate limits proactively
  * Input: API usage metrics
  * Output: Throttled requests, deferred processing
  * Processing: Token bucket algorithm, exponential backoff, queue management

### 3.2 FR-MON: Monitoring & Health

* **FR-MON-001**: Global Data Freshness Indicator
  * The system SHALL display a global indicator showing the time since the last successful data synchronization
  * Input: Application loaded
  * Output: Indicator with text (e.g., "Synced 5m ago") and color-coded status (green, yellow, red) based on freshness thresholds
  * Dependencies: FR-API-003 (Backend API for Sync Health)

* **FR-MON-002**: Global Data Discrepancy Indicator
  * The system SHALL display a global indicator showing the presence and summary of data discrepancies
  * Input: Application loaded
  * Output: Indicator with a warning icon and a tooltip summarizing discrepancies
  * Dependencies: FR-API-003

* **FR-MON-003**: Sync Health Dashboard Display
  * The system SHALL display a comprehensive health dashboard on the Sync Control Panel, including:
    * Connection Status to Zoho CRM
    * Zoho API Rate Limit Usage (remaining/total)
    * Overall Sync Success Rate (percentage)
    * Average Sync Time
    * Number of Pending Conflicts
    * Last Successful Sync Timestamp
  * Input: User navigates to Sync Control Panel
  * Output: Dashboard populated with real-time health metrics
  * Dependencies: FR-API-003

* **FR-MON-004**: System Performance Metrics
  * The system SHALL track and display system performance metrics
  * Input: System operations
  * Output: Response time, database performance, user activity metrics
  * Dependencies: FR-API-007

### 3.3 FR-O2R: Opportunity-to-Revenue Tracking

* **FR-O2R-001**: Phase-based Opportunity Display
  * The system SHALL display opportunities organized by O2R phases (I-IV)
  * Input: User navigates to O2R dashboard
  * Output: Visual representation of opportunities in each phase with phase progression indicators
  * Dependencies: FR-API-008

* **FR-O2R-002**: Health Status Calculation
  * The system SHALL automatically calculate and assign health status to each opportunity
  * Input: Opportunity data with milestone dates
  * Output: Health status (Green/Yellow/Red/Blocked) based on defined criteria:
    * Green: All milestones on track
    * Yellow: Minor delays (14+ days kickoff delay, 60+ days execution)
    * Red: Critical issues (30+ days proposal stall, 45+ days payment overdue)
    * Blocked: External blockers reported
  * Dependencies: FR-API-009

* **FR-O2R-003**: Milestone Tracking
  * The system SHALL track key revenue milestones for each opportunity
  * Input: Milestone dates from Zoho CRM
  * Output: Milestone status tracking for:
    * Proposal submission date
    * PO generation date
    * Kickoff date
    * Invoice date
    * Payment received date
    * Revenue recognition date
  * Dependencies: FR-API-010

* **FR-O2R-004**: Attention Required Dashboard
  * The system SHALL provide a dedicated view for opportunities requiring immediate attention
  * Input: User accesses attention required view
  * Output: Filtered list of RED and BLOCKED opportunities with:
    * Critical delay indicators
    * Financial risk assessment
    * Customer issue tracking
    * Process issue identification
  * Dependencies: FR-API-011

* **FR-O2R-005**: Phase Velocity Analytics
  * The system SHALL calculate and display phase velocity metrics
  * Input: Historical opportunity data
  * Output: Average time per phase, bottleneck identification, trend analysis
  * Dependencies: FR-API-012

* **FR-O2R-006**: Territory and Service Line Breakdown
  * The system SHALL provide O2R analytics by territory and service line
  * Input: Opportunity data with territory/service tags
  * Output: Phase distribution and health metrics by dimension
  * Dependencies: FR-API-013

* **FR-O2R-007**: Retrograde Phase Movement Handling
  * The system SHALL track and manage opportunities moving backward in phases
  * Input: Phase change event
  * Output: Movement history, reason capture, review flag
  * Processing: Maintain all milestone data, alert on regression

* **FR-O2R-008**: Stale Opportunity Management
  * The system SHALL identify and handle long-inactive opportunities
  * Input: Opportunity last modified date
  * Output: Stale opportunity report with archival options
  * Processing: 90-day inactivity flag, 180-day escalation, archival workflow

* **FR-O2R-009**: Multiple Payment Milestone Support
  * The system SHALL support multiple payment events per opportunity
  * Input: Multiple invoice/payment records
  * Output: Aggregated payment tracking with individual milestone visibility
  * Processing: Payment schedule management, partial payment handling

### 3.4 FR-GTM: Go-to-Market Motion Tracker

* **FR-GTM-001**: Customer Journey Classification
  * The system SHALL automatically classify customers by journey type
  * Input: Customer and opportunity data
  * Output: Classification as new/existing/dormant with AWS segment mapping
  * Dependencies: FR-API-014

* **FR-GTM-002**: Playbook Assignment
  * The system SHALL assign appropriate sales playbooks based on customer segment
  * Input: Customer classification
  * Output: Assigned playbook with stage-specific activities
  * Dependencies: FR-API-015

* **FR-GTM-003**: Activity Tracking
  * The system SHALL track GTM motion activities
  * Input: Activity completion data
  * Output: Activity timeline with outcomes and next steps
  * Dependencies: FR-API-016

* **FR-GTM-004**: Expansion Opportunity Identification
  * The system SHALL identify expansion opportunities for existing customers
  * Input: Customer service usage and engagement data
  * Output: Ranked list of expansion opportunities with value estimates
  * Dependencies: FR-API-017

* **FR-GTM-005**: AWS Alignment Tracking
  * The system SHALL track AWS program utilization
  * Input: AWS program data
  * Output: Co-sell opportunities, MAP funding, POC credits tracking
  * Dependencies: FR-API-018

* **FR-GTM-006**: Motion Performance Analytics
  * The system SHALL provide analytics on GTM motion effectiveness
  * Input: Historical motion data
  * Output: Conversion rates, velocity metrics, playbook performance
  * Dependencies: FR-API-019

### 3.5 FR-FIN: Financial Intelligence

* **FR-FIN-001**: Currency Standardization to SGD
  * The system SHALL automatically convert all financial amounts to SGD for display
  * Input: Opportunity amounts in various local currencies
  * Output: Standardized SGD amounts in all dashboards and analytics
  * Processing: User enters in local currency, system converts to SGD using Currency Freaks API rates
  * Dependencies: FR-API-020, Currency Freaks API integration

* **FR-FIN-002**: Weekly Exchange Rate Management
  * The system SHALL update exchange rates weekly using Currency Freaks API
  * Input: Scheduled weekly trigger (Monday 00:00 UTC)
  * Output: Updated exchange rates for all supported currencies to SGD
  * Processing: Fetch rates from Currency Freaks API, store with timestamp, maintain 90-day history
  * Dependencies: FR-API-021, Currency Freaks API subscription

* **FR-FIN-003**: User Currency Preference
  * The system SHALL allow users to set their preferred local currency for data entry
  * Input: User currency selection in profile settings
  * Output: Currency preference saved, input fields show local currency symbol
  * Processing: Store preference per user, apply to all monetary input fields

* **FR-FIN-004**: Revenue Forecasting in SGD
  * The system SHALL generate all revenue forecasts in SGD
  * Input: Multi-currency opportunity data with probabilities
  * Output: Consolidated SGD forecast reports
  * Processing: Convert all amounts to SGD using current rates, aggregate by probability
  * Dependencies: FR-API-022

* **FR-FIN-005**: Currency Conversion Transparency
  * The system SHALL display conversion details for all amounts
  * Input: Any monetary value in non-SGD currency
  * Output: Tooltip showing original amount, currency, rate, and conversion date
  * Processing: Store original currency and amount, display on hover

* **FR-FIN-006**: Financial Risk Assessment in SGD
  * The system SHALL identify financial risks with all values in SGD
  * Input: Payment status and deal health data in multiple currencies
  * Output: Risk dashboard with SGD values for global comparison
  * Dependencies: FR-API-023

* **FR-FIN-007**: Currency Conversion Failure Handling
  * The system SHALL handle Currency Freaks API failures gracefully
  * Input: Failed weekly rate update
  * Output: Continue using last known rates with staleness indicator
  * Processing: Flag rates older than 7 days, allow manual update trigger, email notification to admin

* **FR-FIN-008**: Exchange Rate History Management
  * The system SHALL maintain 90 days of exchange rate history
  * Input: Weekly rate updates
  * Output: Historical rate data for reporting and audit
  * Processing: Store rates with effective date, enable point-in-time conversions

* **FR-FIN-009**: Manual Rate Override
  * The system SHALL allow authorized users to manually update exchange rates
  * Input: Admin enters rate for specific currency pair
  * Output: Override rate applied with audit trail
  * Processing: Validate rate reasonableness, log who/when/why

* **FR-FIN-010**: Currency Support Validation
  * The system SHALL validate all currencies against Currency Freaks API supported list
  * Input: Currency code from opportunity
  * Output: Valid/invalid status with fallback options
  * Processing: Check against cached supported currency list, update list weekly

### 3.6 FR-BULK: Bulk Operations

* **FR-BULK-001**: Multi-Record Selection
  * The system SHALL allow users to select multiple records for bulk operations
  * Input: User selects records via checkboxes
  * Output: Selected record count and bulk action menu
  * Dependencies: FR-API-024

* **FR-BULK-002**: Field Validation for Bulk Updates
  * The system SHALL validate field values before bulk updates
  * Input: Field selection and new value
  * Output: Validation results with picklist options for restricted fields
  * Dependencies: FR-API-025

* **FR-BULK-003**: Bulk Update Preview
  * The system SHALL show a preview of changes before committing bulk updates
  * Input: Selected records and field changes
  * Output: Preview table with old and new values
  * Dependencies: FR-API-026

* **FR-BULK-004**: Bulk CRM Sync
  * The system SHALL sync bulk updates back to Zoho CRM
  * Input: Approved bulk changes
  * Output: Sync status with success/failure counts
  * Dependencies: FR-API-027

* **FR-BULK-005**: Bulk Update History
  * The system SHALL maintain an audit trail of bulk operations
  * Input: Completed bulk operations
  * Output: History log with rollback capability
  * Dependencies: FR-API-028

* **FR-BULK-006**: Bulk Operation Failure Handling
  * The system SHALL handle bulk operation failures with transaction integrity
  * Input: Failed bulk update
  * Output: Rollback with detailed error report
  * Processing: All-or-nothing transactions, per-record error details, retry mechanism

* **FR-BULK-007**: Bulk Operation Permissions
  * The system SHALL enforce role-based limits on bulk operations
  * Input: User role and bulk operation request
  * Output: Permission check result with approval workflow if needed
  * Processing: Record count limits by role, approval for >1000 records

* **FR-BULK-008**: Concurrent Bulk Operation Prevention
  * The system SHALL prevent conflicting bulk operations
  * Input: Bulk operation on records being synced
  * Output: Lock status and queued operation
  * Processing: Record-level locking, operation queue, conflict notification

### 3.7 FR-ANL: Analytics and Reporting

* **FR-ANL-001**: Pipeline Analytics Dashboard
  * The system SHALL provide comprehensive pipeline analytics
  * Input: Current opportunity data
  * Output: Pipeline value by stage, conversion rates, deal size trends
  * Dependencies: FR-API-029

* **FR-ANL-002**: Territory Performance Analysis
  * The system SHALL analyze performance by territory
  * Input: Territory-tagged opportunity data
  * Output: Comparative territory metrics with drill-down capability
  * Dependencies: FR-API-030

* **FR-ANL-003**: Service Line Analytics
  * The system SHALL track metrics by service line
  * Input: Service-tagged opportunity data
  * Output: Revenue by service, adoption rates, cross-sell analysis
  * Dependencies: FR-API-031

* **FR-ANL-004**: Executive Dashboard
  * The system SHALL provide executive-level business intelligence
  * Input: Aggregated pipeline data
  * Output: KPI scorecards, trend analysis, predictive insights
  * Dependencies: FR-API-032

* **FR-ANL-005**: Custom Report Builder
  * The system SHALL allow users to create custom reports
  * Input: User-defined metrics and filters
  * Output: Custom report with export capability
  * Dependencies: FR-API-033

* **FR-ANL-006**: Report Scheduling
  * The system SHALL support scheduled report generation and distribution
  * Input: Report configuration and schedule
  * Output: Automated report delivery via email
  * Dependencies: FR-API-034

### 3.8 FR-UI: User Interface

* **FR-UI-001**: Responsive Design Implementation
  * The system SHALL adapt to different screen sizes
  * Input: Various device viewports
  * Output: Optimized layouts for desktop, tablet, and mobile

* **FR-UI-002**: Global Search
  * The system SHALL provide global search across all data
  * Input: Search query
  * Output: Filtered results across opportunities, accounts, contacts
  * Dependencies: FR-API-035

* **FR-UI-003**: Advanced Filtering
  * The system SHALL support complex filter combinations
  * Input: Multiple filter criteria
  * Output: Filtered data views with save filter capability
  * Dependencies: FR-API-036

* **FR-UI-004**: Dashboard Customization
  * The system SHALL allow users to customize their dashboards
  * Input: Widget selection and arrangement
  * Output: Personalized dashboard layouts
  * Dependencies: FR-API-037

* **FR-UI-005**: Data Export
  * The system SHALL support data export in multiple formats
  * Input: User export request
  * Output: CSV, Excel, or PDF file download
  * Dependencies: FR-API-038

### 3.9 FR-API: Backend API Endpoints

* **FR-API-001**: Trigger Full Sync Endpoint
  * Method: POST
  * Path: `/api/sync/full`
  * Response: `{"success": true, "message": "Full sync initiated", "session_id": "uuid"}`

* **FR-API-002**: Trigger Incremental Sync Endpoint
  * Method: POST
  * Path: `/api/sync/incremental`
  * Response: `{"success": true, "message": "Incremental sync initiated", "session_id": "uuid"}`

* **FR-API-003**: Sync Health Endpoint
  * Method: GET
  * Path: `/api/sync/health`
  * Response: `{"lastSyncTimestamp": "ISO_DATETIME", "diffSummary": {"local_db_only": int, "zoho_only": int}, "syncInProgress": bool, "rateLimitStatus": {"remaining": int, "limit": int}}`

* **FR-API-004**: Live Sync Stream Endpoint (SSE)
  * Method: GET
  * Path: `/api/sync/stream/{session_id}`
  * Response: Event stream with sync progress updates

* **FR-API-005**: Sync History Endpoint
  * Method: GET
  * Path: `/api/sync/history`
  * Query Parameters: limit, offset
  * Response: Array of sync session objects

* **FR-API-006**: Field Mapping Configuration Endpoint
  * Method: GET/POST
  * Path: `/api/sync/field-mappings`
  * Response: Field mapping configuration

* **FR-API-007**: System Performance Metrics Endpoint
  * Method: GET
  * Path: `/api/system/metrics`
  * Response: Performance metrics object

* **FR-API-008**: O2R Dashboard Data Endpoint
  * Method: GET
  * Path: `/api/o2r/dashboard`
  * Response: Opportunities organized by phase with health status

* **FR-API-009**: O2R Health Status Calculation Endpoint
  * Method: POST
  * Path: `/api/o2r/calculate-health`
  * Response: Health status for opportunities

* **FR-API-010**: O2R Milestone Tracking Endpoint
  * Method: GET/PUT
  * Path: `/api/o2r/milestones/{opportunity_id}`
  * Response: Milestone data for opportunity

* **FR-API-011**: Attention Required Opportunities Endpoint
  * Method: GET
  * Path: `/api/o2r/attention-required`
  * Response: Filtered list of critical opportunities

* **FR-API-012**: Phase Velocity Analytics Endpoint
  * Method: GET
  * Path: `/api/o2r/analytics/velocity`
  * Response: Phase velocity metrics

* **FR-API-013**: O2R Territory/Service Analytics Endpoint
  * Method: GET
  * Path: `/api/o2r/analytics/breakdown`
  * Query Parameters: dimension (territory/service)
  * Response: Analytics by dimension

* **FR-API-014**: Customer Classification Endpoint
  * Method: POST
  * Path: `/api/gtm/classify-customer`
  * Response: Customer journey and segment classification

* **FR-API-015**: Playbook Assignment Endpoint
  * Method: GET
  * Path: `/api/gtm/assign-playbook`
  * Response: Assigned playbook with activities

* **FR-API-016**: GTM Activity Tracking Endpoint
  * Method: POST/GET
  * Path: `/api/gtm/activities`
  * Response: Activity tracking data

* **FR-API-017**: Expansion Opportunities Endpoint
  * Method: GET
  * Path: `/api/gtm/expansion-opportunities`
  * Response: Ranked expansion opportunities

* **FR-API-018**: AWS Alignment Tracking Endpoint
  * Method: GET/POST
  * Path: `/api/gtm/aws-alignment`
  * Response: AWS program utilization data

* **FR-API-019**: GTM Performance Analytics Endpoint
  * Method: GET
  * Path: `/api/gtm/analytics`
  * Response: Motion performance metrics

* **FR-API-020**: Currency Conversion Endpoint
  * Method: POST
  * Path: `/api/finance/convert-currency`
  * Request: `{"amount": number, "from_currency": "USD", "to_currency": "SGD", "date": "ISO_DATE"}`
  * Response: `{"original_amount": number, "original_currency": string, "converted_amount": number, "target_currency": "SGD", "exchange_rate": number, "rate_date": "ISO_DATE", "rate_source": "currency_freaks"}`

* **FR-API-021**: Exchange Rate Management Endpoint
  * Method: GET/POST
  * Path: `/api/finance/exchange-rates`
  * GET Response: `{"rates": {"USD_SGD": 1.35, "EUR_SGD": 1.45, ...}, "last_updated": "ISO_DATETIME", "next_update": "ISO_DATETIME", "source": "currency_freaks"}`
  * POST Request: `{"trigger_update": true}` (manual update trigger)

* **FR-API-022**: Revenue Forecast Endpoint
  * Method: GET
  * Path: `/api/finance/forecast`
  * Query Parameters: period (weekly/monthly/quarterly)
  * Response: `{"total_pipeline_sgd": number, "weighted_forecast_sgd": number, "by_probability": {...}, "currency_breakdown": {...}}`

* **FR-API-023**: Financial Risk Assessment Endpoint
  * Method: GET
  * Path: `/api/finance/risk-assessment`
  * Response: `{"high_risk_deals_sgd": number, "at_risk_revenue_sgd": number, "currency_exposure": {...}, "payment_delays": [...]}`

* **FR-API-046**: User Currency Preference Endpoint
  * Method: GET/PUT
  * Path: `/api/user/currency-preference`
  * PUT Request: `{"preferred_currency": "USD"}`
  * Response: `{"user_id": string, "preferred_currency": string, "updated_at": "ISO_DATETIME"}`

* **FR-API-047**: Currency Freaks Integration Status Endpoint
  * Method: GET
  * Path: `/api/finance/currency-api-status`
  * Response: `{"api_status": "active", "last_successful_update": "ISO_DATETIME", "rate_staleness_days": number, "supported_currencies": ["USD", "EUR", ...]}`

* **FR-API-048**: Manual Rate Override Endpoint
  * Method: POST
  * Path: `/api/finance/override-rate`
  * Request: `{"from_currency": "USD", "to_currency": "SGD", "rate": number, "reason": string}`
  * Response: `{"override_id": string, "applied_by": string, "applied_at": "ISO_DATETIME"}`

* **FR-API-024**: Bulk Record Selection Endpoint
  * Method: POST
  * Path: `/api/bulk/select-records`
  * Response: Selection confirmation

* **FR-API-025**: Field Validation Endpoint
  * Method: GET
  * Path: `/api/bulk/validate-field`
  * Response: Field validation rules and options

* **FR-API-026**: Bulk Update Preview Endpoint
  * Method: POST
  * Path: `/api/bulk/preview`
  * Response: Preview of changes

* **FR-API-027**: Bulk CRM Sync Endpoint
  * Method: POST
  * Path: `/api/bulk/sync-to-crm`
  * Response: Sync status and results

* **FR-API-028**: Bulk Update History Endpoint
  * Method: GET
  * Path: `/api/bulk/history`
  * Response: Audit trail of bulk operations

* **FR-API-029**: Pipeline Analytics Endpoint
  * Method: GET
  * Path: `/api/analytics/pipeline`
  * Response: Comprehensive pipeline metrics

* **FR-API-030**: Territory Performance Endpoint
  * Method: GET
  * Path: `/api/analytics/territory`
  * Response: Territory-based performance data

* **FR-API-031**: Service Line Analytics Endpoint
  * Method: GET
  * Path: `/api/analytics/service-line`
  * Response: Service line metrics

* **FR-API-032**: Executive Dashboard Endpoint
  * Method: GET
  * Path: `/api/analytics/executive`
  * Response: Executive KPIs and insights

* **FR-API-033**: Custom Report Builder Endpoint
  * Method: POST
  * Path: `/api/analytics/custom-report`
  * Response: Generated custom report

* **FR-API-034**: Report Scheduling Endpoint
  * Method: POST/GET
  * Path: `/api/analytics/schedule-report`
  * Response: Scheduled report configuration

* **FR-API-035**: Global Search Endpoint
  * Method: GET
  * Path: `/api/search`
  * Query Parameters: query, type
  * Response: Search results

* **FR-API-036**: Advanced Filter Endpoint
  * Method: POST
  * Path: `/api/filter`
  * Response: Filtered data results

* **FR-API-037**: Dashboard Customization Endpoint
  * Method: GET/PUT
  * Path: `/api/user/dashboard-config`
  * Response: Dashboard configuration

* **FR-API-038**: Data Export Endpoint
  * Method: POST
  * Path: `/api/export`
  * Response: File download URL

* **FR-API-039**: Duplicate Detection Endpoint
  * Method: POST
  * Path: `/api/sync/detect-duplicates`
  * Response: List of potential duplicates with similarity scores

* **FR-API-040**: Stale Opportunity Report Endpoint
  * Method: GET
  * Path: `/api/o2r/stale-opportunities`
  * Query Parameters: days_inactive (default: 90)
  * Response: List of stale opportunities with last activity dates

* **FR-API-041**: Rate Limit Status Endpoint
  * Method: GET
  * Path: `/api/sync/rate-limit-status`
  * Response: Current usage, limits, reset time

* **FR-API-042**: Error Reporting Endpoint
  * Method: POST
  * Path: `/api/errors/report`
  * Request: Error details, context, user action
  * Response: Error ticket ID

* **FR-API-043**: System Health Check Endpoint
  * Method: GET
  * Path: `/api/health`
  * Response: Component status, degradation indicators

* **FR-API-044**: Data Recovery Endpoint
  * Method: POST
  * Path: `/api/recovery/restore`
  * Request: Timestamp, scope
  * Response: Recovery job status

* **FR-API-045**: Concurrent Lock Management Endpoint
  * Method: GET/POST/DELETE
  * Path: `/api/locks/{resource_type}/{resource_id}`
  * Response: Lock status, owner, expiry

### 3.11 FR-ERR: Error Handling and Recovery

* **FR-ERR-001**: Global Error Handling Framework
  * The system SHALL implement comprehensive error handling across all modules
  * Input: Any system error
  * Output: User-friendly message, error log, recovery options
  * Processing: Error classification, context preservation, suggested actions

* **FR-ERR-002**: Data Recovery Mechanism
  * The system SHALL support point-in-time data recovery
  * Input: Recovery request with timestamp
  * Output: Restored data state
  * Processing: Backup retrieval, integrity verification, audit logging

* **FR-ERR-003**: Operation Rollback Capability
  * The system SHALL support rollback of failed operations
  * Input: Failed operation ID
  * Output: Restored pre-operation state
  * Processing: Transaction log replay, state verification

* **FR-ERR-004**: Offline Mode Support
  * The system SHALL provide read-only access during system unavailability
  * Input: Connection failure
  * Output: Cached data access with staleness indicator
  * Processing: Local storage cache, queue pending operations

* **FR-ERR-005**: Concurrent Access Control
  * The system SHALL manage concurrent data access conflicts
  * Input: Multiple users accessing same record
  * Output: Conflict prevention or resolution
  * Processing: Optimistic locking, merge strategies, real-time notifications

* **FR-ERR-006**: System Degradation Handling
  * The system SHALL gracefully degrade functionality during partial failures
  * Input: Component failure
  * Output: Limited functionality with clear indicators
  * Processing: Feature toggle, fallback modes, user notification

* **FR-ERR-007**: Circular Dependency Detection
  * The system SHALL detect and break circular dependencies in opportunity blocking
  * Input: Dependency graph
  * Output: Cycle detection and resolution options
  * Processing: Graph traversal, cycle breaking, admin notification

* **FR-ERR-008**: Data Validation and Sanitization
  * The system SHALL validate and sanitize all user inputs
  * Input: User-provided data
  * Output: Validated data or error message
  * Processing: Type checking, range validation, SQL injection prevention

* **FR-SDK-001**: Zoho SDK Initialization
  * The backend system SHALL initialize the Zoho CRM SDK upon application startup
  * Input: Application startup
  * Output: Zoho SDK configured with OAuth credentials, data center, and token store
  * Details: Uses zcrmsdk package, DBStore for token persistence in PostgreSQL

* **FR-SDK-002**: OAuth Token Management
  * The system SHALL automatically manage Zoho OAuth access and refresh tokens
  * Input: SDK initialization, token refresh events
  * Output: Access tokens refreshed as needed, tokens stored securely

* **FR-SDK-003**: Data Retrieval via SDK
  * The system SHALL retrieve data from Zoho CRM modules
  * Input: Sync trigger (manual/automated)
  * Output: Raw CRM data fetched with pagination support

* **FR-SDK-004**: Data Update via SDK
  * The system SHALL update data in Zoho CRM using the SDK
  * Input: Conflict resolution, O2R update, bulk updates
  * Output: Data written back to Zoho CRM

* **FR-SDK-005**: Custom Field Handling
  * The system SHALL support Zoho custom fields
  * Input: Custom field definitions
  * Output: Custom field data synchronized and mapped

## 4. Non-Functional Requirements (NFR)

### 4.1 NFR-PERF: Performance

* **NFR-PERF-001**: Sync Duration
  * Full data synchronization SHALL complete within 60 minutes for up to 100,000 records
  * Incremental data synchronization SHALL complete within 5 minutes for typical daily changes

* **NFR-PERF-002**: API Response Time
  * Backend API endpoints (excluding streaming) SHALL respond within 200ms for 95% of requests under normal load

* **NFR-PERF-003**: UI Responsiveness
  * Frontend UI SHALL remain responsive during background sync operations
  * Live progress updates SHALL be displayed with minimal latency (< 1 second)

* **NFR-PERF-004**: Report Generation
  * Standard reports SHALL generate within 5 seconds
  * Complex custom reports SHALL generate within 30 seconds

* **NFR-PERF-005**: Search Performance
  * Global search SHALL return results within 2 seconds for datasets up to 1 million records

### 4.2 NFR-SEC: Security

* **NFR-SEC-001**: Credential Management
  * All sensitive credentials SHALL be stored securely using AWS Secrets Manager
  * No hardcoded credentials SHALL exist in the codebase

* **NFR-SEC-002**: Data Access Control
  * Access to backend API endpoints SHALL be controlled via role-based permissions
  * User sessions SHALL expire after 8 hours of inactivity

* **NFR-SEC-003**: Data Privacy
  * Sensitive CRM data SHALL be handled in accordance with GDPR and data privacy regulations
  * PII SHALL be encrypted at rest and in transit

* **NFR-SEC-004**: Audit Logging
  * All data modifications SHALL be logged with user, timestamp, and change details
  * Audit logs SHALL be retained for minimum 1 year

* **NFR-SEC-005**: API Security
  * All API endpoints SHALL use HTTPS
  * API rate limiting SHALL be implemented to prevent abuse

### 4.3 NFR-USAB: Usability

* **NFR-USAB-001**: Intuitive Interface
  * The application SHALL be usable without training for users familiar with CRM systems
  * Core functions SHALL be accessible within 3 clicks from dashboard

* **NFR-USAB-002**: Clear Feedback
  * The system SHALL provide clear visual feedback for all user actions within 200ms
  * Error messages SHALL include actionable resolution steps

* **NFR-USAB-003**: Responsive Design
  * The frontend SHALL be fully responsive across devices (desktop, tablet, mobile)
  * Critical functions SHALL be accessible on mobile devices

* **NFR-USAB-004**: Consistent Design
  * The frontend SHALL adhere to 1CloudHub design system
  * UI components SHALL maintain consistent behavior across the application

* **NFR-USAB-005**: Accessibility
  * The application SHALL meet WCAG 2.1 Level AA standards
  * All interactive elements SHALL be keyboard navigable

### 4.4 NFR-MAINT: Maintainability

* **NFR-MAINT-001**: Code Quality
  * Code coverage SHALL be maintained above 80%
  * All code SHALL pass linting and formatting checks

* **NFR-MAINT-002**: Type Safety
  * All TypeScript code SHALL be strictly typed
  * Any types SHALL be documented and justified

* **NFR-MAINT-003**: Testability
  * All business logic SHALL have unit tests
  * Critical workflows SHALL have integration tests

* **NFR-MAINT-004**: Documentation
  * All APIs SHALL have OpenAPI/Swagger documentation
  * Complex algorithms SHALL have inline documentation

* **NFR-MAINT-005**: Database Migrations
  * All schema changes SHALL use Alembic migrations
  * Migrations SHALL be reversible

### 4.5 NFR-SCAL: Scalability

* **NFR-SCAL-001**: Data Volume
  * The system SHALL handle up to 1 million CRM records
  * Performance SHALL degrade gracefully beyond design limits

* **NFR-SCAL-002**: Concurrent Users
  * The system SHALL support 100 concurrent active users
  * Response time SHALL not degrade more than 20% at peak load

* **NFR-SCAL-003**: API Rate Limits
  * The system SHALL respect Zoho API rate limits
  * Automatic retry with exponential backoff SHALL be implemented

* **NFR-SCAL-004**: Database Scalability
  * Database SHALL support horizontal scaling
  * Read replicas SHALL be supported for analytics queries

### 4.6 NFR-RELI: Reliability

* **NFR-RELI-001**: Error Handling
  * All errors SHALL be caught and logged
  * User-facing errors SHALL not expose system internals

* **NFR-RELI-002**: Data Integrity
  * Database transactions SHALL ensure ACID compliance
  * Sync conflicts SHALL never result in data loss

* **NFR-RELI-003**: Uptime
  * System SHALL maintain 99.9% uptime (excluding planned maintenance)
  * Planned maintenance SHALL not exceed 4 hours per month

* **NFR-RELI-004**: Disaster Recovery
  * Database backups SHALL occur daily
  * Recovery Point Objective (RPO) SHALL be 24 hours
  * Recovery Time Objective (RTO) SHALL be 4 hours

* **NFR-RELI-005**: Monitoring
  * System health metrics SHALL be monitored continuously
  * Alerts SHALL be triggered for critical issues

### 4.7 NFR-EDGE: Edge Case Handling

* **NFR-EDGE-001**: Duplicate Record Handling
  * The system SHALL detect duplicates with 95% accuracy using composite keys
  * Duplicate merge SHALL preserve all historical data

* **NFR-EDGE-002**: Large Dataset Performance
  * Bulk operations on 50,000+ records SHALL complete within 30 minutes
  * Memory usage SHALL not exceed 4GB during large operations

* **NFR-EDGE-003**: Currency Edge Cases
  * The system SHALL support 150+ currency codes as provided by Currency Freaks API
  * Exchange rate cache SHALL maintain 90 days of historical rates
  * Rate staleness indicator SHALL appear after 7 days without update
  * Manual rate update SHALL be available to authorized users
  * Rate variance >20% in a week SHALL trigger alerts

* **NFR-EDGE-004**: Concurrent Operation Handling
  * The system SHALL support 50 concurrent bulk operations
  * Lock timeout SHALL be configurable (default: 5 minutes)
  * Deadlock detection SHALL trigger within 30 seconds

* **NFR-EDGE-005**: Data Recovery Requirements
  * Point-in-time recovery SHALL be available for past 30 days
  * Recovery operations SHALL complete within 2 hours for 1M records
  * Recovery SHALL not impact live system performance

## 5. External Interface Requirements

### 5.1 User Interfaces

* Web-based responsive UI using React and TypeScript
* Support for modern browsers (Chrome, Firefox, Safari, Edge)
* Mobile-responsive design for tablets and smartphones

### 5.2 Hardware Interfaces

* No specific hardware requirements beyond standard web client devices

### 5.3 Software Interfaces

* Zoho CRM API v4/v6 for data synchronization
* Currency Freaks API for weekly exchange rate updates
* AWS services (Secrets Manager, RDS, etc.)
* Email service for report distribution

### 5.4 Communication Interfaces

* HTTPS for all client-server communication
* WebSocket/SSE for real-time updates
* REST API for all backend services

## 6. System Features Priority

### Priority 1 (Core - Must Have)

* Data synchronization (FR-SYNC)
* O2R tracking (FR-O2R)
* Basic analytics (FR-ANL-001)
* Currency standardization (FR-FIN-001)

### Priority 2 (Important - Should Have)

* GTM motion tracker (FR-GTM)
* Bulk operations (FR-BULK)
* Advanced analytics (FR-ANL-002 to FR-ANL-004)
* System monitoring (FR-MON)

### Priority 3 (Desirable - Could Have)

* Custom reporting (FR-ANL-005)
* Report scheduling (FR-ANL-006)
* Dashboard customization (FR-UI-004)
* Advanced filtering (FR-UI-003)

## 7. Constraints

### Technical Constraints

* Zoho API rate limits (max 1000 calls per hour)
* Currency Freaks API rate limits (per subscription tier)
* PostgreSQL database size limitations
* Browser compatibility requirements

### Business Constraints

* Budget limitations for third-party services
* Timeline constraints for phased delivery
* Compliance with data protection regulations

### Operational Constraints

* Integration with existing 1CloudHub infrastructure
* Maintenance windows aligned with business hours
* Training requirements for end users

---

*Document Version: 1.0*  
*Last Updated: [Current Date]*  
*Next Review: [Sprint Planning]*
