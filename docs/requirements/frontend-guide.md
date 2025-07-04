# Pipeline Pulse Implementation Guide with Design Tokens & shadcn/ui Charts

## 1. Design Token System Setup

### 1.1 Install Dependencies

```bash
# Initialize shadcn/ui with charts
npx shadcn@latest init
npx shadcn@latest add chart

# Add essential components for Pipeline Pulse
npx shadcn@latest add button card badge table tabs select dialog dropdown-menu progress skeleton toast
```

### 1.2 Design Token Structure

Create `tokens/design-tokens.css`:

```css
/* ===========================================
   PIPELINE PULSE DESIGN TOKENS
   =========================================== */

@layer base {
  :root {
    /* ========== SPACING TOKENS ========== */
    --pp-space-0: 0rem;
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
    --pp-space-20: 5rem;     /* 80px */

    /* ========== TYPOGRAPHY TOKENS ========== */
    --pp-font-size-xs: 0.75rem;     /* 12px */
    --pp-font-size-sm: 0.875rem;    /* 14px */
    --pp-font-size-md: 1rem;        /* 16px */
    --pp-font-size-lg: 1.125rem;    /* 18px */
    --pp-font-size-xl: 1.25rem;     /* 20px */
    --pp-font-size-2xl: 1.5rem;     /* 24px */
    --pp-font-size-3xl: 1.875rem;   /* 30px */
    --pp-font-size-4xl: 2.25rem;    /* 36px */
    
    --pp-font-weight-normal: 400;
    --pp-font-weight-medium: 500;
    --pp-font-weight-semibold: 600;
    --pp-font-weight-bold: 700;
    
    --pp-line-height-tight: 1.25;
    --pp-line-height-normal: 1.5;
    --pp-line-height-relaxed: 1.75;

    /* ========== BORDER RADIUS TOKENS ========== */
    --pp-radius-none: 0;
    --pp-radius-sm: 0.125rem;     /* 2px */
    --pp-radius-md: 0.375rem;     /* 6px */
    --pp-radius-lg: 0.5rem;       /* 8px */
    --pp-radius-xl: 0.75rem;      /* 12px */
    --pp-radius-2xl: 1rem;        /* 16px */
    --pp-radius-full: 9999px;

    /* ========== SHADOW TOKENS ========== */
    --pp-shadow-sm: 0 1px 2px oklch(0 0 0 / 0.05);
    --pp-shadow-md: 0 4px 6px oklch(0 0 0 / 0.1);
    --pp-shadow-lg: 0 10px 15px oklch(0 0 0 / 0.1);
    --pp-shadow-xl: 0 20px 25px oklch(0 0 0 / 0.1);

    /* ========== SEMANTIC COLOR TOKENS ========== */
    /* Primary Brand Colors */
    --pp-color-primary-50: oklch(0.969 0.016 293.756);
    --pp-color-primary-100: oklch(0.933 0.031 293.831);
    --pp-color-primary-500: oklch(0.606 0.25 292.717);   /* Main brand */
    --pp-color-primary-600: oklch(0.541 0.281 293.009);  /* Dark mode */
    --pp-color-primary-900: oklch(0.282 0.155 292.946);

    /* Status Colors */
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

    /* Chart Color Tokens */
    --pp-chart-1: oklch(0.646 0.222 41.116);    /* Orange */
    --pp-chart-2: oklch(0.6 0.118 184.704);     /* Cyan */
    --pp-chart-3: oklch(0.398 0.07 227.392);    /* Blue */
    --pp-chart-4: oklch(0.828 0.189 84.429);    /* Yellow */
    --pp-chart-5: oklch(0.769 0.188 70.08);     /* Gold */

    /* ========== COMPONENT TOKENS ========== */
    /* Button Tokens */
    --pp-button-height-sm: 2rem;
    --pp-button-height-md: 2.5rem;
    --pp-button-height-lg: 3rem;
    --pp-button-padding-x-sm: var(--pp-space-3);
    --pp-button-padding-x-md: var(--pp-space-4);
    --pp-button-padding-x-lg: var(--pp-space-6);

    /* Card Tokens */
    --pp-card-padding: var(--pp-space-6);
    --pp-card-gap: var(--pp-space-4);
    --pp-card-border-radius: var(--pp-radius-lg);

    /* Table Tokens */
    --pp-table-row-height: 3rem;
    --pp-table-cell-padding-x: var(--pp-space-4);
    --pp-table-cell-padding-y: var(--pp-space-3);

    /* ========== ANIMATION TOKENS ========== */
    --pp-duration-fast: 150ms;
    --pp-duration-normal: 200ms;
    --pp-duration-slow: 300ms;
    --pp-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
    --pp-ease-out: cubic-bezier(0, 0, 0.2, 1);
  }

  .dark {
    /* Dark mode overrides for semantic tokens */
    --pp-color-primary-500: oklch(0.541 0.281 293.009);
    --pp-color-success-500: oklch(0.6 0.2 142);
    --pp-color-warning-500: oklch(0.769 0.188 70.08);
    --pp-color-danger-500: oklch(0.704 0.191 22.216);
    
    /* Chart colors - dark mode variants */
    --pp-chart-1: oklch(0.488 0.243 264.376);
    --pp-chart-2: oklch(0.696 0.17 162.48);
    --pp-chart-3: oklch(0.769 0.188 70.08);
    --pp-chart-4: oklch(0.627 0.265 303.9);
    --pp-chart-5: oklch(0.645 0.246 16.439);
  }
}
```

