# Pipeline Pulse Brand Guidelines

## 1. Introduction

### 1.1 Brand Philosophy & Core Principles

Pipeline Pulse embodies **precision, clarity, and intelligence** in revenue operations. Our design philosophy reflects the sophistication of enterprise sales analytics while maintaining the approachability needed for daily use by sales teams. We prioritize:

- **Data Clarity**: Complex insights made instantly understandable
- **Professional Trust**: Enterprise-grade aesthetics that inspire confidence
- **Operational Efficiency**: Every element serves a purpose in the revenue workflow
- **Adaptive Intelligence**: Responsive to user needs and system states

### 1.2 How to Use These Guidelines

These guidelines serve as the definitive reference for all Pipeline Pulse interfaces, ensuring consistency across:

- Web application (primary)
- Reports and exports
- System communications
- Future mobile interfaces

All implementations should reference these guidelines alongside the technical SRS documentation.

### 1.3 Target Audience

**Primary Users**: Sales leaders, operations managers, and revenue teams at B2B SaaS companies
**User Profile**: Data-driven professionals who value efficiency, accuracy, and actionable insights
**Technical Context**: Users typically work on high-resolution displays in professional environments

---

## 2. Visual Identity

### 2.1 Logo & Wordmark

The Pipeline Pulse logo combines a flowing data visualization with a pulse line, symbolizing the continuous flow and health monitoring of revenue pipelines.

**Logo Specifications**:

- Minimum size: 120px width (digital), 30mm (print)
- Clear space: Equal to the height of the "P" in Pulse
- Primary color: `--primary` (Purple)
- Variations: Full color, monochrome, reversed

### 2.2 Color Philosophy

Our color palette balances **professional sophistication** with **functional clarity**:

- **Purple** (Primary): Innovation, intelligence, premium quality
- **Neutral Grays**: Professional foundation, data focus
- **Semantic Colors**: Clear system states and health indicators

---

## 3. Color System

### 3.1 Core Brand Colors

#### Primary Purple

- **Light Mode**: `oklch(0.606 0.25 292.717)`
- **Dark Mode**: `oklch(0.541 0.281 293.009)`
- **Usage**: Primary actions, brand presence, key metrics

#### Background & Surface Colors

- **Light Background**: `oklch(1 0 0)` (Pure white)
- **Dark Background**: `oklch(0.141 0.005 285.823)` (Deep charcoal)
- **Card Surfaces**: Slight elevation from background

### 3.2 Semantic Colors

#### Health Status Indicators (O2R System)

- **On Track (Green)**: `oklch(0.6 0.2 142)`
- **Minor Issues (Yellow)**: `oklch(0.828 0.189 84.429)` (from chart-4)
- **Critical (Red)**: `oklch(0.577 0.245 27.325)` (destructive)
- **Blocked (Gray)**: `oklch(0.552 0.016 285.938)` (muted-foreground)

#### System States

- **Success**: Green variant
- **Warning**: Yellow/Amber
- **Error**: Destructive red
- **Info**: Primary purple

### 3.3 Data Visualization Palette

For charts and analytics:

1. **Chart 1**: `oklch(0.646 0.222 41.116)` - Orange (Primary metric)
2. **Chart 2**: `oklch(0.6 0.118 184.704)` - Cyan (Comparison)
3. **Chart 3**: `oklch(0.398 0.07 227.392)` - Blue (Historical)
4. **Chart 4**: `oklch(0.828 0.189 84.429)` - Yellow (Highlights)
5. **Chart 5**: `oklch(0.769 0.188 70.08)` - Gold (Achievements)

---

## 4. Typography

### 4.1 Font Stack

```css
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-mono: "JetBrains Mono", "SF Mono", Monaco, monospace;
```

### 4.2 Type Scale

#### Display (Dashboard Headers)

- **H1**: 3rem / 3.5rem / 4rem (mobile/desktop/xl)
- **H2**: 2.25rem / 2.75rem / 3rem
- **H3**: 1.875rem / 2.25rem / 2.5rem

#### Interface Typography

- **UI Large**: 1.125rem (Navigation, section headers)
- **UI Default**: 0.875rem (Controls, labels)
- **UI Small**: 0.75rem (Captions, metadata)

#### Data Typography

- **Metric Display**: 2.5rem, weight 600 (Key numbers)
- **Table Headers**: 0.875rem, weight 600, uppercase
- **Table Data**: 0.875rem, weight 400

### 4.3 Typography Guidelines

- **Line Height**: 1.5 for body text, 1.2 for headers, 1.4 for data
- **Letter Spacing**: -0.02em for large headers, normal for body
- **Paragraph Spacing**: 1rem between paragraphs
- **Max Line Length**: 65-75 characters for readability

