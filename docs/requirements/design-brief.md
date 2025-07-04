# Pipeline Pulse Complete Design Brief

## 1. Executive Summary

Pipeline Pulse is an enterprise-grade sales intelligence platform that transforms Zoho CRM data into actionable revenue insights. This comprehensive design brief outlines the complete UX/UI requirements for a system that serves sales leaders, operations managers, and revenue teams with real-time pipeline visibility, O2R (Opportunity-to-Revenue) tracking, and financial intelligence standardized in SGD.

**Design Philosophy**: Professional trust with approachable intelligence - enterprise aesthetics that inspire confidence while maintaining daily usability for sales teams.

---

## 2. Design System Foundation

### 2.1 Brand Identity & Visual Language

**Core Principles:**

- **Data Clarity**: Complex insights made instantly understandable
- **Professional Trust**: Enterprise-grade aesthetics that inspire confidence
- **Operational Efficiency**: Every element serves a purpose in the revenue workflow
- **Adaptive Intelligence**: Responsive to user needs and system states

**Color System:**

- **Primary Purple**: `oklch(0.606 0.25 292.717)` (light), `oklch(0.541 0.281 293.009)` (dark)
- **Status Colors**: Green (On Track), Yellow (Minor Issues), Red (Critical), Gray (Blocked)
- **Chart Palette**: 5-color data visualization system
- **Semantic Colors**: Clear system states and health indicators

**Typography:**

- **Font Family**: Inter (primary), JetBrains Mono (monospace)
- **Scale**: Design token-based sizing (`--pp-font-size-*`)
- **Hierarchy**: Clear information hierarchy for data scanning

**Spacing System:**

- **Base Unit**: 4px increment system
- **Tokens**: `--pp-space-*` (4px to 80px)
- **Application**: Consistent spacing across all components

### 2.2 Component Architecture

**Base Layer** (shadcn/ui):

- Button, Card, Table, Dialog, Select, etc.

**Pipeline Pulse Layer**:

- MetricCard, StatusBadge, O2RPhaseIndicator
- SyncProgressBar, HealthIndicator, CurrencyDisplay

**Composite Layer**:

- OpportunityCard, DashboardWidget, FilterPanel
- NotificationCenter, BulkSelector, ReportBuilder

---

## 3. Information Architecture & Navigation

### 3.1 Complete Sitemap

```
Pipeline Pulse Application Structure
├── 🏠 Dashboard (/)
│   ├── Executive Overview (/dashboard/executive)
│   ├── Sales Manager View (/dashboard/sales)
│   ├── Operations View (/dashboard/operations)
│   └── Custom Dashboard (/dashboard/custom)
│
├── 📊 Pipeline (/pipeline)
│   ├── All Opportunities (/pipeline/all)
│   ├── My Opportunities (/pipeline/my)
│   ├── Territory View (/pipeline/territory/{id})
│   ├── Service Line View (/pipeline/service/{line})
│   ├── Opportunity Details (/pipeline/opportunity/{id})
│   │   ├── Overview Tab
│   │   ├── Activity Timeline Tab
│   │   ├── Documents Tab
│   │   ├── Team Tab
│   │   └── History Tab
│   └── Pipeline Analytics (/pipeline/analytics)
│
├── 🎯 O2R Tracker (/o2r)
│   ├── Phase Overview (/o2r/phases)
│   │   ├── Phase I - Opportunity (/o2r/phase/1)
│   │   ├── Phase II - Proposal (/o2r/phase/2)
│   │   ├── Phase III - Execution (/o2r/phase/3)
│   │   └── Phase IV - Revenue (/o2r/phase/4)
│   ├── Health Dashboard (/o2r/health)
│   ├── Attention Required (/o2r/attention)
│   ├── Milestone Tracker (/o2r/milestones)
│   ├── Phase Analytics (/o2r/analytics)
│   └── O2R Configuration (/o2r/config) [Admin]
│
├── 🚀 GTM Motion (/gtm)
│   ├── Customer Journey Map (/gtm/journey)
│   ├── Playbook Management (/gtm/playbooks)
│   ├── AWS Alignment (/gtm/aws)
│   ├── Expansion Opportunities (/gtm/expansion)
│   └── Activity Management (/gtm/activities)
│
├── 💰 Financial Intelligence (/finance)
│   ├── Revenue Dashboard (/finance/revenue)
│   ├── Currency Management (/finance/currency)
│   ├── Forecasting (/finance/forecast)
│   ├── Risk Assessment (/finance/risk)
│   └── Payment Tracking (/finance/payments)
│
├── 📈 Analytics (/analytics)
│   ├── Executive Reports (/analytics/executive)
│   ├── Sales Performance (/analytics/sales)
│   ├── Pipeline Analytics (/analytics/pipeline)
│   ├── Service Line Analytics (/analytics/services)
│   ├── Custom Reports (/analytics/custom)
│   └── Data Export (/analytics/export)
│
├── 🔄 Sync Control (/sync)
│   ├── Sync Dashboard (/sync/dashboard)
│   ├── Manual Sync (/sync/manual)
│   ├── Sync History (/sync/history)
│   ├── Conflict Resolution (/sync/conflicts)
│   ├── Field Mapping (/sync/mappings) [Admin]
│   └── API Monitoring (/sync/monitoring)
│
├── ⚡ Bulk Operations (/bulk)
│   ├── Bulk Update (/bulk/update)
│   ├── Bulk Import (/bulk/import)
│   ├── Operation History (/bulk/history)
│   └── Data Management (/bulk/management)
│
├── ⚙️ Administration (/admin)
│   ├── User Management (/admin/users)
│   ├── System Configuration (/admin/config)
│   ├── System Health (/admin/health)
│   ├── Audit Logs (/admin/audit)
│   └── Integration Management (/admin/integrations)
│
├── 🔍 Search & Filters (/search)
├── 🔔 Notifications (/notifications)
├── 👤 User Profile (/profile)
└── 📚 Help & Support (/help)
```

### 3.2 Navigation Framework

#### Primary Navigation (Sidebar)

- **Collapsed**: 64px width, icons only
- **Expanded**: 280px width, icons + labels
- **Behavior**: Hover to preview when collapsed
- **Role-based**: Menu items visible based on permissions

#### Global Header

- **Left**: Logo, breadcrumbs
- **Center**: Global search
- **Right**: Notifications, user menu, sync status

#### Command Palette

- **Trigger**: Cmd/Ctrl + K
- **Features**: Fuzzy search, action execution, recent items
- **Context**: Aware of current page and user role

---

## 4. Feature-Specific Design Specifications

## Feature Name: Dashboard & Executive Overview

#### Screen(s) / View(s)

- Main Dashboard
- Executive Dashboard  
- Role-specific Dashboard Views

##### User Stories / Key Scenarios

* As a sales leader, I want to see pipeline health at a glance so that I can identify issues immediately
- As an executive, I want high-level KPIs and trends without drilling into details
- As a sales operations manager, I want to monitor sync health alongside pipeline metrics

##### Key Functionality & Requirements

