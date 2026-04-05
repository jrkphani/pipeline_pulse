import { cn } from '@/lib/utils';
import type { RaciMember } from '@/types/deal-detail';

interface RaciRowProps {
  members: RaciMember[];
  actions: string[];
}

const ROLE_COLOR: Record<string, string> = {
  AE: 'text-blue-700 dark:text-blue-400',
  PC: 'text-violet-700 dark:text-violet-400',
  SA: 'text-emerald-700 dark:text-emerald-400',
  PM: 'text-amber-700 dark:text-amber-400',
  AM: 'text-rose-700 dark:text-rose-400',
};

export function RaciRow({ members, actions }: RaciRowProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap px-3 py-1.5 text-[10px] border-b">
      {members.map((m, i) => (
        <div key={m.role} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-border">&middot;</span>}
          <span className={cn('text-muted-foreground', ROLE_COLOR[m.role])}>{m.role}:</span>
          <span className="font-medium">{m.name}</span>
        </div>
      ))}

      {actions.length > 0 && (
        <>
          <span className="text-border">&middot;</span>
          <span className="text-muted-foreground">{actions.join(' \u00b7 ')}</span>
        </>
      )}

      <div className="ml-auto flex gap-1.5">
        <button
          type="button"
          className="px-2 py-0.5 border rounded text-[9.5px] bg-background text-muted-foreground hover:text-foreground transition-colors"
        >
          Log meeting
        </button>
        <button
          type="button"
          className="px-2 py-0.5 border rounded text-[9.5px] bg-background text-muted-foreground hover:text-foreground transition-colors"
        >
          Upload doc
        </button>
      </div>
    </div>
  );
}
