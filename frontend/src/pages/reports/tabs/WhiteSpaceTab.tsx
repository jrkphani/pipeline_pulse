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

interface WhiteSpaceTabProps {
  data: ReportsData['whiteSpace'];
}

const WS_BADGE_CLASSES = {
  upsell: 'bg-[#EAE8FC] text-[#3C3489]',
  warning: 'bg-[#FAEEDA] text-[#854F0B]',
  danger: 'bg-[#FCEBEB] text-[#A32D2D]',
  success: 'bg-[#EAF3DE] text-[#3B6D11]',
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
  color?: 'green' | 'amber';
}) {
  const colorClass =
    color === 'green'
      ? 'text-[#0F6E56]'
      : color === 'amber'
        ? 'text-[#854F0B]'
        : 'text-foreground';

  return (
    <div className="rounded-md bg-muted/50 px-3 py-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={cn('mt-1 text-xl font-medium', colorClass)}>{value}</div>
      <div className="mt-0.5 text-[10px] text-muted-foreground/70">{sub}</div>
    </div>
  );
}

export function WhiteSpaceTab({ data }: WhiteSpaceTabProps) {
  const { metrics, solutionAreas, accounts } = data;

  const coverageConfig = useMemo<ChartConfig>(() => ({
    solutions: { label: 'Solutions Adopted', color: 'var(--pp-chart-1)' },
  }), []);

  const coverageChartData = useMemo(() =>
    accounts.map((a) => ({
      account: a.account,
      solutions: Object.values(a.solutions).filter(Boolean).length,
    })),
    [accounts],
  );

  return (
    <div className="space-y-3">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-2.5">
        <MetricTile label="Accounts Covered" value={String(metrics.accountsCovered)} sub={`of ${metrics.totalWonAccounts} won accounts`} />
        <MetricTile label="Upsell Flags" value={String(metrics.upsellFlags)} sub="AI-identified upsells" color="amber" />
        <MetricTile label="White Space ARR Est." value={metrics.whiteSpaceArr} sub="uncaptured potential" color="green" />
        <MetricTile label="Avg Solutions/Account" value={String(metrics.avgSolutionsPerAccount)} sub={`target: ${metrics.targetSolutions}+`} color="amber" />
      </div>

      {/* Solutions coverage chart */}
      <Card className="py-3">
        <CardHeader className="px-4 py-0">
          <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Solutions coverage depth by account
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-3">
          <ChartContainer config={coverageConfig} className="h-[180px]">
            <BarChart layout="vertical" data={coverageChartData}>
              <YAxis dataKey="account" type="category" tickLine={false} axisLine={false} fontSize={9} width={80} />
              <XAxis type="number" tickLine={false} axisLine={false} fontSize={9} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="solutions" fill="var(--color-solutions)" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Coverage matrix */}
      <Card className="py-3">
        <CardHeader className="px-4 py-0">
          <CardTitle className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Account coverage matrix — won accounts × solution area
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-3">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-36">Account</TableHead>
                  {solutionAreas.map((area) => (
                    <TableHead key={area} className="text-center">{area}</TableHead>
                  ))}
                  <TableHead>White Space</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((row) => (
                  <TableRow key={row.account}>
                    <TableCell className="font-medium">{row.account}</TableCell>
                    {solutionAreas.map((area) => (
                      <TableCell key={area} className="text-center">
                        {row.solutions[area] ? (
                          <span className="text-sm text-[#0F6E56]">✓</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    ))}
                    <TableCell>
                      <span
                        className={cn(
                          'inline-block rounded px-1.5 py-0.5 text-[10px] font-medium',
                          WS_BADGE_CLASSES[row.whiteSpace.variant],
                        )}
                      >
                        {row.whiteSpace.label}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Legend */}
          <div className="mt-2.5 flex gap-3.5 text-[10px] text-muted-foreground">
            <span><span className="text-[#0F6E56]">✓</span> Closed won deal exists</span>
            <span><span className={cn('rounded px-1 py-0.5 text-[9px]', WS_BADGE_CLASSES.success)}>Well covered</span> 3+ solutions</span>
            <span><span className={cn('rounded px-1 py-0.5 text-[9px]', WS_BADGE_CLASSES.upsell)}>Upsell</span> AI-flagged opportunity</span>
            <span><span className={cn('rounded px-1 py-0.5 text-[9px]', WS_BADGE_CLASSES.danger)}>High white space</span></span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