* Customizable widget layout with drag-and-drop
- Real-time metric updates via WebSocket
- Drill-down capabilities to detailed views
- Export dashboard as PDF with branding
- Time period selectors (Last 30/60/90 days, Custom)
- Role-based default layouts and permissions

##### UI/UX Considerations & Design Details

- **User Goals & Tasks:** Immediate insight into pipeline health, quick identification of attention areas, executive decision support
- **Information Architecture:**
  - Top row: Key metrics (4-column grid on desktop)
  - Middle section: Charts (2-column layout with responsive stacking)
  - Bottom section: Attention required table with pagination
  - Side panel: Filters and time period controls
- **Progressive Disclosure:**
  - Summary metrics → hover for trends → click for detailed charts → drill down to opportunity lists
  - Widget settings on hover → full customization in edit mode
- **Visual Hierarchy:**
  - Metric cards with `--pp-font-size-2xl` values in `--pp-color-primary-500`
  - Status badges using semantic color system
  - White space using `--pp-space-6` between major sections
  - Chart titles in `--pp-font-size-lg` with `--pp-font-weight-semibold`
- **Affordances & Signifiers:**
  - Clickable metrics with subtle hover states (shadow elevation)
  - Chart interaction hints (crosshair cursors, hover tooltips)
  - Drag handles visible in edit mode
  - Export button with download icon
- **Consistency:**
  - MetricCard components reused across all dashboards
  - Chart color palette consistent with design tokens
  - Loading states match global skeleton patterns
- **Accessibility (A11y):**
  - Chart data available in accessible table format via "View Data" button
  - Keyboard navigation between widgets using Tab/Arrow keys
  - Screen reader announcements for metric updates
  - High contrast mode support for charts
- **Error Prevention & Handling:**
  - Graceful degradation when sync data unavailable
  - "Last updated" timestamps on all metrics
  - Fallback to cached data with staleness indicator
  - Clear error messages with retry options
- **Feedback:**
  - Loading skeletons for metrics during data fetch
  - Real-time updates with subtle pulse animations
  - Success toast notifications for dashboard saves
  - Progress indicators for PDF export generation
- **Performance:**
  - Progressive loading of widgets based on viewport
  - Virtualized tables for large datasets
  - Cached metric calculations with smart invalidation
  - Debounced dashboard auto-save
- **Device Considerations:**
  - Mobile: Single column stack, swipeable metric cards, simplified charts
  - Tablet: 2-column grid, touch-friendly controls, collapsible filters
  - Desktop: Full 4-column grid, hover interactions, detailed tooltips
  - XL: Extended metrics, side-by-side comparisons, persistent filters
- **Microcopy:**
  - Contextual tooltips: "Pipeline value including probability weighting"
  - Trend indicators: "↑ 12% vs last period"
  - Empty states: "No critical items - your pipeline is healthy!"
  - Loading states: "Refreshing metrics..."
- **Animations:**
  - Number transitions using `--pp-duration-normal` (200ms)
  - Chart entry animations with staggered reveals
  - Smooth widget rearrangement during customization
  - Subtle pulse for real-time updates
- **State Handling:**
  - Remember dashboard customizations per user
  - Persist time period selections across sessions
  - Auto-save layout changes after 2-second delay
  - Restore scroll position on navigation return
- **Interaction Design:**
  - Drag-and-drop widget rearrangement with grid snapping
  - Click metrics to drill down to source data
  - Right-click for contextual actions menu
  - Bulk widget actions via selection
- **Focus Management:**
  - Tab through widgets in logical order
  - Enter to interact with charts
  - Escape to exit edit mode
  - Arrow keys for chart navigation
- **Component Design:**
  - MetricCard with trend indicators and click handlers
  - StatusBadge with consistent coloring and sizing
  - Area charts using recharts with Pipeline Pulse theme
  - CustomizationPanel with drag handles and settings
- **Content Adaptability:**
  - Responsive chart sizing with maintained aspect ratios
  - Metric value truncation with full value in tooltips
  - Dynamic chart type selection based on screen size
  - Abbreviated labels on small screens
- **Real-time Data Considerations:**
  - WebSocket updates for critical metrics every 30 seconds
  - Last updated timestamps with auto-refresh indicators
  - Optimistic UI updates with rollback on failure
  - Connection status indicator in header

---

## Feature Name: Zoho CRM Data Synchronization Management

#### Screen(s) / View(s)

- Sync Control Panel
- Sync History Log with filters
- Field Mapping Configuration
- Conflict Resolution Interface
- API Rate Limit Monitor

##### User Stories / Key Scenarios

* As a System Administrator, I want the system to automatically synchronize data from Zoho CRM at regular intervals so that the analytical data is always fresh
- As a Sales Operations Manager, I want to manually trigger synchronization and monitor progress in real-time with detailed logging
- As a Sales Operations Manager, I want to resolve data conflicts between Zoho CRM and Pipeline Pulse with clear comparison views

##### Key Functionality & Requirements

* Automated sync scheduling (15-minute default, configurable)
- Manual sync triggers (full and incremental) with progress tracking
- Live progress monitoring with Server-Sent Events (SSE)
- Conflict detection and resolution with audit trail
- Sync history with detailed logs and search capability
- Field mapping configuration with validation
- API rate limit monitoring with proactive alerts

##### UI/UX Considerations & Design Details

- **User Goals & Tasks:** Ensure data freshness, resolve conflicts quickly, monitor sync health, prevent data loss
- **Information Architecture:**
  - Main panel: Current sync status and primary controls
  - Sub-tabs: History, Conflicts, Field Mappings, Settings, Monitoring
  - Status overview: Connection health, last sync, pending conflicts
  - Detail panels: Progress tracking, error logs, resolution workflows
- **Progressive Disclosure:**
  - Summary status → detailed progress → granular logs → individual record details
  - Conflict overview → field-by-field comparison → resolution options → audit trail
- **Visual Hierarchy:**
  - Large sync button with primary color and loading states
  - Progress bar prominent during active sync with percentage and ETA
  - Conflict count badge in `--pp-color-danger-500` with urgent styling
  - Rate limit gauge with color coding (green/yellow/red)
- **Affordances & Signifiers:**
  - Pulsing indicator during active sync operations
  - Disabled state for sync button during operation with spinner
  - Color-coded status indicators throughout interface
  - Interactive progress bars with click to view details
- **Consistency:**
  - Progress bars match loading states elsewhere in application
  - Table styles consistent with other data views
  - Error messaging follows global pattern
  - Icon usage aligned with system iconography
- **Accessibility (A11y):**
  - Screen reader announcements for sync status changes
  - Keyboard shortcuts (S for sync, H for history)
  - ARIA live regions for progress updates
  - High contrast support for status indicators
- **Error Prevention & Handling:**
  - Confirmation dialog for full sync with impact warning
  - Clear error messages with resolution steps and contact info
  - Automatic retry with exponential backoff visualization
  - Validation before allowing conflicting operations
- **Feedback:**
  - Real-time progress percentage with records processed count
  - Record count updates during sync operation
  - Success/failure toast notifications with action buttons
  - Email notifications for critical sync failures
