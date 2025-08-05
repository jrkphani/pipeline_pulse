"use client"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart"
import type { ChartConfig } from "../ui/chart"

// Placeholder data structure interface (not mock data)
export interface HealthStatusDataPoint {
  date: string;
  green: number;
  yellow: number;
  red: number;
  blocked: number;
}

export interface HealthStatusChartProps {
  data?: HealthStatusDataPoint[];
  loading?: boolean;
  className?: string;
}

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

export function HealthStatusChart({ 
  data = [], 
  loading = false, 
  className 
}: HealthStatusChartProps) {
  if (loading) {
    return (
      <Card className={`pp-metric-card ${className || ''}`}>
        <CardHeader>
          <CardTitle 
            style={{ 
              fontSize: "var(--pp-font-size-lg)", 
              fontWeight: "var(--pp-font-weight-semibold)" 
            }}
          >
            Deal Health Trends
          </CardTitle>
          <CardDescription>
            Distribution of deal health status over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className={`pp-metric-card ${className || ''}`}>
        <CardHeader>
          <CardTitle 
            style={{ 
              fontSize: "var(--pp-font-size-lg)", 
              fontWeight: "var(--pp-font-weight-semibold)" 
            }}
          >
            Deal Health Trends
          </CardTitle>
          <CardDescription>
            Distribution of deal health status over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No health trend data available</p>
              <p className="text-xs mt-1">Health tracking will begin once deals are processed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`pp-metric-card ${className || ''}`}>
      <CardHeader>
        <CardTitle 
          style={{ 
            fontSize: "var(--pp-font-size-lg)", 
            fontWeight: "var(--pp-font-weight-semibold)" 
          }}
        >
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
            data={data}
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
            <YAxis
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