### 1.3 shadcn/ui Integration with Tokens

Update `app/globals.css`:

```css
@import './tokens/design-tokens.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Map design tokens to shadcn/ui variables */
    --background: var(--pp-color-neutral-50);
    --foreground: var(--pp-color-neutral-900);
    --card: var(--pp-color-neutral-50);
    --card-foreground: var(--pp-color-neutral-900);
    --popover: var(--pp-color-neutral-50);
    --popover-foreground: var(--pp-color-neutral-900);
    --primary: var(--pp-color-primary-500);
    --primary-foreground: var(--pp-color-primary-50);
    --secondary: var(--pp-color-neutral-100);
    --secondary-foreground: var(--pp-color-neutral-900);
    --muted: var(--pp-color-neutral-100);
    --muted-foreground: var(--pp-color-neutral-500);
    --accent: var(--pp-color-neutral-100);
    --accent-foreground: var(--pp-color-neutral-900);
    --destructive: var(--pp-color-danger-500);
    --destructive-foreground: var(--pp-color-neutral-50);
    --border: var(--pp-color-neutral-100);
    --input: var(--pp-color-neutral-100);
    --ring: var(--pp-color-primary-500);
    --radius: var(--pp-radius-lg);
    
    /* Chart color mapping */
    --chart-1: var(--pp-chart-1);
    --chart-2: var(--pp-chart-2);
    --chart-3: var(--pp-chart-3);
    --chart-4: var(--pp-chart-4);
    --chart-5: var(--pp-chart-5);
  }

  .dark {
    --background: var(--pp-color-neutral-900);
    --foreground: var(--pp-color-neutral-50);
    --card: oklch(0.21 0.006 285.885);
    --card-foreground: var(--pp-color-neutral-50);
    --popover: oklch(0.21 0.006 285.885);
    --popover-foreground: var(--pp-color-neutral-50);
    --primary: var(--pp-color-primary-600);
    --primary-foreground: var(--pp-color-primary-50);
    --secondary: oklch(0.274 0.006 286.033);
    --secondary-foreground: var(--pp-color-neutral-50);
    --muted: oklch(0.274 0.006 286.033);
    --muted-foreground: var(--pp-color-neutral-600);
    --accent: oklch(0.274 0.006 286.033);
    --accent-foreground: var(--pp-color-neutral-50);
    --destructive: var(--pp-color-danger-600);
    --destructive-foreground: var(--pp-color-neutral-900);
    --border: oklch(1 0 0 / 10%);
    --input: oklch(1 0 0 / 15%);
    --ring: var(--pp-color-primary-600);
  }
}

/* Component-specific token applications */
@layer components {
  .pp-metric-card {
    padding: var(--pp-card-padding);
    border-radius: var(--pp-card-border-radius);
    box-shadow: var(--pp-shadow-sm);
    transition: box-shadow var(--pp-duration-normal) var(--pp-ease-out);
  }

  .pp-metric-card:hover {
    box-shadow: var(--pp-shadow-md);
  }

  .pp-status-indicator {
    font-size: var(--pp-font-size-xs);
    font-weight: var(--pp-font-weight-medium);
    padding: var(--pp-space-1) var(--pp-space-2);
    border-radius: var(--pp-radius-md);
  }

  .pp-data-table {
    --table-row-height: var(--pp-table-row-height);
  }

  .pp-data-table th,
  .pp-data-table td {
    padding: var(--pp-table-cell-padding-y) var(--pp-table-cell-padding-x);
  }
}
```

