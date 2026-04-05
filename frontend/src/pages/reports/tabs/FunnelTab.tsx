import { useState, useMemo } from 'react';
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
import { FunnelDrilldownPanel } from '@/components/reports/FunnelDrilldownPanel';
import type { FunnelRecord } from '@/mocks/mock-reports';
import type { ReportsData } from '@/mocks/mock-reports';

interface FunnelTabProps {
  data: ReportsData['funnel'];
}

function StatusBadge({ status, children }: { status: 'ok' | 'warn' | 'stall'; children: React.ReactNode }) {
  const cls = {
    ok: 'bg-[#EAF3DE] text-[#3B6D11]',
    warn: 'bg-[#FAEEDA] text-[#854F0B]',
    stall: 'bg-[#FCEBEB] text-[#A32D2D]',
  } as const;

  return (
    <span className={cn('inline-block rounded px-2 py-0.5 text-[10px] font-medium', cls[status])}>
      {children}
    </span>
  );
}

function MetricTile({
  label,
  value,
  sub,
  color,
  onClick,
}: {
  label: string;
  value: string;
  sub: string;
  color?: 'green' | 'amber';
  onClick?: () => void;
}) {
  const colorClass =
    color === 'green'
      ? 'text-[#0F6E56]'
      : color === 'amber'
        ? 'text-[#854F0B]'
        : 'text-foreground';

  const content = (
    <>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn('mt-1 text-xl font-medium', colorClass)}>{value}</div>
      <div className="mt-0.5 text-[10px] text-muted-foreground/70">{sub}</div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left rounded-md bg-muted/50 px-3 py-2.5 hover:bg-muted/70 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="rounded-md bg-muted/50 px-3 py-2.5">
      {content}
    </div>
  );
}

export function FunnelTab({ data }: FunnelTabProps) {
  const { metrics, stages, gtmConversion, dropOff } = data;
  const [activeStage, setActiveStage] = useState<string | null>(null);

  const dropOffConfig = useMemo<ChartConfig>(() => ({
    dropPct: { label: 'Drop-off %', color: 'var(--pp-chart-1)' },
  }), []);

  const dropOffChartData = useMemo(() =>
    dropOff.map((r) => ({
      gate: r.gate,
      dropPct: r.dropPct,
      fillColor: r.status === 'ok' ? '#1D9E75' : r.status === 'warn' ? '#EF9F27' : '#E24B4A',
    })),
    [dropOff],
  );

  const toggleStage = (label: string) =>
    setActiveStage((prev) => (prev === label ? null : label));

  return (
    <div className="space-y-3">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-2.5">
        <MetricTile label="Leads Created" value={String(metrics.leadsCreated)} sub="FY26-27 to date" />
        <MetricTile label="ICP Qualified" value={String(metrics.icpQualified)} sub={`${metrics.icpRate}% ICP rate`} color="amber" onClick={() => toggleStage('ICP Qualified')} />
        <MetricTile label="Graduated to Deal" value={String(metrics.graduatedToOpportunity)} sub={`${metrics.graduationRate}% graduation rate`} onClick={() => toggleStage('Graduation Gate')} />
        <MetricTile label="Closed Won" value={String(metrics.closedWon)} sub={`${metrics.winRate}% win rate`} color="green" onClick={() => toggleStage('Closed Won')} />
      </div>

      {/* Two-column: Funnel bars + Conversion tables */}
      <div className="grid grid-cols-2 gap-3">
        {/* Funnel visualization */}
        <Card className="py-3">
          <CardHeader className="px-4 py-0">
            <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Lead-to-close funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-3 space-y-2">
            {stages.map((stage) => (
              <div key={stage.label} className="flex items-center gap-2.5">
                <div className="w-28 text-right text-[11px] text-muted-foreground">
                  {stage.label}
                </div>
                <button
                  type="button"
                  onClick={() => toggleStage(stage.label)}
                  className="flex-1 h-7 rounded overflow-hidden relative cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
                  style={{ '--tw-ring-color': stage.color } as React.CSSProperties}
                  title={`Drill into ${stage.label}`}
                >
                  <div
                    className="h-full rounded flex items-center pl-2 text-[11px] font-medium text-white transition-all"
                    style={{
                      width: `${stage.pct}%`,
                      backgroundColor: stage.color,
                      outline: activeStage === stage.label ? `2px solid ${stage.color}` : undefined,
                      outlineOffset: '1px',
                    }}
                  >
                    {stage.count} {stage.unit}
                  </div>
                </button>
                <div className="w-10 text-right text-[10px] text-muted-foreground">
                  {stage.pct}%
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Conversion + Drop-off */}
        <Card className="py-3">
          <CardHeader className="px-4 py-0">
            <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Conversion rates by GTM motion
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-3 space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>GTM Motion</TableHead>
                  <TableHead>Leads In</TableHead>
                  <TableHead>Deals Created</TableHead>
                  <TableHead>Won</TableHead>
                  <TableHead>Lead→Won</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gtmConversion.map((row) => (
                  <TableRow key={row.motion}>
                    <TableCell className="font-medium">{row.motion}</TableCell>
                    <TableCell>{row.leadsIn}</TableCell>
                    <TableCell>{row.dealsCreated}</TableCell>
                    <TableCell>{row.won}</TableCell>
                    <TableCell>
                      <StatusBadge status={row.status}>{row.leadToWon}%</StatusBadge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div>
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Drop-off analysis
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stage Gate</TableHead>
                    <TableHead>In</TableHead>
                    <TableHead>Out</TableHead>
                    <TableHead>Drop-off</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dropOff.map((row) => (
                    <TableRow key={row.gate}>
                      <TableCell className="font-medium">{row.gate}</TableCell>
                      <TableCell>{row.inCount}</TableCell>
                      <TableCell>{row.outCount}</TableCell>
                      <TableCell>
                        <StatusBadge status={row.status}>{row.dropPct}%</StatusBadge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Drop-off visualization */}
            <div className="mt-4 border-t pt-3">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Drop-off visualization
              </div>
              <ChartContainer config={dropOffConfig} className="h-[140px]">
                <BarChart layout="vertical" data={dropOffChartData}>
                  <YAxis dataKey="gate" type="category" tickLine={false} axisLine={false} fontSize={9} width={100} />
                  <XAxis type="number" tickLine={false} axisLine={false} fontSize={9} unit="%" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="dropPct" radius={[0, 3, 3, 0]} barSize={12}>
                    {dropOffChartData.map((entry) => (
                      <Cell key={entry.gate} fill={entry.fillColor} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drill-down panel */}
      {activeStage !== null && (() => {
        const stage = stages.find((s) => s.label === activeStage);
        const records: FunnelRecord[] = data.stageRecords?.[activeStage] ?? [];
        if (!stage) return null;
        return (
          <FunnelDrilldownPanel
            stageLabel={activeStage}
            stageColor={stage.color}
            unit={stage.unit}
            records={records}
            onClose={() => setActiveStage(null)}
          />
        );
      })()}
    </div>
  );
}
