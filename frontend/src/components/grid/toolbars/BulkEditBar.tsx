import { ArrowUpRight, UserRound, FileSpreadsheet, Archive, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkEditBarProps {
  selectedCount: number;
  onClear: () => void;
  onExport: () => void;
}

export function BulkEditBar({ selectedCount, onClear, onExport }: BulkEditBarProps) {
  return (
    <div className="flex h-9 items-center gap-2 border-b bg-primary/5 px-3">
      <span className="text-xs font-semibold text-primary">
        {selectedCount} row{selectedCount !== 1 && 's'} selected
      </span>

      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" className="h-6 gap-1 text-xs">
          <ArrowUpRight className="size-3" />
          Advance stage
        </Button>
        <Button variant="outline" size="sm" className="h-6 gap-1 text-xs">
          <UserRound className="size-3" />
          Reassign seller
        </Button>
        <Button variant="outline" size="sm" className="h-6 gap-1 text-xs" onClick={onExport}>
          <FileSpreadsheet className="size-3" />
          Export to Excel
        </Button>
        <Button variant="outline" size="sm" className="h-6 gap-1 text-xs">
          <Archive className="size-3" />
          Archive
        </Button>
      </div>

      <div className="flex-1" />

      <button
        onClick={onClear}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <X className="size-3" />
        Clear selection
      </button>
    </div>
  );
}