## 2. Chart Components with Design Tokens

### 2.1 Pipeline Value Area Chart

Create `components/charts/pipeline-value-chart.tsx`:

```tsx
"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "Jan", pipeline: 186000, closed: 80000 },
  { month: "Feb", pipeline: 305000, closed: 120000 },
  { month: "Mar", pipeline: 237000, closed: 190000 },
  { month: "Apr", pipeline: 273000, closed: 165000 },
  { month: "May", pipeline: 209000, closed: 140000 },
  { month: "Jun", pipeline: 324000, closed: 200000 },
]

const chartConfig = {
  pipeline: {
    label: "Pipeline Value",
    color: "var(--pp-chart-1)", // Orange
  },
  closed: {
    label: "Closed Won",
    color: "var(--pp-chart-2)", // Cyan
  },
} satisfies ChartConfig

export function PipelineValueChart() {
  return (
    <Card className="pp-metric-card">
      <CardHeader>
        <CardTitle style={{ fontSize: "var(--pp-font-size-lg)", fontWeight: "var(--pp-font-weight-semibold)" }}>
          Pipeline Value Trend
        </CardTitle>
        <CardDescription>
          Pipeline value vs closed deals over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${value / 1000}K`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="closed"
              type="natural"
              fill="var(--color-closed)"
              fillOpacity={0.4}
              stroke="var(--color-closed)"
              stackId="a"
            />
            <Area
              dataKey="pipeline"
              type="natural"
              fill="var(--color-pipeline)"
              fillOpacity={0.4}
              stroke="var(--color-pipeline)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
```

### 2.2 O2R Phase Distribution Chart

Create `components/charts/o2r-phase-chart.tsx`:

```tsx
"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { phase: "Phase I", deals: 12, value: 450000 },
  { phase: "Phase II", deals: 18, value: 720000 },
  { phase: "Phase III", deals: 15, value: 680000 },
  { phase: "Phase IV", deals: 8, value: 340000 },
]

const chartConfig = {
  deals: {
    label: "Deal Count",
    color: "var(--pp-chart-3)", // Blue
  },
  value: {
    label: "Total Value",
    color: "var(--pp-chart-1)", // Orange
  },
} satisfies ChartConfig

