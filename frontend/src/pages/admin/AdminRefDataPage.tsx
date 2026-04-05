import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useRefData } from '@/hooks/useAdmin';
import type { StageSLA, Threshold, GTMMotion, FundingType } from '@/types/admin';

export function AdminRefDataPage() {
  const { data, isLoading } = useRefData();

  if (isLoading) {
    return (
      <div>
        <PageHeader />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const stageSLAs = data?.stage_slas ?? [];
  const thresholds = data?.thresholds ?? [];
  const gtmMotions = data?.gtm_motions ?? [];
  const fundingTypes = data?.funding_types ?? [];

  return (
    <div>
      <PageHeader />

      <div className="grid grid-cols-2 gap-3">
        {/* Card 1: Stage SLA & Forecast Probability */}
        <Card className="p-4">
          <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Stage SLA &amp; Forecast Probability
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stage</TableHead>
                <TableHead>SLA (d)</TableHead>
                <TableHead>Prob %</TableHead>
                <TableHead>Last Changed</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {stageSLAs.map((sla: StageSLA) => (
                <TableRow key={sla.stage}>
                  <TableCell className="font-medium">{sla.stage}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      defaultValue={sla.sla_days}
                      className="h-7 w-16 text-xs"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      defaultValue={sla.probability_pct}
                      className="h-7 w-16 text-xs"
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {sla.last_changed}
                  </TableCell>
                  <TableCell>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Card 2: Thresholds */}
        <Card className="p-4">
          <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Thresholds
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Setting</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Last Changed</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {thresholds.map((t: Threshold) => (
                <TableRow key={t.setting}>
                  <TableCell className="font-medium">{t.setting}</TableCell>
                  <TableCell>
                    <Input
                      defaultValue={t.value}
                      className="h-7 w-20 text-xs"
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {t.last_changed}
                  </TableCell>
                  <TableCell>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Card 3: GTM Motions */}
        <Card className="p-4">
          <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
            GTM Motions
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {gtmMotions.map((m: GTMMotion) => (
                <TableRow key={m.label}>
                  <TableCell className="font-medium">{m.label}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        m.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }
                    >
                      {m.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {/* Card 4: Funding Types */}
        <Card className="p-4">
          <div className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
            Funding Types
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Category</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fundingTypes.map((f: FundingType) => (
                <TableRow key={f.label}>
                  <TableCell className="font-medium">{f.label}</TableCell>
                  <TableCell className="text-xs">{f.category}</TableCell>
                  <TableCell>
                    <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

function PageHeader() {
  return (
    <div className="mb-3 flex items-start justify-between">
      <div>
        <h1 className="text-sm font-medium">Reference Data</h1>
        <p className="text-xs text-muted-foreground">/admin/reference-data</p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
          Sales Ops ✓
        </Badge>
        <Button size="sm">+ Add Row</Button>
      </div>
    </div>
  );
}
