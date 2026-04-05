# Pipeline Pulse Implementation Guide — Design Tokens & Patterns
> **v2.1** | Aligned to BRD v6.1 / SRS v4.2 / Tech Stack v2.0 | April 2026
> **Patch v2.1:** Added §2 Tooling Enforcement (stylelint, ESLint), §11 Accessibility Patterns (ARIA, keyboard), §12 Iconography Rules. Updated §13 Usage Guidelines with Don'ts for icons and unicode.

---

## 1. Design Token Setup

### 1.1 Install Dependencies

```bash
npx shadcn@latest init
npx shadcn@latest add chart button card badge table tabs select dropdown-menu progress skeleton toast sheet

npm install ag-grid-community @ag-grid-community/react @ag-grid-community/client-side-row-model
npm install xlsx dinero.js date-fns clsx tailwind-merge tailwindcss-animate socket.io-client

# Dev tooling for design token enforcement
npm install --save-dev stylelint stylelint-config-standard msw@^2.3.0
```

### 1.2 Design Token CSS — `src/styles/tokens/design-tokens.css`

```css
@layer base {
  :root {
    /* SPACING */
    --pp-space-1: 0.25rem;   /* 4px */
    --pp-space-2: 0.5rem;    /* 8px */
    --pp-space-3: 0.75rem;   /* 12px */
    --pp-space-4: 1rem;      /* 16px */
    --pp-space-5: 1.25rem;   /* 20px */
    --pp-space-6: 1.5rem;    /* 24px */
    --pp-space-8: 2rem;      /* 32px */
    --pp-space-10: 2.5rem;   /* 40px */
    --pp-space-12: 3rem;     /* 48px */
    --pp-space-16: 4rem;     /* 64px */

    /* TYPOGRAPHY */
    --pp-font-size-xs: 0.75rem;        /* 12px */
    --pp-font-size-sm: 0.8125rem;      /* 13px — grid cell text */
    --pp-font-size-md: 0.875rem;       /* 14px — standard UI */
    --pp-font-size-lg: 1rem;           /* 16px */
    --pp-font-size-xl: 1.125rem;       /* 18px */
    --pp-font-size-2xl: 1.5rem;        /* 24px */
    --pp-font-size-3xl: 1.875rem;      /* 30px */
    --pp-font-size-4xl: 2.25rem;       /* 36px */

    --pp-font-weight-normal: 400;
    --pp-font-weight-medium: 500;
    --pp-font-weight-semibold: 600;
    --pp-font-weight-bold: 700;

    --pp-line-height-tight: 1.25;
    --pp-line-height-normal: 1.5;
    --pp-line-height-relaxed: 1.75;

    /* BORDER RADIUS */
    --pp-radius-sm: 0.125rem;     /* 2px */
    --pp-radius-md: 0.375rem;     /* 6px */
    --pp-radius-lg: 0.5rem;       /* 8px */
    --pp-radius-xl: 0.75rem;      /* 12px */
    --pp-radius-full: 9999px;

    /* SHADOWS */
    --pp-shadow-sm: 0 1px 2px oklch(0 0 0 / 0.05);
    --pp-shadow-md: 0 4px 6px oklch(0 0 0 / 0.1);
    --pp-shadow-lg: 0 10px 15px oklch(0 0 0 / 0.1);

    /* BRAND COLOURS */
    --pp-color-primary-50: oklch(0.969 0.016 293.756);
    --pp-color-primary-100: oklch(0.933 0.031 293.831);
    --pp-color-primary-500: oklch(0.606 0.25 292.717);   /* Main brand purple */
    --pp-color-primary-600: oklch(0.541 0.281 293.009);  /* Dark mode */
    --pp-color-primary-900: oklch(0.282 0.155 292.946);

    /* STATUS COLOURS */
    --pp-color-success-50: oklch(0.95 0.05 142);
    --pp-color-success-500: oklch(0.6 0.2 142);
    --pp-color-success-600: oklch(0.55 0.22 142);

    --pp-color-warning-50: oklch(0.95 0.05 84);
    --pp-color-warning-500: oklch(0.828 0.189 84.429);
    --pp-color-warning-600: oklch(0.769 0.188 70.08);

    --pp-color-danger-50: oklch(0.95 0.05 27);
    --pp-color-danger-500: oklch(0.577 0.245 27.325);
    --pp-color-danger-600: oklch(0.704 0.191 22.216);

    --pp-color-neutral-50: oklch(0.985 0 0);
    --pp-color-neutral-100: oklch(0.967 0.001 286.375);
    --pp-color-neutral-500: oklch(0.552 0.016 285.938);
    --pp-color-neutral-600: oklch(0.705 0.015 286.067);
    --pp-color-neutral-900: oklch(0.141 0.005 285.823);

    /* CHART COLOURS */
    --pp-chart-1: oklch(0.646 0.222 41.116);    /* Orange */
    --pp-chart-2: oklch(0.6 0.118 184.704);     /* Cyan */
    --pp-chart-3: oklch(0.398 0.07 227.392);    /* Blue */
    --pp-chart-4: oklch(0.828 0.189 84.429);    /* Yellow */
    --pp-chart-5: oklch(0.769 0.188 70.08);     /* Gold */

    /* COMPONENT TOKENS */
    --pp-grid-row-height: 1.875rem;          /* 30px */
    --pp-grid-header-height: 2.25rem;        /* 36px */
    --pp-grid-status-bar-height: 2rem;       /* 32px */
    --pp-grid-cell-padding-x: var(--pp-space-2);
    --pp-grid-font-size: var(--pp-font-size-sm);

    --pp-side-panel-width: 30rem;            /* 480px */
    --pp-ai-insights-width: 23.75rem;        /* 380px */
    --pp-command-palette-width: 40rem;       /* 640px */
    --pp-tab-height: 2.5rem;                 /* 40px */
    --pp-tab-indicator-height: 2px;

    /* ANIMATION */
    --pp-duration-fast: 150ms;
    --pp-duration-normal: 200ms;
    --pp-duration-slow: 300ms;
    --pp-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
    --pp-ease-out: cubic-bezier(0, 0, 0.2, 1);
  }

  .dark {
    --pp-color-primary-500: oklch(0.541 0.281 293.009);
    --pp-color-success-500: oklch(0.6 0.2 142);
    --pp-color-warning-500: oklch(0.769 0.188 70.08);
    --pp-color-danger-500: oklch(0.704 0.191 22.216);
    --pp-chart-1: oklch(0.488 0.243 264.376);
  }
}
```

