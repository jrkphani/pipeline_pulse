import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQTreeRegistry } from '@/hooks/useAdmin';
import type { QTreeQuestionnaire } from '@/types/admin';
import { AlertTriangle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

function SignoffBadge({ signoff }: { signoff: string }) {
  if (signoff === 'both_approved') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 text-[8px] font-medium text-green-700">
        <Check className="size-2.5" /> Both approved
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[8px] font-medium text-amber-700">
      <AlertTriangle className="size-2.5" /> Presales pending
    </span>
  );
}

export function RegistryTab() {
  const { data: questionnaires, isLoading } = useQTreeRegistry();

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div>
      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Questionnaire</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead className="text-center">Sections</TableHead>
              <TableHead className="text-center">Qs</TableHead>
              <TableHead>Ver</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sign-off</TableHead>
              <TableHead>Uploaded</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questionnaires?.map((q: QTreeQuestionnaire) => (
              <TableRow key={q.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-medium">{q.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[9px]">{q.roles}</Badge>
                </TableCell>
                <TableCell>{q.domain}</TableCell>
                <TableCell className="text-center">{q.sections}</TableCell>
                <TableCell className="text-center">{q.questions}</TableCell>
                <TableCell className="text-[9px] text-muted-foreground">{q.version}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-[9px]',
                      q.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700',
                    )}
                  >
                    {q.status === 'active' ? 'Active' : 'Draft'}
                  </Badge>
                </TableCell>
                <TableCell><SignoffBadge signoff={q.signoff} /></TableCell>
                <TableCell className="text-[9px] text-muted-foreground">{q.uploaded}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      <p className="mt-2 text-[9px] text-muted-foreground">
        Author questionnaires externally using the markdown spec, then upload here.
        Draft → Active requires Presales Practice Lead + SDR Team Lead sign-off.
      </p>
    </div>
  );
}
