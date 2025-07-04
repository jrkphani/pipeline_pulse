"use client"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
export interface O2RPhaseDataPoint {
  phase: string;
  deals: number;
  value: number;
}

export interface O2RPhaseChartProps {
  data?: O2RPhaseDataPoint[];
  loading?: boolean;
  className?: string;
}

const chartConfig = {
  deals: {
    label: "Deal Count",
    color: "var(--pp-chart-3)", // Blue
  },
  value: {
    label: "Total Value (SGD)",
    color: "var(--pp-chart-1)", // Orange
  },
} satisfies ChartConfig

export function O2RPhaseChart({ 
  data = [], 
  loading = false, 
  className 
}: O2RPhaseChartProps) {
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
            O2R Phase Distribution
          </CardTitle>
          <CardDescription>
            Deal count and value across O2R phases
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
            O2R Phase Distribution
          </CardTitle>
          <CardDescription>
            Deal count and value across O2R phases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No O2R phase data available</p>
              <p className="text-xs mt-1">Data will appear once opportunities are synced</p>
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
          O2R Phase Distribution
        </CardTitle>
        <CardDescription>
          Deal count and value across O2R phases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data}
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
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              yAxisId="deals"
              dataKey="deals"
              fill="var(--color-deals)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}