---

## 2. Tooling Enforcement — Design Token Compliance

> **These configs make token violations a build error, not a code review comment.** Both stylelint and the custom ESLint rule must be present. Removing either is a compliance violation.

### 2.1 stylelint — Block Hardcoded Colours in CSS/Tailwind

stylelint catches raw `hsl()`, `rgb()`, and `#hex` values in `.css`, `.scss`, and `@apply` blocks, failing the build before they reach production.

Install:
```bash
npm install --save-dev stylelint stylelint-config-standard
```

Create `.stylelintrc.json` at project root:
```json
{
  "extends": ["stylelint-config-standard"],
  "rules": {
    "color-no-invalid-hex": true,
    "declaration-property-value-disallowed-list": {
      "color":            ["/^#/", "/^hsl/", "/^rgb/"],
      "background":       ["/^#/", "/^hsl/", "/^rgb/"],
      "background-color": ["/^#/", "/^hsl/", "/^rgb/"],
      "border-color":     ["/^#/", "/^hsl/", "/^rgb/"],
      "fill":             ["/^#/", "/^hsl/", "/^rgb/"],
      "stroke":           ["/^#/", "/^hsl/", "/^rgb/"]
    }
  },
  "ignoreFiles": [
    "src/styles/tokens/design-tokens.css",
    "src/index.css",
    "node_modules/**"
  ]
}
```

> **The only permitted exception** is `src/styles/tokens/design-tokens.css` itself and `src/index.css` (where shadcn/ui defines its own HSL variables). All other files must use `var(--pp-color-*)` or `var(--*)` references — never raw values.

Add to `package.json` scripts:
```json
{
  "scripts": {
    "lint:css": "stylelint 'src/**/*.css'",
    "lint": "eslint . && stylelint 'src/**/*.css'"
  }
}
```

### 2.2 ESLint — Block Hardcoded Colours in `style={{}}` Props

stylelint covers CSS files. This ESLint rule catches inline `style={{ color: '#...' }}` and `style={{ background: 'hsl(...)' }}` in TSX.