- **Performance:**
  - Chunked processing visualization (5,000 record batches)
  - Non-blocking UI during sync with background processing
  - Efficient log pagination with virtual scrolling
  - Cached conflict resolution for similar cases
- **Device Considerations:**
  - Mobile: Simplified progress view, essential controls only, swipe for actions
  - Tablet: Compact control panel, touch-friendly conflict resolution
  - Desktop: Full control panel with all options visible
  - XL: Side-by-side sync comparison views, extended monitoring
- **Microcopy:**
  - Progress: "Syncing... 2,456 of 10,000 records (24% complete, ~3 min remaining)"
  - Status: "Last synced 5 minutes ago - 1,247 records updated"
  - Conflicts: "3 conflicts require your attention"
  - Errors: "Sync interrupted due to API rate limit. Retrying in 2 minutes."
- **Animations:**
  - Progress bar smooth transitions with realistic timing
  - Record count incrementing animation with easing
  - Success checkmark animation with celebration micro-interaction
  - Conflict indicator pulse to draw attention
- **State Handling:**
  - Persist sync preferences (interval, notification settings)
  - Queue management for multiple sync requests with priority
  - Checkpoint recovery for interrupted syncs with resume capability
  - Conflict resolution state preservation during session
- **Interaction Design:**
  - One-click sync triggers with confirmation for destructive actions
  - Drag to select conflict resolution preference
  - Inline field mapping editors with real-time validation
  - Bulk conflict resolution with pattern recognition
- **Focus Management:**
  - Auto-focus on conflict resolution options when opened
  - Tab through field mappings in logical order
  - Escape to cancel operations safely
  - Enter to confirm resolution choices
- **Component Design:**
  - Custom SyncProgressBar with detailed tooltip information
  - ConflictResolver with side-by-side comparison layout
  - FieldMapper with drag-and-drop interface and validation
  - RateLimitGauge with threshold warnings
- **Real-time Data Considerations:**
  - Server-sent events for sync progress with 1-second updates
  - Live rate limit gauge with usage tracking
  - Streaming logs with search and filter capability
  - WebSocket connection for immediate conflict notifications
- **Enterprise UX Patterns:**
  - Bulk conflict resolution with saved resolution patterns
  - Sync scheduling with business hours consideration
  - Audit trail for all sync operations with export capability
  - Role-based access to sensitive sync operations

---

## Feature Name: O2R (Opportunity-to-Revenue) Tracking Interface

#### Screen(s) / View(s)

- O2R Pipeline View (Kanban-style)
- Phase Detail View with timeline
- Health Status Dashboard
- Attention Required View with filtering
- Milestone Timeline View
- Phase Analytics Dashboard

##### User Stories / Key Scenarios

* As a Sales Manager, I want to track opportunities through O2R phases so I can ensure deals progress efficiently and identify bottlenecks
- As a Revenue Operations Manager, I want to identify bottlenecks in our revenue process with velocity analytics
- As an Account Executive, I want to see which deals need my immediate attention with clear action items

##### Key Functionality & Requirements

* Four-phase visual pipeline (Opportunity → Proposal → Execution → Revenue)
- Automated health status calculation (Green/Yellow/Red/Blocked) with configurable rules
- Milestone tracking with alerts and deadline management
- Phase velocity analytics with bottleneck identification
- Territory and service line filtering with saved views
- Attention required dashboard with prioritization

##### Health Status Logic Implementation

- **🟢 Green (On Track)**: All milestones met, no overdue items, regular updates
- **🟡 Yellow (Minor Issues)**: 14+ day kickoff delay, 60+ day execution, probability mismatches
- **🔴 Red (Critical)**: 30+ day proposal stall, 45+ day payment overdue, critical delays
- **⬛ Blocked (External)**: Customer blockers, third-party dependencies, compliance issues

##### UI/UX Considerations & Design Details

- **User Goals & Tasks:** Monitor deal progression, identify stuck deals, take action on at-risk opportunities, forecast revenue accurately
- **Information Architecture:**
  - Main view: Kanban-style phase columns with drag-and-drop
  - Detail view: Individual opportunity timeline with milestone tracking
  - Analytics view: Phase velocity metrics and trend analysis
  - Filter panel: Territory, service line, date range, health status
- **Progressive Disclosure:**
  - Phase overview → opportunity cards → detailed timeline → milestone details
  - Health indicator → specific issues → recommended actions → action tracking
- **Visual Hierarchy:**
  - Phase headers with deal counts and total values in SGD
  - Color-coded health status borders (4px left border) matching status system
  - Critical deals with larger card size and elevated shadow
  - Milestone indicators with progress bars and date information
- **Affordances & Signifiers:**
  - Draggable cards between phases with validation and constraints
  - Health status icons with descriptive tooltips
  - Clickable cards for drill-down details
  - Hover states revealing quick actions (edit, view, flag)
- **Consistency:**
  - O2RPhaseIndicator component used throughout application
  - StatusBadge styling matches global semantic color patterns
  - Card layouts consistent with other list views
  - Timeline components shared with GTM motion tracker
- **Accessibility (A11y):**
  - Keyboard navigation between phases using arrow keys
  - Screen reader announcements for phase changes and health updates
  - Color-blind friendly status indicators (icons + colors + patterns)
  - Alternative table view for screen reader users
- **Error Prevention & Handling:**
  - Phase transition validation with business rule enforcement
  - Confirmation dialogs for backward movements with reason capture
  - Clear blocking reasons with resolution suggestions
  - Undo capability for accidental phase changes
- **Feedback:**
  - Smooth card movement animations with physics-based motion
  - Phase transition success confirmation with visual celebration
  - Real-time health status updates with notification badges
  - Progress indicators for milestone completion
- **Performance:**
  - Virtual scrolling for large phase columns (1000+ opportunities)
  - Lazy loading of opportunity details on demand
  - Optimistic UI updates with rollback on server rejection
  - Debounced search and filtering
- **Device Considerations:**
  - Mobile: Horizontal scroll through phases, collapsed cards with essential info
  - Tablet: Touch-friendly drag operations, modal detail views
  - Desktop: All phases visible, detailed cards with hover actions
  - XL: Extended card information, inline editing, multi-column analytics
- **Microcopy:**
  - Status descriptions: "In Phase II for 45 days (typically 30 days)"
  - Alerts: "⚠️ Payment overdue by 15 days - action required"
  - Actions: "Update Milestone", "Flag Issue", "Request Review"
  - Empty states: "No opportunities in this phase"
- **Animations:**
  - Card slide between phases with spring physics
  - Health status pulse for critical items requiring attention
  - Milestone completion celebration with confetti micro-interaction
  - Smooth column resize during filter application
- **State Handling:**
  - Remember filter preferences per user with cloud sync
  - Persist column widths and sort preferences
  - Cache card positions during drag operations
  - Maintain scroll position on navigation return
- **Interaction Design:**
  - Drag cards between phases with visual feedback
  - Click to expand details with smooth animation
  - Hover for quick actions with floating toolbar
  - Bulk selection with shift+click and ctrl+click
