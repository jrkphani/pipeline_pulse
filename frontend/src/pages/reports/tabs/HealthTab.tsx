import { useMemo } from 'react';
import { Pie, PieChart, Bar, BarChart, XAxis, YAxis, Cell } from 'recharts';
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

interface HealthTabProps {
  data: ReportsData['health'];
}

function MetricTile({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color?: 'green' | 'amber' | 'red';
}) {
  const colorClass =
    color === 'green'
      ? 'text-[#0F6E56]'
      : color === 'amber'
        ? 'text-[#854F0B]'
        : color === 'red'
          ? 'text-[#A32D2D]'
          : 'text-foreground';

  return (
    <div className="rounded-md bg-muted/50 px-3 py-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn('mt-1 text-xl font-medium', colorClass)}>{value}</div>
      <div className="mt-0.5 text-[10px] text-muted-foreground/70">{sub}</div>
    </div>
  );
}

export function HealthTab({ data }: HealthTabProps) {
  const { metrics, stageDistribution, gtmPipeline, stageHealth } = data;

  const donutConfig = useMemo<ChartConfig>(() => {
    const cfg: ChartConfig = {};
    for (const s of stageDistribution) {
      cfg[s.name] = { label: s.name, color: s.color };
    }
    return cfg;
  }, [stageDistribution]);

  const barConfig = useMemo<ChartConfig>(
    () => ({ value: { label: 'Pipeline (S$000)', color: 'var(--pp-chart-1)' } }),
    [],
  );

  // Totals
  const totalCount = stageHealth.reduce((s, r) => s + r.count, 0);

  return (
    <div className="space-y-3">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-2.5">
        <MetricTile label="Active Pipeline" value={metrics.activePipeline} sub={`${metrics.activeCount} active opportunities`} />
        <MetricTile label="Weighted Forecast" value={metrics.weightedForecast} sub="Q1–Q2 FY26-27" color="amber" />
        <MetricTile label="Coverage Ratio" value={`${metrics.coverageRatio}×`} sub="Min 4× required" color="amber" />
        <MetricTile label="Stall Flags" value={`${metrics.stallRed} RED · ${metrics.stallAmber} AMBER`} sub={`${metrics.stallPct}% need attention`} color="red" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Donut — stage distribution */}
        <Card className="py-3">
          <CardHeader className="px-4 py-0">
            <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Stage distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-3">
            <ChartContainer config={donutConfig} className="mx-auto aspect-square h-[180px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                <Pie
                  data={stageDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={70}
                  strokeWidth={2}
                  stroke="#fff"
                >
                  {stageDistribution.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="name" />}
                  verticalAlign="bottom"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Bar — GTM pipeline */}
        <Card className="py-3">
          <CardHeader className="px-4 py-0">
            <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Pipeline by GTM motion (S$000)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-3">
            <ChartContainer config={barConfig} className="h-[180px]">
              <BarChart data={gtmPipeline}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={9} />
                <YAxis tickLine={false} axisLine={false} fontSize={9} tickFormatter={(v: number) => `${v}K`} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="var(--color-value)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stage health table */}
      <Card className="py-3">
        <CardHeader className="px-4 py-0">
          <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Stage health summary
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Pipeline Value (SGD)</TableHead>
                <TableHead>Avg Deal</TableHead>
                <TableHead>Prob. Weight</TableHead>
                <TableHead>Weighted Value</TableHead>
                <TableHead>On Track</TableHead>
                <TableHead>Stalled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stageHealth.map((row) => (
                <TableRow key={row.stage}>
                  <TableCell className="font-medium">{row.stage}</TableCell>
                  <TableCell>{row.count}</TableCell>
                  <TableCell>{row.pipelineValue}</TableCell>
                  <TableCell>{row.avgDeal}</TableCell>
                  <TableCell>{row.probWeight}%</TableCell>
                  <TableCell>{row.weightedValue}</TableCell>
                  <TableCell>
                    <span className="inline-block rounded bg-[#EAF3DE] px-2 py-0.5 text-[10px] font-medium text-[#3B6D11]">
                      {row.onTrack}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        'inline-block rounded px-2 py-0.5 text-[10px] font-medium',
                        row.stalled > 0
                          ? 'bg-[#FCEBEB] text-[#A32D2D]'
                          : 'bg-muted/50 text-muted-foreground',
                      )}
                    >
                      {row.stalled}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50">
                <TableCell className="font-medium">TOTAL</TableCell>
                <TableCell className="font-medium">{totalCount}</TableCell>
                <TableCell className="font-medium">{metrics.activePipeline}</TableCell>
                <TableCell />
                <TableCell />
                <TableCell className="font-medium">{metrics.weightedForecast}</TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
