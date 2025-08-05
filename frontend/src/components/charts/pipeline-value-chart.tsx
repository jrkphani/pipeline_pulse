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
export interface PipelineValueDataPoint {
  month: string;
  pipeline: number;
  closed: number;
}

export interface PipelineValueChartProps {
  data?: PipelineValueDataPoint[];
  loading?: boolean;
  className?: string;
}

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

export function PipelineValueChart({ 
  data = [], 
  loading = false, 
  className 
}: PipelineValueChartProps) {
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
            Pipeline Value Trend
          </CardTitle>
          <CardDescription>
            Pipeline value vs closed deals over time
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
            Pipeline Value Trend
          </CardTitle>
          <CardDescription>
            Pipeline value vs closed deals over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No pipeline data available</p>
              <p className="text-xs mt-1">Data will appear once synchronization is complete</p>
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
            data={data}
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
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
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