- **Focus Management:**
  - Tab through phases in logical order
  - Arrow keys navigate within phase columns
  - Enter opens detail view with proper focus
  - Escape closes overlays and returns focus
- **Component Design:**
  - OpportunityCard with health indicator and action menu
  - PhaseColumn with drop zones and scroll handling
  - MilestoneTimeline with interactive markers
  - HealthIndicator with tooltip explanations
- **Real-time Data Considerations:**
  - Live health status calculations based on milestone changes
  - Instant phase transition updates across user sessions
  - Real-time notifications for new critical items
  - WebSocket updates for collaborative editing
- **Pipeline Pulse Specific:**
  - O2R phase progression rules engine with customizable thresholds
  - Health calculation based on configurable business rules
  - Integration with GTM motion tracking for unified customer view
  - Currency standardization showing all values in SGD

---

## Feature Name: GTM Motion Tracker

#### Screen(s) / View(s)

- Customer Journey Map View
- Playbook Assignment Dashboard
- Activity Tracking Timeline  
- Expansion Opportunity Matrix
- AWS Alignment Scorecard

##### User Stories / Key Scenarios

* As a Sales Operations Manager, I want to track customer journeys aligned with our AWS partnership to maximize co-sell opportunities
- As a Customer Success Manager, I want to identify expansion opportunities in existing accounts with data-driven insights
- As an Account Executive, I want the right playbook automatically assigned based on customer segment and journey stage

##### Key Functionality & Requirements

* Customer journey visualization (New/Existing/Dormant) with progression tracking
- AWS segment mapping (Startup/Scale/Focus/Deep) with program alignment
- Automated playbook assignment based on customer profile and stage
- Activity tracking with outcomes and next step recommendations
- Expansion opportunity scoring with value estimation
- AWS program utilization tracking (co-sell, MAP funding, POC credits)

##### UI/UX Considerations & Design Details

- **User Goals & Tasks:** Align sales activities with customer journey stage, maximize AWS partnership benefits, identify growth opportunities
- **Information Architecture:**
  - Journey overview with segment distribution visualization
  - Individual customer journey timelines with activity history
  - Playbook library with assignment rules and performance metrics
  - Expansion matrix with opportunity scoring and prioritization
- **Progressive Disclosure:**
  - Segment summary → customer list → individual journey → detailed activities
  - High-level opportunities → detailed analysis → action recommendations
- **Visual Hierarchy:**
  - Journey stages as horizontal timeline with progress indicators
  - AWS segment badges with official AWS colors and branding
  - Expansion opportunities heat map with color-coded value ranges
  - Activity cards with completion status and outcome indicators
- **Affordances & Signifiers:**
  - Interactive journey timeline with clickable stages
  - Draggable activities to different stages with validation
  - Clickable playbook templates with preview capability
  - Expandable opportunity cards with detailed information
- **Consistency:**
  - Timeline components match O2R phase timeline design
  - Activity cards similar to task cards used elsewhere
  - AWS branding elements consistent with official guidelines
  - Color coding aligned with global status system
- **Accessibility (A11y):**
  - Journey stage descriptions for screen readers
  - Keyboard navigation through timeline elements
  - Alternative table view for complex journey data
  - High contrast mode for AWS segment badges
- **Error Prevention & Handling:**
  - Playbook compatibility validation before assignment
  - Activity prerequisite checking with clear requirements
  - Clear segment assignment rules with validation
  - Confirmation for journey stage changes
- **Feedback:**
  - Activity completion animations with progress indication
  - Playbook assignment confirmation with next steps
  - Real-time journey progression updates
  - Success metrics for completed playbooks
- **Performance:**
  - Lazy loading of historical activities with pagination
  - Cached playbook templates with smart invalidation
  - Efficient journey calculations with background processing
  - Optimized expansion scoring algorithm
- **Device Considerations:**
  - Mobile: Vertical journey timeline with swipe navigation
  - Tablet: Horizontal timeline with touch-friendly controls
  - Desktop: Full timeline with detailed activity views
  - XL: Multiple customer journeys comparison view
- **Microcopy:**
  - Status indicators: "Ready for Scale-Up playbook"
  - Opportunities: "3 expansion opportunities identified ($450K potential)"
  - AWS programs: "Eligible for MAP funding", "POC credits available"
  - Actions: "Assign Playbook", "Schedule Activity", "Update Stage"
- **Animations:**
  - Journey progression animations with stage transitions
  - Activity completion celebrations with visual feedback
  - Smooth playbook transitions with content morphing
  - Expansion opportunity reveal animations
- **State Handling:**
  - Remember selected segments and filters
  - Persist playbook customizations per customer type
  - Cache journey calculations for performance
  - Maintain timeline position during updates
- **Interaction Design:**
  - Click stages to filter customers by journey position
  - Drag to assign playbooks with visual feedback
  - Hover for opportunity details with rich tooltips
  - Context menus for bulk actions
- **Component Design:**
  - JourneyTimeline with interactive milestone markers
  - PlaybookCard with completion metrics and assignment controls
  - ExpansionMatrix with value indicators and priority scoring
  - AWSAlignmentBadge with program status and benefits
- **Real-time Data Considerations:**
  - Live journey stage updates based on activity completion
  - Real-time activity tracking with team collaboration
  - Instant playbook performance metrics updates
  - WebSocket notifications for team activities

---

## Feature Name: Currency Standardization and Financial Intelligence

#### Screen(s) / View(s)

- Financial Dashboard
- Currency Conversion Settings
- Exchange Rate Management
- Revenue Forecasting View
- Financial Risk Assessment Panel
- User Currency Preference Settings

##### User Stories / Key Scenarios

* As a Finance Manager, I want all amounts automatically converted to SGD for consistent reporting across global operations
- As a Sales Leader, I want to see probability-weighted revenue forecasts in SGD with confidence intervals
- As a Revenue Operations Manager, I want to identify financial risks in the pipeline with SGD values for standardized comparison
- As a User, I want to enter deal values in my local currency while the system displays everything in SGD automatically
- As a System Administrator, I want to manage exchange rate updates and handle API failures gracefully

##### Key Functionality & Requirements

* User enters amounts in their preferred local currency with intuitive input
- System automatically converts and displays all amounts in SGD throughout application
- Weekly exchange rate updates via Currency Freaks API (Mondays 00:00 UTC)
- 90-day exchange rate history retention with trend analysis
- Manual rate override capability for authorized users with audit trail
- Fallback to cached rates when API unavailable with staleness indicators
- Currency conversion transparency with detailed tooltips
- Support for 150+ currencies via Currency Freaks API

##### UI/UX Considerations & Design Details

- **User Goals & Tasks:** Enter deals in familiar currency, view standardized SGD reporting, ensure accurate financial forecasting, maintain data integrity
- **Information Architecture:**
  - User profile: Currency preference setting with search capability
  - Financial dashboard: All values in SGD with conversion indicators
  - Settings: Exchange rate management for administrators
  - Reports: SGD-based analytics with original currency reference