---

## 5. Spacing & Layout

### 5.1 Grid System

#### Breakpoints

- **Mobile**: <768px (Focus on key metrics only)
- **Tablet**: 768px–1024px (Simplified layouts)
- **Desktop**: 1024px–1440px (Standard workstation)
- **XL Desktop**: >1440px (Command center view)

#### Container Widths

- **Max Width**: 1920px (XL monitors)
- **Content Max**: 1600px (Centered on XL)
- **Sidebar**: 280px (collapsible to 64px)

### 5.2 Spacing Scale

```css
--space-xs: 0.25rem;   /* 4px - Tight groupings */
--space-sm: 0.5rem;    /* 8px - Related elements */
--space-md: 1rem;      /* 16px - Standard spacing */
--space-lg: 1.5rem;    /* 24px - Section breaks */
--space-xl: 2rem;      /* 32px - Major sections */
--space-xxl: 3rem;     /* 48px - Page sections */
--space-xxxl: 4rem;    /* 64px - XL monitor spacing */
```

### 5.3 Layout Patterns

#### Dashboard Layout

- **Header**: 64px fixed height
- **Sidebar**: 280px (expandable)
- **Content Area**: Fluid with max-width
- **Metric Cards**: 4-column grid on XL, responsive down

#### Data Tables

- **Row Height**: 48px (comfortable click target)
- **Cell Padding**: 16px horizontal, 12px vertical
- **Sticky Headers**: Always visible during scroll

---

## 6. Component Specifications

### 6.1 Buttons

#### Primary Actions

```css
/* Sync, Save, Create Deal */
background: var(--primary);
color: var(--primary-foreground);
padding: 0.625rem 1.25rem;
border-radius: var(--radius);
font-weight: 600;
```

#### Secondary Actions

```css
/* Cancel, Export, Filter */
background: var(--secondary);
color: var(--secondary-foreground);
border: 1px solid var(--border);
```

#### Button States

- **Hover**: 10% darker/lighter
- **Active**: Scale 0.98
- **Disabled**: Opacity 0.5
- **Loading**: Spinner icon + "Processing..."

### 6.2 Cards & Containers

#### Metric Cards

```css
background: var(--card);
border: 1px solid var(--border);
border-radius: var(--radius);
padding: 1.5rem;
/* Subtle shadow for depth */
box-shadow: 0 1px 3px oklch(0 0 0 / 0.1);
```

#### Status Indicators

- **Border-left**: 4px solid status color
- **Background**: 5% tint of status color
- **Icon**: 20px, matching status color

### 6.3 Data Tables

#### Table Structure

```css
/* Header */
background: var(--muted);
font-weight: 600;
text-transform: uppercase;
font-size: 0.75rem;
letter-spacing: 0.05em;

/* Rows */
border-bottom: 1px solid var(--border);
transition: background 200ms;

/* Hover State */
background: var(--accent);
```

### 6.4 Forms & Inputs

#### Input Fields

```css
background: var(--background);
border: 1px solid var(--input);
border-radius: calc(var(--radius) - 2px);
padding: 0.5rem 0.75rem;
font-size: 0.875rem;

/* Focus */
border-color: var(--ring);
box-shadow: 0 0 0 3px oklch(var(--ring) / 0.1);
```

#### Field States

- **Default**: Subtle border
- **Focus**: Purple ring
- **Error**: Red border + message
- **Success**: Green checkmark

### 6.5 Navigation

#### Sidebar Navigation

```css
background: var(--sidebar);
border-right: 1px solid var(--sidebar-border);
/* Items */
padding: 0.75rem 1rem;
border-radius: calc(var(--radius) - 2px);
/* Active */
background: var(--sidebar-accent);
color: var(--sidebar-primary);
font-weight: 600;
```

---

## 7. Icons & Imagery

### 7.1 Icon System

**Style**: Outline icons, 2px stroke weight
**Sizes**:

- 16px (inline, small buttons)
- 20px (standard UI)
- 24px (feature icons)
- 32px (empty states)

**Icon Categories**:

- **Actions**: Plus, Edit, Delete, Sync, Export
- **Navigation**: ChevronRight, Menu, Close
- **Status**: CheckCircle, AlertTriangle, XCircle, Clock
- **O2R Phases**: Target, FileText, Rocket, DollarSign

### 7.2 Illustrations

Used sparingly for:

- Empty states (light, friendly)
- Onboarding (process-focused)
- Error pages (helpful, not alarming)

Style: Simplified, geometric, using brand colors

---

## 8. Motion & Interaction

### 8.1 Animation Principles

- **Purpose**: Guide attention, indicate state changes
- **Duration**: 200ms standard, 300ms for complex transitions
- **Easing**: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out)

