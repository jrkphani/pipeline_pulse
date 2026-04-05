import { Lock } from 'lucide-react';

export function ReadOnlyBanner() {
  return (
    <div className="flex h-8 items-center gap-2 border-b bg-amber-50 px-3 text-xs text-amber-800">
      <Lock className="size-3 shrink-0" />
      <span>
        Read-only · Finance view · Contact your AE to update deal data
      </span>
    </div>
  );
}