- **Progressive Disclosure:**
  - SGD totals → hover for original currency → click for conversion details → rate history
  - Current rates → rate history → manual override options → audit trail
- **Visual Hierarchy:**
  - Large SGD values as primary display using `--pp-font-size-2xl`
  - Original currency in smaller text or tooltips using `--pp-font-size-sm`
  - Rate staleness indicators when > 7 days using warning colors
  - Manual override badges for admin-adjusted rates with distinct styling
- **Affordances & Signifiers:**
  - Currency selector dropdown in user preferences with flag icons
  - Hover tooltips showing: original amount, currency, rate, conversion date
  - Warning icons for stale rates (>7 days) with exclamation mark
  - Lock icon for manually overridden rates with admin badge
- **Consistency:**
  - All monetary displays show SGD with identical formatting (currency symbol, decimal places)
  - Currency tooltips follow consistent pattern across application
  - Rate staleness warnings use same visual language as other system alerts
  - Number formatting respects regional preferences while maintaining SGD standard
- **Accessibility (A11y):**
  - Screen readers announce "Amount in Singapore Dollars" for all values
  - Conversion details available via keyboard navigation (Tab to reveal)
  - Currency symbols properly labeled with full currency names
  - Number formatting respects user locale settings for accessibility
- **Error Prevention & Handling:**
  - Currency Freaks API failure: Continue with cached rates + prominent staleness indicator
  - Invalid currency codes: Real-time validation against supported currency list
  - Extreme rate fluctuations (>20%/week): Alert notifications to administrators
  - Missing historical rates: Use earliest available rate with clear disclaimer
- **Feedback:**
  - Input field shows local currency symbol based on user preference
  - Real-time conversion preview as user types in input fields
  - Success toast notification when exchange rates successfully updated
  - Warning banner when using stale rates with update option
- **Performance:**
  - Weekly rate updates cached for 90 days with efficient storage
  - Instant conversions using cached rates with sub-100ms response
  - Batch conversion for reports with progress indication
  - Lazy loading of historical rate data on demand
- **Device Considerations:**
  - Mobile:
    - Simplified currency input with native numeric keyboard
    - Essential conversion info only in compact format
    - Swipe gesture to reveal original amounts
    - Touch-friendly currency selector
  - Desktop:
    - Full conversion details on hover with rich tooltips
    - Rate management panel for administrators
    - Keyboard shortcuts for currency selection
  - XL:
    - Multi-currency comparison tables for analysis
    - Extended rate history views with charts
    - Side-by-side original vs converted views
- **Microcopy:**
  - Input placeholder: "Enter amount in USD" (based on user preference)
  - Conversion tooltip: "USD 100,000 → SGD 135,000 (rate: 1.35, updated 2 days ago)"
  - Stale rate warning: "⚠️ Exchange rates last updated 8 days ago. Click to refresh."
  - API failure message: "Using cached rates from March 15. Administrator can update manually."
- **Animations:**
  - Smooth number transitions during conversion with counting animation
  - Subtle pulse animation on successful rate update
  - Fade in/out for conversion tooltips with appropriate timing
  - Loading spinner during rate fetch operations
- **State Handling:**
  - User's preferred currency persisted in profile with cloud sync
  - Current exchange rates maintained in application state
  - Rate update history cached with automatic cleanup
  - Manual overrides stored with complete audit trail
- **Interaction Design:**
  - Currency preference dropdown in user settings with search capability
  - Hover any SGD amount to reveal original currency information
  - Click rate information for detailed history and trending
  - Admin: Manual rate update form with validation and confirmation
- **Focus Management:**
  - Tab to currency amounts reveals conversion tooltip
  - Enter on amount opens detailed conversion information
  - Currency selector fully keyboard navigable with type-ahead
  - Escape closes overlays and returns to previous focus
- **Component Design:**
  - CurrencyInput: Shows local currency symbol, converts on blur with validation
  - SGDDisplay: Formatted SGD amount with conversion tooltip on hover
  - RateIndicator: Shows freshness status and data source
  - RateManager: Administrative interface for manual updates and monitoring
- **Content Adaptability:**
  - Currency codes adapt to available space (USD vs US Dollar vs $)
  - Large numbers abbreviated appropriately (1.2M SGD vs SGD 1,200,000)
  - Conversion details responsive to container size and context
  - Tooltip positioning adapts to screen boundaries
- **Real-time Data Considerations:**
  - Weekly automated rate updates with status notifications
  - Real-time conversion calculations as users input values
  - Live staleness indicators updating automatically
  - Instant application of admin rate overrides across all users
- **Enterprise UX Patterns:**
  - Comprehensive audit trail for all rate changes with timestamps
  - Bulk conversion capabilities for historical data analysis
  - Rate locking functionality for specific reporting periods
  - Currency validation against business rules and compliance requirements
- **Pipeline Pulse Specific:**
  - All pipeline values displayed in SGD for consistent analysis
  - O2R phase values standardized in SGD for cross-phase comparison
  - Territory performance comparisons in single currency
  - Risk assessments based on SGD values for global consistency

### Currency Preference Setting (User Profile)

##### Visual Design

- Located in User Settings → Preferences section
- Searchable dropdown with flag icons + currency code + full name
- Shows current selection with confirmation of change impact
- Default currency based on user's Zoho CRM locale detection

### Exchange Rate Management (Admin Only)

##### Visual Design

- Admin → System Settings → Exchange Rates
- Comprehensive table showing: Currency, Current Rate, Last Updated, Source, Actions
- Manual update modal with rate validation and impact preview
- Historical rate charts per currency with trend analysis
- Batch update capability for multiple currencies

### Rate Staleness Indicators

##### Visual States

- **Fresh (0-7 days)**: Green dot indicator, no warning messages
- **Stale (8-14 days)**: Yellow dot with subtle warning banner
- **Critical (15+ days)**: Red dot with prominent warning and update prompt
- **Manual Override**: Blue dot with lock icon and admin attribution

---

## Feature Name: Bulk Operations and Data Management

#### Screen(s) / View(s)

- Bulk Operations Panel
- Selection Management Interface
- Preview Changes Modal
- Bulk Operation History
- Progress Tracking View

##### User Stories / Key Scenarios

* As a Sales Operations Manager, I want to update multiple opportunity fields simultaneously to improve data consistency
- As a Data Administrator, I want to preview changes before applying bulk updates to prevent data corruption
- As a Sales Manager, I want to track the history of bulk changes for audit purposes and compliance

##### Key Functionality & Requirements

* Multi-record selection interface with advanced filtering
- Field validation before updates with business rule enforcement
- Change preview with rollback capability and conflict detection
- CRM sync for bulk changes with status tracking
- Operation history with undo functionality and audit trail
- Role-based operation limits with approval workflows

##### UI/UX Considerations & Design Details

- **User Goals & Tasks:** Efficiently update multiple records, ensure data accuracy, maintain comprehensive audit trail, prevent errors
- **Information Architecture:**
  - Selection interface with advanced filters and search
  - Field update form with validation and dependency checking
  - Preview modal with before/after comparison
  - History log with detailed operation tracking and rollback options
