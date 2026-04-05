import { format, parseISO } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { LeadActivity } from '@/types/leads';

// ---------------------------------------------------------------------------
// Channel badge colors
// ---------------------------------------------------------------------------

const CHANNEL_COLORS: Record<LeadActivity['channel'], { bg: string; text: string }> = {
  Call: { bg: '#E6F1FB', text: '#0C447C' },
  WhatsApp: { bg: '#E1F5EE', text: '#085041' },
  Email: { bg: '#FAEEDA', text: '#633806' },
  LinkedIn: { bg: '#EEEDFE', text: '#3C3489' },
  Meeting: { bg: '#E0F2F1', text: '#004D40' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ActivityLogProps {
  activities: LeadActivity[];
}

export function ActivityLog({ activities }: ActivityLogProps) {
  if (activities.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        No activity recorded yet
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="border-b bg-muted/30 hover:bg-muted/30">
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Date</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Att #</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Channel</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Outcome</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Notes</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Next Action</TableHead>
            <TableHead className="h-8 px-3 py-2 text-left font-medium text-muted-foreground">Next Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((a) => {
            const channelColor = CHANNEL_COLORS[a.channel];
            return (
              <TableRow key={a.activity_id} className="border-b hover:bg-muted/20">
                <TableCell className="px-3 py-2 font-mono text-xs">
                  {formatDate(a.date)}
                </TableCell>
                <TableCell className="px-3 py-2 font-mono text-center">{a.attempt_number}</TableCell>
                <TableCell className="px-3 py-2">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: channelColor.bg, color: channelColor.text }}
                  >
                    {a.channel}
                  </span>
                </TableCell>
                <TableCell className="px-3 py-2 max-w-[200px] truncate">{a.outcome}</TableCell>
                <TableCell className="px-3 py-2 max-w-[150px] truncate text-muted-foreground">
                  {a.notes ?? '—'}
                </TableCell>
                <TableCell className="px-3 py-2 max-w-[150px] truncate">{a.next_action ?? '—'}</TableCell>
                <TableCell className="px-3 py-2 font-mono text-xs">
                  {a.next_action_date ? formatDate(a.next_action_date) : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return format(parseISO(iso), 'dd MMM');
  } catch {
    return iso;
  }
}