### 8.2 Micro-interactions

#### Hover States

```css
transition: all 200ms ease-in-out;
transform: translateY(-1px);
box-shadow: 0 4px 12px oklch(0 0 0 / 0.1);
```

#### Loading States

- Skeleton screens for data tables
- Pulse animation for metric cards
- Progress bars for sync operations

#### Success Feedback

- Checkmark animation
- Brief color flash
- Toast notification

### 8.3 Page Transitions

- **Route Changes**: Fade in/out 150ms
- **Modal/Drawer**: Slide + fade 250ms
- **Tab Switches**: Instant with underline animation

---

## 9. Data Visualization

### 9.1 Chart Guidelines

#### Chart Types by Use Case

- **Pipeline Funnel**: Stacked bar chart
- **Trend Analysis**: Line charts with area fill
- **Distribution**: Donut charts (not pie)
- **Comparison**: Grouped bar charts
- **Progress**: Linear progress bars

#### Visual Hierarchy

1. Primary metric (largest, --chart-1)
2. Comparison data (--chart-2, --chart-3)
3. Additional context (muted colors)

### 9.2 Dashboard Patterns

#### KPI Cards

```
┌─────────────────┐
│ Label (small)   │
│ $1.2M          │
│ ↑ 12% (green)  │
└─────────────────┘
```

#### Health Status Cards

```
┌─────────────────┐
│ ● Deal Name     │
│ Phase II → III  │
│ 14 days in phase│
└─────────────────┘
```

---

## 10. Responsive Behavior

### 10.1 Mobile Priorities

1. Current pipeline value
2. Attention required items
3. Quick actions (sync, create)
4. Simplified navigation

### 10.2 Tablet Adaptations

- Single column layouts
- Collapsible sidebar
- Touch-friendly targets (44px minimum)
- Swipe gestures for tables

### 10.3 XL Monitor Optimizations

- Multi-column dashboards
- Expanded data tables
- Side-by-side comparisons
- Persistent filters panel

---

## 11. Accessibility Standards

### 11.1 Color Contrast

- **Normal Text**: 4.5:1 minimum
- **Large Text**: 3:1 minimum
- **Interactive Elements**: 3:1 minimum
- **Focus Indicators**: 3:1 against both backgrounds

### 11.2 Keyboard Navigation

- All interactive elements keyboard accessible
- Logical tab order
- Skip links for main content
- Escape key closes modals

### 11.3 Screen Reader Support

- Semantic HTML structure
- ARIA labels for icons
- Live regions for updates
- Table headers properly associated

---

## 12. Content Guidelines

### 12.1 Voice & Tone

**Professional but Approachable**

- Clear, concise language
- Active voice preferred
- Technical accuracy without jargon

**Examples**:

- ✅ "Sync completed. 1,247 records updated."
- ❌ "The synchronization process has been finalized successfully."

### 12.2 UI Copy Patterns

#### Buttons

- **Primary**: Verb + Object ("Create Opportunity", "Export Report")
- **Secondary**: Single verb ("Cancel", "Close")

#### Status Messages

- **Success**: "✓ [Object] [past tense verb]"
- **Error**: "⚠️ [What happened]. [How to fix]."
- **Loading**: "[Present continuous verb]..." ("Syncing...", "Loading...")

#### Empty States

- Explain what's missing
- Provide next action
- Keep it brief

---

## 13. Implementation Notes

### 13.1 CSS Architecture

```css
/* Component Structure */
.pp-component {}
.pp-component__element {}
.pp-component--modifier {}

/* Utility Classes */
.pp-text-sm { font-size: var(--text-sm); }
.pp-space-md { margin: var(--space-md); }
.pp-status--green { color: var(--status-green); }
```

### 13.2 Component Library

All components built with:

- shadcn/ui as base
- Tailwind CSS utilities
- Custom Pipeline Pulse variants
- Radix UI primitives

### 13.3 Development Workflow

1. Check design system for existing patterns
2. Use semantic color/spacing variables
3. Test in both light/dark modes
4. Verify on all breakpoints
5. Run accessibility audit

---

## 14. Brand Applications

### 14.1 Reports & Exports

- Maintain color coding from app
- Include Pipeline Pulse logo
- Use consistent typography
- Add generation timestamp

### 14.2 Email Templates

- Simplified color palette
- System fonts for compatibility
- Mobile-first design
- Clear CTAs to app

### 14.3 Future Considerations

- Mobile app design system
- Marketing website alignment
- Partner co-branding rules
- API documentation styling

---

*Pipeline Pulse Brand Guidelines v1.0*  
*Last Updated: [Current Date]*  
*Next Review: Quarterly with Product Updates*