- **Progressive Disclosure:**
  - Select records → choose fields → configure changes → preview → confirm → execute
  - Operation overview → detailed changes → affected records → audit information
- **Visual Hierarchy:**
  - Selection count prominently displayed with visual emphasis
  - Changed values highlighted with color coding and diff visualization
  - Primary action buttons clearly visible with appropriate styling
  - Progress indicators for long-running operations
- **Affordances & Signifiers:**
  - Checkbox selection patterns following email client conventions
  - Drag selection capability for contiguous record groups
  - Clear preview indicators with before/after states
  - Undo buttons styled consistently with global undo patterns
- **Consistency:**
  - Selection patterns match familiar email client interfaces
  - Preview layout similar to code diff tools and version control
  - Progress indicators consistent with sync operation displays
  - Error messaging follows global application patterns
- **Accessibility (A11y):**
  - Keyboard multi-select using Shift+arrows and Ctrl+click
  - Screen reader announcements for selection changes
  - Clear focus indicators for all interactive elements
  - Alternative keyboard shortcuts for bulk actions
- **Error Prevention & Handling:**
  - Real-time validation before preview with clear error messages
  - Comprehensive rollback capabilities with transaction integrity
  - All-or-nothing transaction processing to prevent partial failures
  - Confirmation dialogs for potentially destructive operations
- **Feedback:**
  - Selection count badge with real-time updates
  - Detailed progress bars for bulk operations with ETA
  - Comprehensive success/failure summaries with actionable next steps
  - Toast notifications for operation completion
- **Performance:**
  - Virtualized selection lists for large datasets (10,000+ records)
  - Chunked processing with progress visualization
  - Optimistic UI updates with server confirmation
  - Background processing for large operations
- **Device Considerations:**
  - Mobile: Simplified selection interface, essential fields only, touch-friendly controls
  - Tablet: Condensed interface with touch-optimized bulk selection
  - Desktop: Full bulk operation interface with all available options
  - XL: Side-by-side before/after preview with detailed comparison
- **Microcopy:**
  - Selection summary: "Update 47 opportunities across 3 territories"
  - Validation warnings: "3 validation warnings found - review before proceeding"
  - Operation guidance: "Changes will be synced to Zoho CRM automatically"
  - Rollback instructions: "Undo available for 24 hours after operation"
- **Animations:**
  - Smooth selection animations with visual feedback
  - Progress bar updates with realistic timing and smoothing
  - Success celebrations for completed operations
  - Subtle hover effects for interactive elements
- **State Handling:**
  - Persist selections during preview process with recovery
  - Remember frequently used filter criteria
  - Cache rollback data for recovery operations
  - Maintain operation context across page transitions
- **Component Design:**
  - BulkSelector with count badge and selection tools
  - ChangePreview with diff highlighting and comparison
  - ProgressTracker with stage indicators and time estimates
  - OperationHistory with filtering and search capabilities
- **Enterprise UX Patterns:**
  - Select all with intelligent exception handling
  - Saved selection criteria for repeated operations
  - Scheduled bulk operations with approval workflows
  - Multi-level approval for large-scale updates

---

## Feature Name: Analytics and Reporting Dashboard

#### Screen(s) / View(s)

- Pipeline Analytics Dashboard
- Territory Performance View
- Service Line Analytics
- Custom Report Builder
- Executive Scorecard

##### User Stories / Key Scenarios

* As a Sales Leader, I want comprehensive pipeline analytics to identify trends and bottlenecks across territories
- As a Regional Director, I want to compare territory performance with drill-down capabilities
- As an Executive, I want high-level KPIs and predictive insights for strategic decision-making

##### Key Functionality & Requirements

* Interactive pipeline visualization with multiple chart types
- Territory comparison tools with statistical analysis
- Service line performance metrics with cross-sell insights
- Custom report creation with drag-and-drop interface
- Automated report scheduling and distribution
- Export capabilities (PDF, Excel, CSV) with branding

##### UI/UX Considerations & Design Details

- **User Goals & Tasks:** Gain actionable insights from data, identify trends and patterns, make data-driven decisions, share insights
- **Information Architecture:**
  - Overview dashboard with key charts and metrics
  - Drill-down views by territory, service line, time period
  - Custom report builder with intuitive interface
  - Report library with organization and sharing capabilities
- **Progressive Disclosure:**
  - Summary metrics → interactive charts → detailed tables → raw data export
  - High-level insights → specific analysis → actionable recommendations
- **Visual Hierarchy:**
  - Large KPI numbers with trend indicators and context
  - Primary charts positioned above the fold
  - Secondary analyses and supporting data below
  - Clear visual separation between different insight categories
- **Affordances & Signifiers:**
  - Interactive chart elements with hover states and click actions
  - Draggable report builder components with visual feedback
  - Clickable chart legends with toggle functionality
  - Export buttons with clear format indicators
- **Consistency:**
  - Chart colors aligned with Pipeline Pulse design tokens
  - Consistent interaction patterns across all visualizations
  - Unified filtering interface across different report types
  - Standardized chart formatting and axis labeling
- **Accessibility (A11y):**
  - Chart data available in accessible table format
  - Keyboard navigation for all chart interactions
  - High contrast mode support for all visualizations
  - Screen reader compatible chart descriptions
- **Error Prevention & Handling:**
  - Intelligent prevention of invalid date ranges
  - Graceful handling of missing data with clear indicators
  - Clear error messages for failed operations
  - Fallback visualizations when primary charts fail
- **Feedback:**
  - Loading states for chart generation with progress indication
  - Detailed hover tooltips with contextual information
  - Export progress indicators with completion notifications
  - Real-time chart updates with smooth transitions
- **Performance:**
  - Progressive chart rendering with skeleton loading
  - Intelligent caching of expensive calculations
  - Efficient data aggregation with background processing
  - Optimized chart libraries for large datasets
- **Device Considerations:**
  - Mobile: Essential charts only with vertical layout optimization
  - Tablet: Responsive chart sizing with touch-friendly interactions
  - Desktop: Full analytics suite with detailed visualizations
  - XL: Multiple charts visible simultaneously with comparison views
- **Microcopy:**
  - Clear chart titles with business context
  - Helpful empty states with guidance for next steps
  - Export format descriptions with file size estimates
  - Loading messages that provide context and estimated time
- **Animations:**
  - Smooth chart entry animations with staggered reveals
  - Transitions between different views and time periods
  - Value change animations for real-time updates
  - Subtle hover effects that don't interfere with data reading
- **State Handling:**
  - Remember filter selections across sessions
  - Persist custom report configurations
  - Cache rendered charts for improved performance
  - Maintain scroll position during data updates
- **Component Design:**
  - Recharts integration with Pipeline Pulse theming
  - FilterPanel with saved filter sets and quick access
  - ReportBuilder with drag-and-drop component library
  - ExportManager with format selection and scheduling
