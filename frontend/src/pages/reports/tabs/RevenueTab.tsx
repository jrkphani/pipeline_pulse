import { useMemo } from 'react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';
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

interface RevenueTabProps {
  data: ReportsData['revenue'];
}

const RAG_CLASSES = {
  meet: 'bg-[#EAF3DE] text-[#3B6D11]',
  above: 'bg-[#EAE8FC] text-[#3C3489]',
  below: 'bg-[#FCEBEB] text-[#A32D2D]',
  empty: 'bg-muted/50 text-muted-foreground',
} as const;

const RAG_ICONS = {
  meet: '✓',
  above: '⚡',
  below: '✗',
} as const;

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

export function RevenueTab({ data }: RevenueTabProps) {
  const { metrics, sellers, months } = data;

  // Group sellers by country
  const sgSellers = sellers.filter((s) => s.country === 'SG');
  const phSellers = sellers.filter((s) => s.country === 'PH');

  // Totals
  const totalAnnual = sellers.reduce((sum, s) => sum + s.annual, 0);
  const totalBooked = sellers.reduce((sum, s) => sum + s.booked, 0);
  const totalGap = sellers.reduce((sum, s) => sum + s.gap, 0);
  const totalMonthly = months.map((_, mi) =>
    sellers.reduce((sum, s) => sum + (s.monthly[mi] ?? 0), 0),
  );

  const monthlyConfig = useMemo<ChartConfig>(() => ({
    total: { label: 'Booked Revenue (S$K)', color: 'var(--pp-chart-1)' },
  }), []);

  const monthlyChartData = useMemo(() =>
    months.map((m, i) => ({ month: m, total: totalMonthly[i] })),
    [months, totalMonthly],
  );

  return (
    <div className="space-y-3">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-2.5">
        <MetricTile label="Annual Target (SG)" value={metrics.annualTarget} sub="FY26-27" />
        <MetricTile label="Booked YTD" value={metrics.bookedYtd} sub={`${metrics.bookedPct}% of target`} color="green" />
        <MetricTile label="Pipeline Coverage" value={`${metrics.pipelineCoverage}×`} sub="vs 4× minimum" color="amber" />
        <MetricTile label="Gap to Target" value={metrics.gapToTarget} sub={`${metrics.monthsRemaining} months remaining`} color="red" />
      </div>

      {/* Monthly revenue trend chart */}
      <Card className="py-3">
        <CardHeader className="px-4 py-0">
          <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Monthly revenue booked (S$K) — FY26-27
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-3">
          <ChartContainer config={monthlyConfig} className="h-[160px]">
            <BarChart data={monthlyChartData}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={9} />
              <YAxis tickLine={false} axisLine={false} fontSize={9} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="total" fill="var(--color-total)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Revenue matrix */}
      <Card className="py-3">
        <CardHeader className="px-4 py-0">
          <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Revenue vs target by seller — FY26-27 (S$000)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-3">
          <div className="overflow-x-auto">
            <Table className="text-[10.5px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">Seller</TableHead>
                  <TableHead>CTY</TableHead>
                  <TableHead colSpan={3} className="text-center border-b">Q1 · AMJ</TableHead>
                  <TableHead colSpan={3} className="text-center border-b">Q2 · JAS</TableHead>
                  <TableHead colSpan={3} className="text-center border-b">Q3 · OND</TableHead>
                  <TableHead colSpan={3} className="text-center border-b">Q4 · JFM</TableHead>
                  <TableHead>Annual</TableHead>
                  <TableHead>Booked</TableHead>
                  <TableHead>Gap</TableHead>
                  <TableHead>RAG</TableHead>
                </TableRow>
                <TableRow className="bg-muted/50 text-[9px] text-muted-foreground">
                  <TableHead />
                  <TableHead />
                  {months.map((m) => (
                    <TableHead key={m} className="text-center font-normal">{m}</TableHead>
                  ))}
                  <TableHead />
                  <TableHead />
                  <TableHead />
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* SG section */}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={18} className="py-1 text-[10px] text-muted-foreground">
                    Singapore
                  </TableCell>
                </TableRow>
                {sgSellers.map((s) => (
                  <SellerRow key={s.name} seller={s} />
                ))}

                {/* PH section */}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={18} className="py-1 text-[10px] text-muted-foreground">
                    Philippines
                  </TableCell>
                </TableRow>
                {phSellers.map((s) => (
                  <SellerRow key={s.name} seller={s} />
                ))}

                {/* Total row */}
                <TableRow className="bg-muted/50">
                  <TableCell className="font-medium">TOTAL</TableCell>
                  <TableCell />
                  {totalMonthly.map((val, i) => (
                    <TableCell key={i} className={cn('text-center', val > 0 ? 'font-medium' : '')}>
                      {val > 0 ? val : '—'}
                    </TableCell>
                  ))}
                  <TableCell className="font-medium">{totalAnnual.toLocaleString()}</TableCell>
                  <TableCell className="font-medium text-[#0F6E56]">{totalBooked.toLocaleString()}</TableCell>
                  <TableCell className="font-medium text-[#A32D2D]">{totalGap.toLocaleString()}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Legend */}
          <div className="mt-2.5 flex gap-3.5 text-[10px] text-muted-foreground">
            <span className={cn('rounded px-1.5 py-0.5', RAG_CLASSES.meet)}>✓ Meets target (≥100%)</span>
            <span className={cn('rounded px-1.5 py-0.5', RAG_CLASSES.above)}>⚡ Above floor (75–99%)</span>
            <span className={cn('rounded px-1.5 py-0.5', RAG_CLASSES.below)}>✗ Below floor (&lt;75%)</span>
            <span className={cn('rounded px-1.5 py-0.5', RAG_CLASSES.empty)}>— Not yet booked</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SellerRow({ seller }: { seller: ReportsData['revenue']['sellers'][number] }) {
  return (
    <TableRow>
      <TableCell>{seller.name}</TableCell>
      <TableCell>{seller.country}</TableCell>
      {seller.monthly.map((val, i) => (
        <TableCell
          key={i}
          className={cn(
            'text-center',
            val !== null ? RAG_CLASSES[seller.rag] : RAG_CLASSES.empty,
          )}
        >
          {val !== null ? val : '—'}
        </TableCell>
      ))}
      <TableCell>{seller.annual.toLocaleString()}</TableCell>
      <TableCell className={seller.booked > 0 ? 'text-[#0F6E56]' : 'text-[#A32D2D]'}>
        {seller.booked.toLocaleString()}
      </TableCell>
      <TableCell className="text-[#A32D2D]">{seller.gap.toLocaleString()}</TableCell>
      <TableCell>
        <span className={cn('inline-block rounded px-2 py-0.5 text-[10px] font-medium', RAG_CLASSES[seller.rag])}>
          {RAG_ICONS[seller.rag]}
        </span>
      </TableCell>
    </TableRow>
  );
}