Add to `eslint.config.js`:
```javascript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Block hardcoded colour values in inline style props
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'JSXAttribute[name.name="style"] > JSXExpressionContainer > ObjectExpression > Property[key.name=/color|background|borderColor|fill|stroke/] > Literal[value=/^(#[0-9a-fA-F]{3,8}|hsl|rgb|oklch)(?!\\(var)/]',
          message:
            'Hardcoded colour in style prop. Use a CSS variable: style={{ color: "var(--pp-color-primary-500)" }}',
        },
      ],
    },
  }
);
```

> **Note on stage/funding badge colours:** The six `pp-badge--*` CSS classes in `src/styles/tokens/design-tokens.css` are the canonical location for badge hex values. Any component applying a stage or funding badge must reference these classes, not reproduce the hex values inline.

### 2.3 Pre-commit Hook — Run Both Linters

Add to `.husky/pre-commit` (or `lint-staged` config):
```bash
#!/bin/sh
npm run lint:css
npm run lint
```

Or via `lint-staged` in `package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.css":      ["stylelint --fix", "prettier --write"]
  }
}
```

---

## 3. Tailwind Configuration — `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./src/**/*.{ts,tsx}'],
  prefix: "",
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      spacing: {
        '1': 'var(--pp-space-1)', '2': 'var(--pp-space-2)',
        '3': 'var(--pp-space-3)', '4': 'var(--pp-space-4)',
        '5': 'var(--pp-space-5)', '6': 'var(--pp-space-6)',
        '8': 'var(--pp-space-8)', '10': 'var(--pp-space-10)',
        '12': 'var(--pp-space-12)', '16': 'var(--pp-space-16)',
      },
      fontSize: {
        'xs': 'var(--pp-font-size-xs)', 'sm': 'var(--pp-font-size-sm)',
        'base': 'var(--pp-font-size-md)', 'lg': 'var(--pp-font-size-lg)',
        'xl': 'var(--pp-font-size-xl)', '2xl': 'var(--pp-font-size-2xl)',
        '3xl': 'var(--pp-font-size-3xl)', '4xl': 'var(--pp-font-size-4xl)',
      },
      colors: {
        border: "hsl(var(--border))", input: "hsl(var(--input))", ring: "hsl(var(--ring))",
        background: "hsl(var(--background))", foreground: "hsl(var(--foreground))",
        primary:     { DEFAULT: "hsl(var(--primary))",     foreground: "hsl(var(--primary-foreground))" },
        secondary:   { DEFAULT: "hsl(var(--secondary))",   foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted:       { DEFAULT: "hsl(var(--muted))",       foreground: "hsl(var(--muted-foreground))" },
        accent:      { DEFAULT: "hsl(var(--accent))",      foreground: "hsl(var(--accent-foreground))" },
        card:        { DEFAULT: "hsl(var(--card))",        foreground: "hsl(var(--card-foreground))" },
        // Pipeline Pulse tokens
        'pp-primary': { 50: 'var(--pp-color-primary-50)', 500: 'var(--pp-color-primary-500)', 600: 'var(--pp-color-primary-600)' },
        'pp-success': { 50: 'var(--pp-color-success-50)', 500: 'var(--pp-color-success-500)' },
        'pp-warning': { 50: 'var(--pp-color-warning-50)', 500: 'var(--pp-color-warning-500)' },
        'pp-danger':  { 50: 'var(--pp-color-danger-50)',  500: 'var(--pp-color-danger-500)' },
        'pp-neutral': { 50: 'var(--pp-color-neutral-50)', 100: 'var(--pp-color-neutral-100)', 500: 'var(--pp-color-neutral-500)', 900: 'var(--pp-color-neutral-900)' },
      },
      borderRadius: {
        'sm': 'var(--pp-radius-sm)', 'DEFAULT': 'var(--pp-radius-md)',
        'md': 'var(--pp-radius-md)', 'lg': 'var(--pp-radius-lg)',
        'xl': 'var(--pp-radius-xl)', 'full': 'var(--pp-radius-full)',
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up":   { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

---

## 4. AG Grid Integration Patterns

### 4.1 Basic Grid Setup

```typescript
// src/components/grid/PipelineGrid.tsx
import { AgGridReact } from '@ag-grid-community/react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import type { ColDef, GridOptions, GridReadyEvent } from '@ag-grid-community/core';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const gridOptions: GridOptions = {
  modules: [ClientSideRowModelModule],
  defaultColDef: {
    editable: true,
    resizable: true,
    sortable: true,
    filter: true,        // AutoFilter per column (FR-GRID-007)
    minWidth: 80,
  },
  rowHeight: 30,         // Compact display — matches Excel default
  headerHeight: 36,
  suppressPaginationPanel: true,
  rowModelType: 'clientSide',
  animateRows: false,    // Disable for performance on large datasets
  statusBar: {
    statusPanels: [
      { statusPanel: 'agTotalAndFilteredRowCountComponent', align: 'left' },
      { statusPanel: 'agSelectedRowCountComponent', align: 'center' },
      { statusPanel: 'agAggregationComponent', align: 'right' },
    ]
  },
};
```

### 4.2 Health Cell Class Rules

```typescript
// cellClassRules — applied via colDef
const healthCellClassRules = {
  'pp-cell-health-green':   (params: any) => params.value === 'On Track',
  'pp-cell-health-amber':   (params: any) => params.value === 'Watch',
  'pp-cell-health-red':     (params: any) => params.value === 'Critical',
  'pp-cell-health-blocked': (params: any) => params.value === 'Blocked',
};

// NEVER use StatusBadge or floating overlays inside grid cells
// ALWAYS use cellClassRules for health visualisation
```

### 4.3 SGD Core Column Definition

```typescript
// SGD_core is ALWAYS pinned left and visible (FR-GRID-006)
const sgdCoreColDef: ColDef = {
  field: 'sgd_core',
  headerName: 'Deal Value (SGD)',
  pinned: 'left',
  lockPinned: true,       // User cannot unpin
  valueFormatter: (params) => params.value
    ? `SGD ${params.value.toLocaleString('en-SG', { minimumFractionDigits: 0 })}`
    : '—',
  type: 'numericColumn',
  filter: 'agNumberColumnFilter',
  editable: false,        // Calculated field — never directly editable
};
```

### 4.4 Stage Badge Cell Renderer

```typescript
// src/components/grid/renderers/StageBadgeRenderer.tsx
import type { ICellRendererParams } from '@ag-grid-community/core';

const STAGE_CLASSES: Record<string, string> = {
  'New Hunt':    'pp-badge--stage-1',
  'Discovery':   'pp-badge--stage-2',
  'Proposal':    'pp-badge--stage-3',
  'Negotiation': 'pp-badge--stage-4',
  'Order Book':  'pp-badge--stage-5',
};

export const StageBadgeRenderer = (params: ICellRendererParams) => {
  const cls = STAGE_CLASSES[params.value] || '';
  return `<span class="pp-stage-badge ${cls}">${params.value ?? '—'}</span>`;
};
```

### 4.5 Days in Stage Colour Renderer

```typescript
// Text colour applied via cellStyle — NOT cell background
export const daysInStageColDef: ColDef = {
  field: 'days_at_stage',
  headerName: 'Days in Stage',
  cellStyle: (params) => {
    const d = Number(params.value);
    if (d < 15)  return { color: 'var(--pp-color-success-500)' };  // Green — on track
    if (d <= 30) return { color: 'var(--pp-color-warning-500)' };  // Amber — watch
    return { color: 'var(--pp-color-danger-500)' };                // Red — stalled
    // Thresholds are config-driven from /admin/reference-data
    // Only the three colour states are hardcoded
  },
};
```

---

## 5. SheetJS CE Export Pattern

```typescript
// src/lib/excel-export.ts — ALL SheetJS calls live here, never in components

import * as XLSX from 'xlsx';
import type { Opportunity } from '@/types';

export function exportOpportunitiesToXlsx(
  rows: Opportunity[],
  filename: string,
): void {
  const exportData = rows.map(r => ({
    'Account Name': r.account_name,
    'Opportunity Name': r.opportunity_name,
    'Stage': r.stage,
    'Deal Value (SGD)': r.sgd_core,
    'Seller': r.seller,
    'GTM Motion': r.gtm_motion,
    'Close Date': r.expected_close_date,
    'Days in Stage': r.days_at_stage,
    'Funding Type': r.funding_type,
  }));

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pipeline');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Velocity report: separate sheets per panel (NFR-PERF-003)
export function exportVelocityReportToXlsx(
  stageFunnel: any[],
  bottleneck: any[],
  stallRegister: any[],
  filename: string,
): void {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stageFunnel),   'Stage Funnel');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bottleneck),    'Bottleneck');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stallRegister), 'Stall Register');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
```

---

## 6. Recharts — Analytics Charts (Reports & Dashboard Only)

> **Scope**: Charts ONLY on analytics tabs (Velocity, Channels, Revenue vs Targets, Pipeline Health) and Dashboard. NEVER on Pipeline grid or Closed Deals tabs.

```typescript
// src/components/charts/pipeline-value-chart.tsx
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const chartConfig = {
  pipeline: { label: "Pipeline Value", color: "var(--pp-chart-1)" },
  closed:   { label: "Closed Won",     color: "var(--pp-chart-2)" },
};

export const PipelineValueChart = React.memo(() => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} accessibilityLayer>
      <XAxis dataKey="month" tick={{ fontSize: 12, fontFamily: 'Inter' }} />
      <YAxis tickFormatter={(v) => `SGD ${(v/1000).toFixed(0)}K`} />
      <Tooltip formatter={(v: number) => [`SGD ${v.toLocaleString('en-SG')}`, 'Value']} />
      <Bar dataKey="pipeline" fill={chartConfig.pipeline.color} />
      <Bar dataKey="closed"   fill={chartConfig.closed.color} />
    </BarChart>
  </ResponsiveContainer>
));
```

---

## 7. Metric Card Component

```typescript
// src/components/ui/metric-card.tsx
interface MetricCardProps {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'success' | 'warning' | 'danger' | 'neutral';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title, value, prefix, suffix, change, trend, status = 'neutral'
}) => {
  const borderColor = {
    success: 'var(--pp-color-success-500)',
    warning: 'var(--pp-color-warning-500)',
    danger:  'var(--pp-color-danger-500)',
    neutral: 'var(--border)',
  }[status];

  return (
    <div className="pp-metric-card" style={{
      padding: 'var(--pp-space-6)',
      borderRadius: 'var(--pp-radius-lg)',
      borderLeft: `4px solid ${borderColor}`,
      background: 'var(--card)',
      boxShadow: 'var(--pp-shadow-sm)',
    }}>
      <p style={{ fontSize: 'var(--pp-font-size-sm)', color: 'var(--muted-foreground)', fontWeight: 500 }}>
        {title}
      </p>
      <p style={{ fontSize: 'var(--pp-font-size-4xl)', fontWeight: 700, lineHeight: 1.2 }}>
        {prefix}{typeof value === 'number' ? value.toLocaleString('en-SG') : value}{suffix}
      </p>
      {change !== undefined && (
        <p style={{ fontSize: 'var(--pp-font-size-sm)', color: trend === 'up' ? 'var(--pp-color-success-500)' : 'var(--pp-color-danger-500)' }}>
          {trend === 'up' ? '↑' : '↓'} {Math.abs(change)}%
        </p>
      )}
    </div>
  );
};
```

---

## 8. Side Panel Pattern

```typescript
// src/components/ui/side-panel.tsx
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showDiffTab?: boolean;
  showHistoryTab?: boolean;
}

export const SidePanel: React.FC<SidePanelProps> = ({
  open, onClose, title, children, showDiffTab, showHistoryTab
}) => (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent
      side="right"
      style={{ width: 'var(--pp-side-panel-width)', maxWidth: '100vw' }}
    >
      <SheetHeader>
        <SheetTitle style={{ fontSize: 'var(--pp-font-size-lg)', fontWeight: 600 }}>
          {title}
        </SheetTitle>
      </SheetHeader>
      {(showDiffTab || showHistoryTab) ? (
        <Tabs defaultValue="edit">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            {showDiffTab && <TabsTrigger value="diff">Diff View</TabsTrigger>}
            {showHistoryTab && <TabsTrigger value="history">Version History</TabsTrigger>}
          </TabsList>
          <TabsContent value="edit">{children}</TabsContent>
        </Tabs>
      ) : children}
    </SheetContent>
  </Sheet>
);
```

---

## 9. API Client Pattern

```typescript
// src/lib/api-client.ts
const API_BASE = import.meta.env.VITE_API_URL;  // proxy-relative: /api

export const apiClient = {
  async getOpportunities(): Promise<Opportunity[]> {
    const res = await fetch(`${API_BASE}/v1/opportunities`, {
      credentials: 'include',  // JWT in httpOnly cookie — NEVER localStorage
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },

  async updateOpportunity(id: string, patch: Partial<Opportunity>): Promise<Opportunity> {
    const res = await fetch(`${API_BASE}/v1/opportunities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  },
};
```

---

## 10. React Query & Zustand Patterns

```typescript
// src/hooks/useOpportunities.ts
export function useOpportunities() {
  return useQuery({
    queryKey: ['opportunities'],
    queryFn: apiClient.getOpportunities,
    staleTime: 30_000,
  });
}

