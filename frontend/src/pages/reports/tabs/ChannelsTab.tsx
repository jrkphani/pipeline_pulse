import { useMemo } from 'react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import type { ReportsData } from '@/mocks/mock-reports';

interface ChannelsTabProps {
  data: ReportsData['channels'];
}

interface ChannelsTabProps {
  data: ReportsData['channels'];
}

function MetricTile({
  label,
  value,
  sub,
  color,
  smallValue,
}: {
  label: string;
  value: string;
  sub: string;
  color?: 'green' | 'amber';
  smallValue?: boolean;
}) {
  const colorClass =
    color === 'green' ? 'text-[#0F6E56]' : color === 'amber' ? 'text-[#854F0B]' : 'text-foreground';

  return (
    <div className="rounded-md bg-muted/50 px-3 py-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn('mt-1 font-medium', smallValue ? 'text-[15px]' : 'text-xl', colorClass)}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-muted-foreground/70">{sub}</div>
    </div>
  );
}

function parseSgd(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.]/g, ''));
  if (s.includes('M')) return n * 1000;
  if (s.includes('K')) return n;
  return n / 1000;
}

export function ChannelsTab({ data }: ChannelsTabProps) {
  const { metrics, heatmap, revenueByChannel } = data;

  const revenueChartConfig = useMemo<ChartConfig>(() => ({
    pipeline: { label: 'Total Pipeline', color: 'var(--pp-chart-1)' },
    won: { label: 'Won FY', color: 'var(--pp-chart-2)' },
  }), []);

  const channelChartData = useMemo(() =>
    revenueByChannel.map((r) => ({
      channel: r.channel,
      pipeline: parseSgd(r.totalPipeline),
      won: parseSgd(r.wonFy),
    })),
    [revenueByChannel],
  );

  const nivoHeatmapData = useMemo(() => {
    return heatmap.sources.map((source, ri) => ({
      id: source,
      data: heatmap.sellers.map((seller, ci) => ({
        x: seller,
        y: heatmap.cells[ri][ci].value
      }))
    }));
  }, [heatmap]);

  return (
    <div className="space-y-3">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-2.5">
        <MetricTile label="Top Channel" value={metrics.topChannel} sub={`${metrics.topChannelDeals} active deals`} smallValue />
        <MetricTile label="Top Seller (vol)" value={metrics.topSeller} sub={`${metrics.topSellerDeals} active`} smallValue />
        <MetricTile label="SDR Sourced Rev" value={metrics.sdrSourcedRev} sub={`${metrics.sdrSourcedPct}% of pipeline`} color="green" />
        <MetricTile label="Direct / Self-Gen" value={metrics.directRev} sub={`${metrics.directPct}% of pipeline`} color="amber" />
      </div>

      {/* Heatmap */}
      <Card className="py-3">
        <CardHeader className="px-4 py-0 pb-2 border-b border-border/50">
          <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Panel A — Deal Volume Heatmap Matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] w-full px-4">
          <ResponsiveHeatMap
            data={nivoHeatmapData}
            margin={{ top: 70, right: 30, bottom: 30, left: 100 }}
            valueFormat=">-.0f"
            colors={{
              type: 'quantize',
              colors: ['oklch(0.92 0.04 41)', 'oklch(0.79 0.12 41)', 'oklch(0.72 0.17 41)', 'oklch(0.646 0.222 41.116)'],
              steps: 4
            }}
            emptyColor="#F9FAFB"
            borderColor="#ffffff"
            borderWidth={1}
            borderRadius={3}
            axisTop={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -35,
              legend: '',
              legendOffset: 46
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Lead Source',
              legendPosition: 'middle',
              legendOffset: -85
            }}
            labelTextColor={{
              from: 'color',
              modifiers: [ [ 'darker', 2.5 ] ]
            }}
            theme={{
              axis: {
                ticks: {
                  text: { fontSize: 11, fill: 'var(--muted-foreground)', fontFamily: 'inherit' }
                },
                legend: {
                  text: { fontSize: 11, fontWeight: 500, fill: 'var(--muted-foreground)', fontFamily: 'inherit' }
                }
              },
              labels: {
                text: { fontSize: 13, fontWeight: 500, fontFamily: 'inherit' }
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Pipeline vs won chart */}
      <Card className="py-3">
        <CardHeader className="px-4 py-0">
          <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Pipeline vs won revenue by channel (S$K)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-3">
          <ChartContainer config={revenueChartConfig} className="h-[200px]">
            <BarChart data={channelChartData}>
              <XAxis dataKey="channel" tickLine={false} axisLine={false} fontSize={9} />
              <YAxis tickLine={false} axisLine={false} fontSize={9} tickFormatter={(v: number) => `${v}K`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="pipeline" fill="var(--color-pipeline)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="won" fill="var(--color-won)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Revenue by channel */}
      <Card className="py-3">
        <CardHeader className="px-4 py-0">
          <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Panel B — Revenue by channel (SGD, pipeline value)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead>Deal Count</TableHead>
                <TableHead>Avg Deal Size</TableHead>
                <TableHead>Total Pipeline (SGD)</TableHead>
                <TableHead>Won (FY26-27)</TableHead>
                <TableHead>Conv Rate (est.)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenueByChannel.map((row) => (
                <TableRow key={row.channel}>
                  <TableCell className="font-medium">{row.channel}</TableCell>
                  <TableCell>{row.dealCount}</TableCell>
                  <TableCell>{row.avgDealSize}</TableCell>
                  <TableCell>{row.totalPipeline}</TableCell>
                  <TableCell>{row.wonFy}</TableCell>
                  <TableCell>{row.convRate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
