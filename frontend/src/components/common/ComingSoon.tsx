/** Shared placeholder for pages not yet built. */
import type { LucideIcon } from 'lucide-react';
import { Construction } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
  icon?: LucideIcon;
}

export function ComingSoon({ title, description, icon: Icon = Construction }: ComingSoonProps) {
  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed bg-muted/20">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">Coming in a future sprint</p>
        </div>
      </div>
    </div>
  );
}