- **Real-time Data Considerations:**
  - Configurable data refresh options (manual, scheduled, real-time)
  - Real-time KPI updates for current-day metrics
  - Streaming analytics for immediate insights
  - Live collaboration features for shared reports

---

## Feature Name: System Health and Monitoring Dashboard

#### Screen(s) / View(s)

- System Health Overview
- Performance Metrics Dashboard
- User Activity Monitor
- API Usage Tracker
- Alert Configuration

##### User Stories / Key Scenarios

* As a System Administrator, I want to monitor system performance and health proactively
- As a Sales Operations Manager, I want to ensure data freshness and system reliability
- As an Administrator, I want to track API usage against limits and prevent service interruptions

##### Key Functionality & Requirements

* Real-time system health indicators with alerting
- Performance metrics tracking with historical trends
- API rate limit monitoring with proactive warnings
- User activity logging with security monitoring
- Alert configuration with multiple notification channels
- Data freshness indicators with automatic refresh

##### UI/UX Considerations & Design Details

- **User Goals & Tasks:** Ensure system reliability, prevent issues before they occur, maintain optimal performance, monitor security
- **Information Architecture:**
  - System overview with comprehensive status grid
  - Detailed metrics per component with drill-down capability
  - Alert configuration panel with rule management
  - Activity logs with filtering and search
- **Progressive Disclosure:**
  - Overall health score → component status → detailed metrics → historical logs
  - Alert summary → configuration rules → notification settings
- **Visual Hierarchy:**
  - Large health indicator using semantic colors (green/yellow/red)
  - Component status grid with clear visual separation
  - Metric charts positioned below overview for detailed analysis
  - Alert indicators prominently displayed for immediate attention
- **Affordances & Signifiers:**
  - Clickable components for detailed information
  - Hoverable metrics for historical context
  - Clear alert indicators with appropriate urgency styling
  - Interactive configuration elements with immediate feedback
- **Consistency:**
  - Status colors match health indicators used throughout application
  - Metric cards follow same design patterns as pipeline metrics
  - Alert styling consistent with notification system
  - Performance charts use standard Pipeline Pulse chart styling
- **Accessibility (A11y):**
  - System status announced to screen readers with appropriate urgency
  - Keyboard navigation through all components and metrics
  - Alternative text for all status icons and indicators
  - High contrast support for critical alerts
- **Error Prevention & Handling:**
  - Proactive alerts before reaching critical thresholds
  - Clear remediation steps for common issues
  - Graceful degradation indicators with user guidance
  - Automated recovery procedures where possible
- **Feedback:**
  - Real-time status updates with immediate visual confirmation
  - Alert notifications through multiple channels
  - Performance trend indicators with context
  - Success confirmation for configuration changes
- **Performance:**
  - Efficient metric collection with minimal system impact
  - Lightweight monitoring that doesn't affect performance
  - Optimized queries for historical data analysis
  - Background processing for intensive monitoring tasks
- **Device Considerations:**
  - Mobile: Critical alerts and essential status only
  - Tablet: Condensed monitoring interface with touch optimization
  - Desktop: Full monitoring suite with detailed metrics
  - XL: Multiple metric streams with comprehensive dashboards
- **Microcopy:**
  - Status indicators: "API Usage: 2,341/5,000 calls (46% of hourly limit)"
  - Freshness: "Last sync: 3 minutes ago ✓ All systems operational"
  - Alerts: "Warning: API usage at 80% - consider upgrading plan"
  - Performance: "Average response time: 145ms (target: <200ms)"
- **Animations:**
  - Subtle pulsing for active processes and operations
  - Smooth metric updates with appropriate easing
  - Attention-grabbing animations for critical alerts
  - Status transition animations with visual continuity
- **Component Design:**
  - HealthIndicator with detailed status history
  - MetricGauge for limits and thresholds with color coding
  - ActivityStream with real-time updates and filtering
  - AlertManager with rule configuration and testing
- **Real-time Data Considerations:**
  - Live system metrics with sub-second updates
  - Real-time alert triggers with immediate notification
  - Streaming logs with advanced search and filtering
  - WebSocket connections for immediate status updates

---

## 5. Cross-Cutting Concerns

### 5.1 Responsive Design Strategy

#### Breakpoint System

- **Mobile**: <768px (Essential features only)
- **Tablet**: 768px-1024px (Optimized layouts)
- **Desktop**: 1024px-1440px (Full functionality)
- **XL Desktop**: >1440px (Enhanced experience)

#### Progressive Enhancement

```
Experience Layers
├── Core (Mobile-first)
│   ├── Key metrics viewing
│   ├── Essential actions
│   ├── Basic navigation
│   └── Critical notifications
├── Enhanced (Tablet+)
│   ├── Advanced filtering
│   ├── Detailed charts
│   ├── Bulk operations
│   └── Extended navigation
└── Premium (Desktop+)
    ├── Dashboard customization
    ├── Complex analytics
    ├── Admin functions
    └── Power user features
```

### 5.2 Accessibility Framework

#### WCAG 2.1 Level AA Compliance

- **Visual**: 4.5:1 contrast ratio, color independence
- **Motor**: 44px touch targets, keyboard navigation
- **Cognitive**: Clear language, consistent patterns
- **Assistive**: Screen reader support, voice control

#### Implementation Standards

- Semantic HTML structure with proper headings
- ARIA labels and live regions for dynamic content
- Keyboard shortcuts for frequent actions
- Alternative formats for complex visualizations

### 5.3 Performance Optimization

#### Core Web Vitals Targets

- **LCP**: <2.5 seconds
- **FID**: <100 milliseconds  
- **CLS**: <0.1

#### Loading Strategies

- Progressive loading with skeleton screens
- Lazy loading for non-critical content
- Code splitting by route and feature
- Intelligent prefetching for likely actions

### 5.4 Error Handling Patterns

#### Error Categories

1. **Network**: Connection issues, timeouts
2. **Validation**: User input errors
3. **Business Logic**: Process violations
4. **System**: Server errors, degradation

#### Recovery Patterns

- Automatic retry with exponential backoff
- Graceful degradation to essential features
- Offline mode with cached data
- Clear recovery instructions for users

### 5.5 Security and Privacy

#### Data Protection

- Encryption at rest and in transit
- Role-based access control (RBAC)
- Audit logging for all data changes
- Privacy by design principles

#### User Interface Security

- Input validation and sanitization
- CSRF protection for forms
- Secure session management
- Clear permission boundaries

---

## 6. Design Token Implementation

### 6.1 Spacing System

```css
--pp-space-1: 0.25rem;   /* 4px */
--pp-space-2: 0.5rem;    /* 8px */
--pp-space-3: 0.75rem;   /* 12px */
--pp-space-4: 1rem;      /* 16px */
--pp-space-6: 1.5rem;    /* 24px */
--pp-space-8: 2rem;      /* 32px */
--pp-space-12: 3rem;     /* 48px */
--pp-space-16: 4rem;     /* 64px */
```

### 6.2 Typography Scale

