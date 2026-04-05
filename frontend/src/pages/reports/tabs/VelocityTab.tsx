import { useMemo } from 'react';
import { Bar, BarChart, XAxis, YAxis, Cell } from 'recharts';
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
  type ChartConfig,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import type { ReportsData } from '@/mocks/mock-reports';

interface VelocityTabProps {
  data: ReportsData['velocity'];
}

// ---------------------------------------------------------------------------
// Status badge — maps ok/warn/stall to wireframe colors
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: 'ok' | 'warn' | 'stall' }) {
  const map = {
    ok: { label: '✓ OK', className: 'bg-[#EAF3DE] text-[#3B6D11]' },
    warn: { label: '⚡ Approaching', className: 'bg-[#FAEEDA] text-[#854F0B]' },
    stall: { label: '⚠ Over SLA', className: 'bg-[#FCEBEB] text-[#A32D2D]' },
  } as const;
  const { label, className } = map[status];
  return (
    <span className={cn('inline-block rounded px-2 py-0.5 text-[10px] font-medium', className)}>
      {label}
    </span>
  );
}

function FlagBadge({ flag }: { flag: 'RED' | 'AMBER' }) {
  return (
    <span
      className={cn(
        'inline-block rounded px-2 py-0.5 text-[10px] font-medium',
        flag === 'RED' ? 'bg-[#FCEBEB] text-[#A32D2D]' : 'bg-[#FAEEDA] text-[#854F0B]',
      )}
    >
      {flag}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function VelocityTab({ data }: VelocityTabProps) {
  const { metrics, stageFunnel, stallRegister } = data;

  const bottleneckConfig = useMemo<ChartConfig>(() => ({
    avgDwell: { label: 'Avg Dwell (days)', color: 'var(--pp-chart-1)' },
    sla: { label: 'SLA Target (days)', color: 'var(--pp-color-neutral-600)' },
  }), []);

  const bottleneckData = useMemo(() =>
    stageFunnel.map((r) => ({
      stage: r.stage,
      avgDwell: r.avgDwell,
      sla: r.sla,
      fillColor: r.vsSla < 0.8 ? '#1D9E75' : r.vsSla <= 1.0 ? '#EF9F27' : '#E24B4A',
    })),
    [stageFunnel],
  );

  return (
    <div className="space-y-3">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-2.5">
        <MetricTile label="Avg. Full Cycle" value={`${metrics.avgFullCycle}d`} sub={`vs 90d target`} />
        <MetricTile label="Deals Stalled" value={String(metrics.dealsStalled)} sub={`${metrics.stalledPct}% of active`} color="red" />
        <MetricTile label="Bottleneck Stage" value={metrics.bottleneckStage} sub={`${metrics.bottleneckSlaMultiple}× SLA avg`} color="amber" />
        <MetricTile label="On-Track Rate" value={`${metrics.onTrackRate}%`} sub={`${metrics.onTrackCount} of ${metrics.onTrackTotal} deals`} color="green" />
      </div>

      {/* Two-column: Funnel table + Bottleneck bars */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="py-3">
          <CardHeader className="px-4 py-0">
            <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Panel 1 — Conversion funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-3">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stage</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Entered</TableHead>
                  <TableHead>Advanced</TableHead>
                  <TableHead>Conv %</TableHead>
                  <TableHead>Avg Dwell</TableHead>
                  <TableHead>vs SLA</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stageFunnel.map((row) => (
                  <TableRow key={row.stage}>
                    <TableCell className="font-medium">
                      <span
                        className="mr-1.5 inline-block size-[7px] rounded-full"
                        style={{ backgroundColor: row.color }}
                      />
                      {row.stage}
                    </TableCell>
                    <TableCell>{row.sla}d</TableCell>
                    <TableCell>{row.active}</TableCell>
                    <TableCell>{row.entered}</TableCell>
                    <TableCell>{row.advanced}</TableCell>
                    <TableCell>{row.convPct}%</TableCell>
                    <TableCell>{row.avgDwell}d</TableCell>
                    <TableCell>{row.vsSla.toFixed(2)}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="py-3">
          <CardHeader className="px-4 py-0">
            <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Panel 4 — Bottleneck signal (avg dwell vs stage SLA)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-3">
            <ChartContainer config={bottleneckConfig} className="h-[200px]">
              <BarChart layout="vertical" data={bottleneckData}>
                <YAxis dataKey="stage" type="category" tickLine={false} axisLine={false} fontSize={9} width={80} />
                <XAxis type="number" tickLine={false} axisLine={false} fontSize={9} unit="d" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sla" fill="var(--color-sla)" opacity={0.2} radius={[0, 3, 3, 0]} barSize={14} />
                <Bar dataKey="avgDwell" radius={[0, 3, 3, 0]} barSize={14}>
                  {bottleneckData.map((entry) => (
                    <Cell key={entry.stage} fill={entry.fillColor} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
            <div className="mt-3.5 flex gap-3.5 border-t pt-2.5 text-[10px] text-muted-foreground">
              <span>
                <span className="mr-1 inline-block size-2 rounded-sm bg-[#1D9E75]" />
                &lt;0.8× OK
              </span>
              <span>
                <span className="mr-1 inline-block size-2 rounded-sm bg-[#EF9F27]" />
                0.8–1.0× Approaching
              </span>
              <span>
                <span className="mr-1 inline-block size-2 rounded-sm bg-[#E24B4A]" />
                &gt;1.0× Over SLA
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stall register */}
      <Card className="py-3">
        <CardHeader className="px-4 py-0">
          <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Panel 3 — Stall register (stall ratio ≥ 0.8)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal ID</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Days at Stage</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Stall Ratio</TableHead>
                <TableHead>Flag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stallRegister.map((row) => (
                <TableRow key={row.dealId}>
                  <TableCell className="font-medium">{row.dealId}</TableCell>
                  <TableCell>{row.account}</TableCell>
                  <TableCell>{row.seller}</TableCell>
                  <TableCell>{row.stage}</TableCell>
                  <TableCell>{row.daysAtStage}d</TableCell>
                  <TableCell>{row.sla}d</TableCell>
                  <TableCell>{row.stallRatio.toFixed(2)}</TableCell>
                  <TableCell>
                    <FlagBadge flag={row.flag} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared metric tile (matches wireframe .metric box)
// ---------------------------------------------------------------------------

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