// src/stores/pipeline-store.ts
export const usePipelineStore = create<PipelineStore>((set) => ({
  selectedRows: [],
  activeTab: 'pipeline',
  columnState: [],
  setSelectedRows: (ids) => set({ selectedRows: ids }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  setColumnState: (state) => set({ columnState: state }),
}));
```

---

## 11. Accessibility Patterns

> **These are mandatory implementations, not suggestions.** ARIA violations and missing keyboard shortcuts are P1 defects with the same severity as a broken grid.

### 11.1 Notifications Bell — Correct ARIA Pattern

The bell icon in the TopBar must follow the ARIA button + live region pattern. Developers must not invent ad-hoc event listeners on the raw icon element.

```typescript
// src/components/layout/NotificationsBell.tsx
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

export const NotificationsBell: React.FC = () => {
  const { unreadCount, openNotificationsPanel } = useNotifications();

  return (
    <button
      type="button"
      onClick={openNotificationsPanel}
      aria-label={
        unreadCount > 0
          ? `Notifications — ${unreadCount} unread`
          : 'Notifications — no unread'
      }
      aria-haspopup="dialog"         // The notifications panel is a dialog-role region
      aria-expanded={false}          // Update to panel open state
      className="pp-topbar-icon-btn"
    >
      <Bell size={20} strokeWidth={2} aria-hidden="true" />
      {unreadCount > 0 && (
        <span
          aria-live="polite"         // Announces count changes to screen readers
          aria-atomic="true"
          className="pp-notification-badge"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};
```

**Rules:**
- `aria-label` on the button is mandatory and must include the unread count in its string
- The badge `<span>` must carry `aria-live="polite"` and `aria-atomic="true"` so screen readers announce count updates
- `Bell` icon must have `aria-hidden="true"` — the button label carries all meaning
- Use `aria-haspopup="dialog"` not `aria-haspopup="true"` (semantic precision)

### 11.2 Global Keyboard Shortcuts — `useGlobalShortcuts` Hook

All global keyboard shortcuts (⌘K, Escape, `G P`, `G D`, `N D`) must be registered through a single centralised hook. **Do not add `useEffect` keyboard listeners organically in individual components** — this leads to listener conflicts, duplicate firings, and impossible-to-debug priority collisions.

```typescript
// src/hooks/useGlobalShortcuts.ts
import { useEffect, useCallback } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useCommandPaletteStore } from '@/stores/command-palette-store';

type ShortcutMap = {
  key: string;
  meta?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  handler: () => void;
  description: string;   // Required — feeds the Command Palette shortcut list
};

export function useGlobalShortcuts(shortcuts: ShortcutMap[]) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Do not fire when user is typing in an input, textarea, or AG Grid cell editor
      const target = e.target as HTMLElement;
      const isEditing =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.classList.contains('ag-cell-edit-input');

      if (isEditing) return;

      for (const shortcut of shortcuts) {
        const metaMatch  = shortcut.meta  ? (e.metaKey || e.ctrlKey) : true;
        const ctrlMatch  = shortcut.ctrl  ? e.ctrlKey                 : true;
        const shiftMatch = shortcut.shift ? e.shiftKey                : true;
        const keyMatch   = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (metaMatch && ctrlMatch && shiftMatch && keyMatch) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

```typescript
// src/components/layout/AppShell.tsx — single registration point for all global shortcuts
import { useGlobalShortcuts } from '@/hooks/useGlobalShortcuts';
import { useCommandPaletteStore } from '@/stores/command-palette-store';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { open: openPalette } = useCommandPaletteStore();
  const navigate = useNavigate();

  useGlobalShortcuts([
    { key: 'k', meta: true,  handler: openPalette,              description: 'Open Command Palette' },
    { key: 'p', handler: () => navigate({ to: '/pipeline' }),   description: 'Go to Pipeline (G P)' },
    { key: 'd', handler: () => navigate({ to: '/dashboard' }),  description: 'Go to Dashboard (G D)' },
    // Escape is handled by individual modal/panel components via Radix UI's built-in onEscapeKeyDown
  ]);

  return <>{children}</>;
};
```

**Rules:**
- `useGlobalShortcuts` is the **only** permitted mechanism for registering `keydown` listeners at the `window` level
- All shortcuts must include a `description` field — this feeds the Command Palette shortcut list
- The guard clause (`isEditing`) is mandatory — shortcuts must not fire while a user is typing in a grid cell editor or text input
- `Escape` dismissal for panels and modals is handled by Radix UI's `onEscapeKeyDown` callback on `SheetContent` / `DialogContent` — do not re-implement it at the window level

### 11.3 AG Grid Keyboard Navigation — ARIA Config

```typescript
// Required on every AG Grid instance for screen reader compliance
const gridOptions: GridOptions = {
  // ...
  suppressCellFocus: false,    // Cell focus is required for keyboard navigation
  enableCellTextSelection: true,
  onGridReady: (params: GridReadyEvent) => {
    // Announce grid to screen readers
    params.api.setGridAriaProperty('label', 'Pipeline opportunities grid');
    params.api.setGridAriaProperty('rowcount', String(params.api.getDisplayedRowCount()));
  },
  onModelUpdated: (params) => {
    // Update row count announcement when filters change
    params.api.setGridAriaProperty('rowcount', String(params.api.getDisplayedRowCount()));
  },
};
```

### 11.4 Focus Management — Side Panel

```typescript
// shadcn/ui Sheet handles focus trap automatically when open={true}
// These additional props are mandatory:

<SheetContent
  side="right"
  style={{ width: 'var(--pp-side-panel-width)' }}
  onOpenAutoFocus={(e) => {
    e.preventDefault();  // Prevent Sheet from focusing the close button
    // Focus the first interactive element in the panel instead
    panelRef.current?.querySelector<HTMLElement>('input, button, [tabindex="0"]')?.focus();
  }}
  onCloseAutoFocus={(e) => {
    e.preventDefault();
    // Return focus to the grid row that triggered the panel
    triggerElementRef.current?.focus();
  }}
>
```

### 11.5 Accessibility Audit Checklist (Per PR)

- [ ] All interactive elements reachable by keyboard (Tab, Arrow keys)?
- [ ] `aria-label` or visible text on every icon button?
- [ ] `aria-live="polite"` on dynamic count badges (notifications, graduation queue)?
- [ ] `aria-haspopup` correct type (`"dialog"`, `"menu"`, `"listbox"`) — not just `true`?
- [ ] AG Grid `aria-label` and `aria-rowcount` configured via `setGridAriaProperty`?
- [ ] No `useEffect` keyboard listeners at window level outside `useGlobalShortcuts`?
- [ ] Side panel focus returns to trigger element on close?
- [ ] All `lucide-react` icons in interactive contexts have `aria-hidden="true"` on the icon and `aria-label` on the parent button?

---

## 12. Iconography Rules

> **lucide-react is the only permitted icon system.** This is not a preference — it is a hard constraint enforced by the design system.

### 12.1 The Rule

```typescript
// ✅ Always — lucide-react SVG icons
import { Bell, ChevronRight, Check, X, AlertTriangle, Upload } from 'lucide-react';

<Bell size={20} strokeWidth={2} aria-hidden="true" />
<Check size={16} strokeWidth={2} aria-hidden="true" />

// ❌ Never — Unicode character glyphs for UI elements
<span>&#10003;</span>          // ✓ character — use <Check /> instead
<span>&#10007;</span>          // ✗ character — use <X /> instead
<span>&#9654;</span>           // ▶ character — use <ChevronRight /> instead
<span>✓</span>                // Raw unicode — use <Check /> instead
<span>→</span>                 // Arrow — use <ArrowRight /> instead

// ❌ Never — emoji as UI state indicators
<span>✅</span>  // Use <Check className="text-pp-success-500" /> instead
<span>⚠️</span>  // Use <AlertTriangle className="text-pp-warning-500" /> instead
```

### 12.2 Why

Unicode glyphs render inconsistently across operating systems and browsers. They cannot be styled with Tailwind utilities or CSS variables, they have no accessible label, and they scale poorly at non-standard font sizes. `lucide-react` SVGs are pixel-perfect, inherit `currentColor`, accept Tailwind size utilities, and support `aria-hidden` correctly.

### 12.3 Icon Sizing Convention

| Context | Size | StrokeWidth |
|---|---|---|
| TopBar icons (bell, avatar, search pill) | 20px | 2 |
| Sidebar nav icons | 20px | 2 |
| Button icons (leading/trailing) | 16px | 2 |
| Grid cell action icons | 16px | 1.5 |
| Toast icons | 16px | 2 |
| Empty state illustrations | 48px | 1.5 |
| Admin status badge icons | 12px | 2 |

### 12.4 Admin Pages — Specific Prohibition

The Admin Console (/admin/*) routes were the source of the original violation. Every cell in Admin AG Grid rows that previously used `&#10003;` (✓), `&#10007;` (✗), or `&#9654;` (▶) for status or action affordances must be replaced with the corresponding `lucide-react` icon rendered via an AG Grid `cellRenderer`.

```typescript
// src/components/grid/renderers/StatusIconRenderer.tsx
import { Check, X } from 'lucide-react';
import type { ICellRendererParams } from '@ag-grid-community/core';

export const StatusIconRenderer = (params: ICellRendererParams) => {
  const container = document.createElement('div');
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.height = '100%';

  // lucide-react renders to DOM via ReactDOM — use createRoot for AG Grid cell renderers
  // Or return an HTML string with an inline SVG (preferred for performance in large grids):
  if (params.value === true || params.value === 'active') {
    container.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="var(--pp-color-success-500)" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>`;
  } else {
    container.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="var(--pp-color-danger-500)" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`;
  }
  return container;
};
```

> Note on inline SVG in AG Grid cell renderers: `lucide-react` component syntax cannot be used directly in AG Grid's non-React `cellRenderer` string-based approach for large grids. Use the inline SVG pattern above (with `var(--pp-color-*)` for stroke colour) or use AG Grid's React cell renderer with `reactiveCustomComponents: true`.

### 12.5 Permitted Unicode (Typographic Use Only)

The only permitted use of Unicode characters for display is **strictly typographic content** — never UI state or interactive affordances:

| Permitted | Context | Character |
|---|---|---|
| Trend arrows in metric cards | Typographic only — inside a `<p>` with colour from `pp-color-*` | ↑ ↓ |
| SGD currency symbol | Numeric display in grid cells | SGD (text, not Unicode) |
| Ellipsis in truncated text | CSS `text-overflow: ellipsis` handles this — no manual `…` | n/a |

All other cases: use `lucide-react`.

---

## 13. Usage Guidelines

### Do's
- Always use `var(--pp-space-*)` for spacing — never hardcode `px` values
- Use `var(--pp-color-*)` semantic tokens for all UI colours
- Use `cellClassRules` in AG Grid for health status — never `StatusBadge` inside cells
- Use `SidePanel` for all edit operations — never `Dialog`
- Write all SheetJS calls in `src/lib/excel-export.ts`
- Use `lucide-react` for all icons — never Unicode glyphs for UI affordances
- Register all global keyboard shortcuts via `useGlobalShortcuts` in `AppShell`
- Use MSW for all network mocking in tests and dev — never hardcoded React state

### Don'ts
- Never add `@ag-grid-enterprise/*` imports anywhere
- Never write SheetJS calls inline in React components
- Never store JWT in localStorage — httpOnly cookies only
- Never use `any` type without a `// justification:` comment
- Never use `style={{ color: '#hex' }}` or `style={{ color: 'hsl(...)' }}` — always use `var(--pp-color-*)`
- Never use shadcn `<Table>` for data grids — use AG Grid
- **Never use Unicode character glyphs for UI elements** — always use `lucide-react` SVGs
- **Never add `window.addEventListener('keydown', ...)` outside `useGlobalShortcuts`**
- **Never use hardcoded React state as a substitute for MSW network mocks**

### Grid vs Table vs Chart
| Context | Component |
|---|---|
| All data grids (pipeline, deals, admin, reports) | AG Grid Community (`ag-theme-pp`) |
| Small static lists inside side panels | shadcn/ui `<Table>` |
| Analytics views (Velocity, Channels, Health, Dashboard) | Recharts via `chartConfig` |

---

*Pipeline Pulse Implementation Guide v2.1 | April 2026*