export function O2RPhaseChart() {
  return (
    <Card className="pp-metric-card">
      <CardHeader>
        <CardTitle style={{ fontSize: "var(--pp-font-size-lg)", fontWeight: "var(--pp-font-weight-semibold)" }}>
          O2R Phase Distribution
        </CardTitle>
        <CardDescription>
          Deal count and value across O2R phases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="phase"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              yAxisId="deals"
              orientation="left"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              yAxisId="value"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${value / 1000}K`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Area
              yAxisId="deals"
              dataKey="deals"
              type="natural"
              fill="var(--color-deals)"
              fillOpacity={0.4}
              stroke="var(--color-deals)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
```

### 2.3 Health Status Overview Chart

Create `components/charts/health-status-chart.tsx`:

```tsx
"use client"

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { date: "Jan", green: 25, yellow: 8, red: 3, blocked: 2 },
  { date: "Feb", green: 28, yellow: 6, red: 4, blocked: 1 },
  { date: "Mar", green: 32, yellow: 9, red: 2, blocked: 3 },
  { date: "Apr", green: 30, yellow: 12, red: 5, blocked: 2 },
  { date: "May", green: 35, yellow: 7, red: 3, blocked: 2 },
  { date: "Jun", green: 38, yellow: 10, red: 4, blocked: 1 },
]

const chartConfig = {
  green: {
    label: "On Track",
    color: "var(--pp-color-success-500)",
  },
  yellow: {
    label: "Minor Issues",
    color: "var(--pp-color-warning-500)",
  },
  red: {
    label: "Critical",
    color: "var(--pp-color-danger-500)",
  },
  blocked: {
    label: "Blocked",
    color: "var(--pp-color-neutral-500)",
  },
} satisfies ChartConfig

export function HealthStatusChart() {
  return (
    <Card className="pp-metric-card">
      <CardHeader>
        <CardTitle style={{ fontSize: "var(--pp-font-size-lg)", fontWeight: "var(--pp-font-weight-semibold)" }}>
          Deal Health Trends
        </CardTitle>
        <CardDescription>
          Distribution of deal health status over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Area
              dataKey="green"
              type="natural"
              fill="var(--color-green)"
              fillOpacity={0.4}
              stroke="var(--color-green)"
              stackId="a"
            />
            <Area
              dataKey="yellow"
              type="natural"
              fill="var(--color-yellow)"
              fillOpacity={0.4}
              stroke="var(--color-yellow)"
              stackId="a"
            />
            <Area
              dataKey="red"
              type="natural"
              fill="var(--color-red)"
              fillOpacity={0.4}
              stroke="var(--color-red)"
              stackId="a"
            />
            <Area
              dataKey="blocked"
              type="natural"
              fill="var(--color-blocked)"
              fillOpacity={0.4}
              stroke="var(--color-blocked)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
```

## 3. Token-Based Components

### 3.1 Status Badge with Design Tokens

Create `components/ui/status-badge.tsx`:

```tsx
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusType = "success" | "warning" | "danger" | "neutral"

interface StatusBadgeProps {
  status: StatusType
  label?: string
  className?: string
  size?: "sm" | "md" | "lg"
}

const statusConfig = {
  success: {
    label: "On Track",
    className: "text-white",
    style: {
      backgroundColor: "var(--pp-color-success-500)",
      color: "white",
    },
  },
  warning: {
    label: "Minor Issues",
    className: "text-black",
    style: {
      backgroundColor: "var(--pp-color-warning-500)",
      color: "black",
    },
  },
  danger: {
    label: "Critical",
    className: "text-white",
    style: {
      backgroundColor: "var(--pp-color-danger-500)",
      color: "white",
    },
  },
  neutral: {
    label: "Blocked",
    className: "text-white",
    style: {
      backgroundColor: "var(--pp-color-neutral-500)",
      color: "white",
    },
  },
}

const sizeConfig = {
  sm: {
    fontSize: "var(--pp-font-size-xs)",
    padding: "var(--pp-space-1) var(--pp-space-2)",
  },
  md: {
    fontSize: "var(--pp-font-size-sm)",
    padding: "var(--pp-space-2) var(--pp-space-3)",
  },
  lg: {
    fontSize: "var(--pp-font-size-md)",
    padding: "var(--pp-space-3) var(--pp-space-4)",
  },
}

export function StatusBadge({ 
  status, 
  label, 
  className, 
  size = "md" 
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const sizeStyles = sizeConfig[size]
  
  return (
    <Badge 
      className={cn("pp-status-indicator", config.className, className)}
      style={{
        ...config.style,
        ...sizeStyles,
        borderRadius: "var(--pp-radius-md)",
        fontWeight: "var(--pp-font-weight-medium)",
        transition: `all var(--pp-duration-normal) var(--pp-ease-out)`,
      }}
      variant="default"
    >
      <span style={{ marginRight: "var(--pp-space-1)" }}>●</span>
      {label || config.label}
    </Badge>
  )
}
```

### 3.2 Metric Card with Design Tokens

Create `components/ui/metric-card.tsx`:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  trend?: "up" | "down" | "neutral"
  prefix?: string
  suffix?: string
  className?: string
}

export function MetricCard({
  title,
  value,
  change,
  trend = "neutral",
  prefix = "",
  suffix = "",
  className,
}: MetricCardProps) {
  const TrendIcon = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  }[trend]

  const trendStyles = {
    up: { color: "var(--pp-color-success-500)" },
    down: { color: "var(--pp-color-danger-500)" },
    neutral: { color: "var(--pp-color-neutral-500)" },
  }[trend]

  return (
    <Card className={cn("pp-metric-card", className)}>
      <CardHeader 
        className="flex flex-row items-center justify-between space-y-0"
        style={{ paddingBottom: "var(--pp-space-2)" }}
      >
        <CardTitle 
          style={{ 
            fontSize: "var(--pp-font-size-sm)",
            fontWeight: "var(--pp-font-weight-medium)",
            color: "var(--pp-color-neutral-600)",
          }}
        >
          {title}
        </CardTitle>
        {change !== undefined && (
          <TrendIcon 
            className="h-4 w-4" 
            style={trendStyles}
          />
        )}
      </CardHeader>
      <CardContent style={{ paddingTop: 0 }}>
        <div 
          style={{ 
            fontSize: "var(--pp-font-size-2xl)",
            fontWeight: "var(--pp-font-weight-bold)",
            lineHeight: "var(--pp-line-height-tight)",
          }}
        >
          {prefix}{value}{suffix}
        </div>
        {change !== undefined && (
          <p 
            style={{ 
              fontSize: "var(--pp-font-size-xs)",
              marginTop: "var(--pp-space-1)",
              ...trendStyles,
            }}
          >
            {trend === "up" && "+"}
            {change}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

### 3.3 O2R Phase Indicator with Tokens

Create `components/ui/o2r-phase-indicator.tsx`:

```tsx
import { cn } from "@/lib/utils"

interface O2RPhaseIndicatorProps {
  currentPhase: 1 | 2 | 3 | 4
  className?: string
}

const phases = [
  { number: 1, label: "Opportunity" },
  { number: 2, label: "Proposal" },
  { number: 3, label: "Execution" },
  { number: 4, label: "Revenue" },
]

export function O2RPhaseIndicator({ currentPhase, className }: O2RPhaseIndicatorProps) {
  return (
    <div 
      className={cn("flex items-center", className)}
      style={{ gap: "var(--pp-space-2)" }}
    >
      {phases.map((phase, index) => (
        <div key={phase.number} className="flex items-center">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: "var(--pp-space-8)",
              height: "var(--pp-space-8)",
              fontSize: "var(--pp-font-size-sm)",
              fontWeight: "var(--pp-font-weight-semibold)",
              backgroundColor: phase.number <= currentPhase 
                ? "var(--pp-color-primary-500)" 
                : "var(--pp-color-neutral-100)",
              color: phase.number <= currentPhase 
                ? "var(--pp-color-primary-50)" 
                : "var(--pp-color-neutral-500)",
              transition: `all var(--pp-duration-normal) var(--pp-ease-out)`,
            }}
          >
            {phase.number}
          </div>
          {index < phases.length - 1 && (
            <div
              style={{
                marginLeft: "var(--pp-space-2)",
                marginRight: "var(--pp-space-2)",
                height: "2px",
                width: "var(--pp-space-8)",
                backgroundColor: phase.number < currentPhase
                  ? "var(--pp-color-primary-500)"
                  : "var(--pp-color-neutral-100)",
                transition: `all var(--pp-duration-normal) var(--pp-ease-out)`,
              }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
```

## 4. Dashboard Implementation with Charts

Create `app/dashboard/page.tsx`:

```tsx
import { MetricCard } from "@/components/ui/metric-card"
import { StatusBadge } from "@/components/ui/status-badge"
import { O2RPhaseIndicator } from "@/components/ui/o2r-phase-indicator"
import { PipelineValueChart } from "@/components/charts/pipeline-value-chart"
import { O2RPhaseChart } from "@/components/charts/o2r-phase-chart"
import { HealthStatusChart } from "@/components/charts/health-status-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RefreshCw } from "lucide-react"

export default function DashboardPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--pp-space-6)" }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 
            style={{ 
              fontSize: "var(--pp-font-size-3xl)",
              fontWeight: "var(--pp-font-weight-bold)",
              lineHeight: "var(--pp-line-height-tight)",
            }}
          >
            Pipeline Dashboard
          </h1>
          <p 
            style={{ 
              fontSize: "var(--pp-font-size-md)",
              color: "var(--pp-color-neutral-600)",
              marginTop: "var(--pp-space-1)",
            }}
          >
            Real-time insights into your sales pipeline
          </p>
        </div>
        <Button 
          style={{
            height: "var(--pp-button-height-md)",
            paddingLeft: "var(--pp-button-padding-x-md)",
            paddingRight: "var(--pp-button-padding-x-md)",
          }}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Sync Now
        </Button>
      </div>

      {/* Metrics Grid */}
      <div 
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        style={{ gap: "var(--pp-space-4)" }}
      >
        <MetricCard
          title="Total Pipeline Value"
          value="1.2M"
          prefix="$"
          change={12}
          trend="up"
        />
        <MetricCard
          title="Deals in Progress"
          value="47"
          change={-5}
          trend="down"
        />
        <MetricCard
          title="Average Deal Size"
          value="25.5K"
          prefix="$"
          change={8}
          trend="up"
        />
        <MetricCard
          title="Win Rate"
          value="68"
          suffix="%"
          change={3}
          trend="up"
        />
      </div>

      {/* Charts Grid */}
      <div 
        className="grid gap-6 lg:grid-cols-2"
        style={{ gap: "var(--pp-space-6)" }}
      >
        <PipelineValueChart />
        <O2RPhaseChart />
      </div>

      {/* Full Width Chart */}
      <HealthStatusChart />

      {/* O2R Status Overview */}
      <Card className="pp-metric-card">
        <CardHeader>
          <CardTitle 
            style={{ 
              fontSize: "var(--pp-font-size-lg)",
              fontWeight: "var(--pp-font-weight-semibold)",
            }}
          >
            O2R Pipeline Status
          </CardTitle>
        </CardHeader>
        <CardContent style={{ display: "flex", flexDirection: "column", gap: "var(--pp-space-4)" }}>
          <O2RPhaseIndicator currentPhase={2} />
          <div 
            className="grid gap-4 md:grid-cols-4"
            style={{ gap: "var(--pp-space-4)" }}
          >
            {[
              { phase: "Phase I", count: 12, status: "success" as const },
              { phase: "Phase II", count: 18, status: "warning" as const },
              { phase: "Phase III", count: 15, status: "success" as const },
              { phase: "Phase IV", count: 2, status: "danger" as const },
            ].map((item) => (
              <div 
                key={item.phase}
                style={{ display: "flex", flexDirection: "column", gap: "var(--pp-space-2)" }}
              >
                <p 
                  style={{ 
                    fontSize: "var(--pp-font-size-sm)",
                    fontWeight: "var(--pp-font-weight-medium)",
                  }}
                >
                  {item.phase}
                </p>
                <p 
                  style={{ 
                    fontSize: "var(--pp-font-size-2xl)",
                    fontWeight: "var(--pp-font-weight-bold)",
                  }}
                >
                  {item.count}
                </p>
                <StatusBadge status={item.status} size="sm" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attention Required Table */}
      <Card className="pp-metric-card">
        <CardHeader>
          <CardTitle 
            style={{ 
              fontSize: "var(--pp-font-size-lg)",
              fontWeight: "var(--pp-font-weight-semibold)",
            }}
          >
            Attention Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="pp-data-table">
            <TableHeader>
              <TableRow>
                <TableHead>Deal Name</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Days in Phase</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell 
                  style={{ fontWeight: "var(--pp-font-weight-medium)" }}
                >
                  TechCorp Enterprise
                </TableCell>
                <TableCell>Phase II</TableCell>
                <TableCell>$125,000</TableCell>
                <TableCell>45</TableCell>
                <TableCell>
                  <StatusBadge status="danger" size="sm" />
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell 
                  style={{ fontWeight: "var(--pp-font-weight-medium)" }}
                >
                  StartupXYZ Growth
                </TableCell>
                <TableCell>Phase IV</TableCell>
                <TableCell>$75,000</TableCell>
                <TableCell>60</TableCell>
                <TableCell>
                  <StatusBadge status="neutral" size="sm" />
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline">
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 5. Tailwind Configuration for Design Tokens

Update `tailwind.config.js`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      spacing: {
        '0': 'var(--pp-space-0)',
        '1': 'var(--pp-space-1)',
        '2': 'var(--pp-space-2)',
        '3': 'var(--pp-space-3)',
        '4': 'var(--pp-space-4)',
        '5': 'var(--pp-space-5)',
        '6': 'var(--pp-space-6)',
        '8': 'var(--pp-space-8)',
        '10': 'var(--pp-space-10)',
        '12': 'var(--pp-space-12)',
        '16': 'var(--pp-space-16)',
        '20': 'var(--pp-space-20)',
      },
      fontSize: {
        'xs': 'var(--pp-font-size-xs)',
        'sm': 'var(--pp-font-size-sm)',
        'base': 'var(--pp-font-size-md)',
        'lg': 'var(--pp-font-size-lg)',
        'xl': 'var(--pp-font-size-xl)',
        '2xl': 'var(--pp-font-size-2xl)',
        '3xl': 'var(--pp-font-size-3xl)',
        '4xl': 'var(--pp-font-size-4xl)',
      },
      fontWeight: {
        'normal': 'var(--pp-font-weight-normal)',
        'medium': 'var(--pp-font-weight-medium)',
        'semibold': 'var(--pp-font-weight-semibold)',
        'bold': 'var(--pp-font-weight-bold)',
      },
      lineHeight: {
        'tight': 'var(--pp-line-height-tight)',
        'normal': 'var(--pp-line-height-normal)',
        'relaxed': 'var(--pp-line-height-relaxed)',
      },
      borderRadius: {
        'none': 'var(--pp-radius-none)',
        'sm': 'var(--pp-radius-sm)',
        'DEFAULT': 'var(--pp-radius-md)',
        'md': 'var(--pp-radius-md)',
        'lg': 'var(--pp-radius-lg)',
        'xl': 'var(--pp-radius-xl)',
        '2xl': 'var(--pp-radius-2xl)',
        'full': 'var(--pp-radius-full)',
      },
      boxShadow: {
        'sm': 'var(--pp-shadow-sm)',
        'DEFAULT': 'var(--pp-shadow-md)',
        'md': 'var(--pp-shadow-md)',
        'lg': 'var(--pp-shadow-lg)',
        'xl': 'var(--pp-shadow-xl)',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Pipeline Pulse specific colors
        'pp-primary': {
          50: 'var(--pp-color-primary-50)',
          100: 'var(--pp-color-primary-100)',
          500: 'var(--pp-color-primary-500)',
          600: 'var(--pp-color-primary-600)',
          900: 'var(--pp-color-primary-900)',
        },
        'pp-success': {
          50: 'var(--pp-color-success-50)',
          500: 'var(--pp-color-success-500)',
          600: 'var(--pp-color-success-600)',
        },
        'pp-warning': {
          50: 'var(--pp-color-warning-50)',
          500: 'var(--pp-color-warning-500)',
          600: 'var(--pp-color-warning-600)',
        },
        'pp-danger': {
          50: 'var(--pp-color-danger-50)',
          500: 'var(--pp-color-danger-500)',
          600: 'var(--pp-color-danger-600)',
        },
        'pp-neutral': {
          50: 'var(--pp-color-neutral-50)',
          100: 'var(--pp-color-neutral-100)',
          500: 'var(--pp-color-neutral-500)',
          600: 'var(--pp-color-neutral-600)',
          900: 'var(--pp-color-neutral-900)',
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

## 6. Usage Guidelines

### 6.1 Design Token Best Practices

1. **Always use tokens for spacing**: Use `var(--pp-space-*)` instead of hardcoded values
2. **Typography consistency**: Apply `var(--pp-font-size-*)` and `var(--pp-font-weight-*)` tokens
3. **Color semantics**: Use semantic color tokens (`--pp-color-success-500`) over chart colors for UI elements
4. **Animation consistency**: Use `var(--pp-duration-*)` and `var(--pp-ease-*)` for all transitions

### 6.2 Chart Integration

1. **Color mapping**: Always map chart colors to design tokens
2. **Responsive design**: Charts automatically adapt to container sizes
3. **Accessibility**: All charts include proper labels and ARIA support
4. **Performance**: Use React.memo for chart components to prevent unnecessary re-renders

### 6.3 Component Development

1. **Token-first approach**: Start with design tokens, fall back to Tailwind classes
2. **Consistent spacing**: Use token-based spacing for all layouts
3. **Theme awareness**: Ensure all components work in both light and dark modes
4. **Performance**: Leverage CSS custom properties for dynamic theming

This implementation provides a robust foundation for Pipeline Pulse using modern design tokens and the latest shadcn/ui chart components. The token system ensures consistency, maintainability, and easy theme customization while the chart integration provides powerful data visualization capabilities.