```css
--pp-font-size-xs: 0.75rem;    /* 12px */
--pp-font-size-sm: 0.875rem;   /* 14px */
--pp-font-size-md: 1rem;       /* 16px */
--pp-font-size-lg: 1.125rem;   /* 18px */
--pp-font-size-xl: 1.25rem;    /* 20px */
--pp-font-size-2xl: 1.5rem;    /* 24px */
--pp-font-size-3xl: 1.875rem;  /* 30px */
--pp-font-size-4xl: 2.25rem;   /* 36px */
```

### 6.3 Color Tokens

```css
/* Primary Brand */
--pp-color-primary-500: oklch(0.606 0.25 292.717);
--pp-color-primary-600: oklch(0.541 0.281 293.009);

/* Status Colors */
--pp-color-success-500: oklch(0.6 0.2 142);
--pp-color-warning-500: oklch(0.828 0.189 84.429);
--pp-color-danger-500: oklch(0.577 0.245 27.325);
--pp-color-neutral-500: oklch(0.552 0.016 285.938);

/* Chart Colors */
--pp-chart-1: oklch(0.646 0.222 41.116);    /* Orange */
--pp-chart-2: oklch(0.6 0.118 184.704);     /* Cyan */
--pp-chart-3: oklch(0.398 0.07 227.392);    /* Blue */
--pp-chart-4: oklch(0.828 0.189 84.429);    /* Yellow */
--pp-chart-5: oklch(0.769 0.188 70.08);     /* Gold */
```

### 6.4 Animation Tokens

```css
--pp-duration-fast: 150ms;
--pp-duration-normal: 200ms;
--pp-duration-slow: 300ms;
--pp-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

---

## 7. Component Library Specification

### 7.1 Core Components

#### MetricCard

```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
  prefix?: string;
  suffix?: string;
  onClick?: () => void;
  loading?: boolean;
}
```

#### StatusBadge

```typescript
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'danger' | 'neutral';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}
```

#### O2RPhaseIndicator

```typescript
interface O2RPhaseIndicatorProps {
  currentPhase: 1 | 2 | 3 | 4;
  interactive?: boolean;
  onPhaseClick?: (phase: number) => void;
  showLabels?: boolean;
}
```

### 7.2 Composite Components

#### OpportunityCard

```typescript
interface OpportunityCardProps {
  opportunity: Opportunity;
  healthStatus: HealthStatus;
  showActions?: boolean;
  draggable?: boolean;
  onDrag?: (opportunityId: string) => void;
  onEdit?: (opportunityId: string) => void;
}
```

#### DashboardWidget

```typescript
interface DashboardWidgetProps {
  title: string;
  children: React.ReactNode;
  customizable?: boolean;
  exportable?: boolean;
  refreshable?: boolean;
  onRefresh?: () => void;
}
```

---

## 8. User Experience Flows

### 8.1 Primary User Flows

#### New User Onboarding

1. **Zoho Authentication** → Login redirect → Permission grant
2. **Initial Sync** → Progress monitoring → Data verification
3. **Dashboard Tour** → Feature introduction → Customization
4. **First Actions** → Create opportunity → Set preferences

#### Daily Operations Flow

1. **Dashboard Review** → Health status check → Attention items
2. **O2R Management** → Phase updates → Milestone tracking
3. **Data Updates** → Opportunity changes → Sync verification
4. **Reporting** → Analytics review → Export generation

#### Administrative Tasks

1. **System Monitoring** → Health dashboard → Performance review
2. **Data Management** → Sync configuration → Conflict resolution
3. **User Administration** → Role management → Permission updates
4. **Maintenance** → Rate updates → System configuration

### 8.2 Error Recovery Flows

#### Sync Failure Recovery

1. **Error Detection** → Status notification → Impact assessment
2. **Resolution Options** → Manual retry → Conflict resolution
3. **Recovery Execution** → Progress tracking → Verification
4. **Prevention** → Configuration update → Monitoring enhancement

#### Data Conflict Resolution

1. **Conflict Identification** → Detailed comparison → Impact analysis
2. **Resolution Strategy** → Rule application → Manual review
3. **Implementation** → Change execution → Audit logging
4. **Verification** → Data integrity check → User notification

---

## 9. Testing and Quality Assurance

### 9.1 Usability Testing Framework

#### Test Scenarios

- **First-time User**: Complete onboarding and initial setup
- **Daily User**: Routine operations and data management
- **Power User**: Advanced features and bulk operations
- **Administrator**: System configuration and monitoring

#### Success Metrics

- Task completion rate >90%
- Time to completion <expected benchmarks
- Error rate <5% for trained users
- Satisfaction score >4.0/5.0

### 9.2 Accessibility Testing

#### Automated Testing

- axe-core integration for WCAG compliance
- Color contrast validation tools
- Keyboard navigation testing
- Screen reader compatibility

#### Manual Testing

- Real user testing with assistive technologies
- Keyboard-only navigation testing
- Voice control testing
- Mobile accessibility validation

### 9.3 Performance Testing

#### Load Testing

- 100+ concurrent users
- Large dataset operations (50,000+ records)
- Extended sync operations
- Report generation under load

#### Performance Benchmarks

- Page load time <3 seconds
- Interactive time <1 second
- Sync completion <5 minutes (10,000 records)
- Search results <2 seconds

---

## 10. Implementation Guidelines

### 10.1 Development Phases

#### Phase 1: Foundation (Months 1-2)

- Core authentication and navigation
- Basic sync functionality
- Essential O2R tracking
- Currency standardization

#### Phase 2: Intelligence (Months 3-4)

- Advanced analytics and reporting
- GTM motion tracker
- Bulk operations
- System monitoring

#### Phase 3: Optimization (Months 5-6)

- Performance optimization
- Advanced integrations
- Mobile optimization
- Advanced admin features

### 10.2 Design Validation

#### Design Reviews

- Weekly design critiques with stakeholders
- Bi-weekly user research sessions
- Monthly accessibility audits
- Quarterly design system updates

#### User Feedback Integration

- Continuous user feedback collection
- A/B testing for major changes
- Usage analytics monitoring
- Feature adoption tracking

---

## 11. Conclusion

This comprehensive design brief establishes the foundation for Pipeline Pulse as an enterprise-grade sales intelligence platform. The design system prioritizes data clarity, professional trust, and operational efficiency while maintaining the flexibility to serve diverse user needs across different roles and device contexts.

The implementation should follow a progressive enhancement approach, ensuring core functionality works across all devices while providing enhanced experiences for desktop users. Regular testing and validation will ensure the design meets both usability and accessibility standards while delivering measurable business value.

**Success will be measured by:**

- User adoption rates >80% within 3 months
- Task completion efficiency improvement >25%
- Data accuracy improvement >95%
- User satisfaction scores >4.0/5.0
- System reliability >99.9% uptime

This design brief serves as the single source of truth for all design decisions and should be updated as the product evolves based on user feedback and business requirements.

---

*Pipeline Pulse Design Brief v1.0*  
*Document Length: ~15,000 words*  
*Last Updated: [Current Date]*  
*Next Review: Monthly during development*
