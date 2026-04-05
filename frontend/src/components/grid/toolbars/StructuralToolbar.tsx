import { Rows3, Rows4, StretchHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GROUP_IDS } from '@/lib/ag-grid/column-defs';
import type { ColumnGroupId } from '@/lib/ag-grid/column-defs';

// ---------------------------------------------------------------------------
// Row Density
// ---------------------------------------------------------------------------

export type RowDensity = 'compact' | 'comfortable' | 'spacious';

export const DENSITY_CONFIG: Record<RowDensity, { rowHeight: number; label: string; icon: typeof Rows3 }> = {
  compact:     { rowHeight: 28, label: 'Compact',     icon: Rows3 },
  comfortable: { rowHeight: 40, label: 'Comfortable', icon: Rows4 },
  spacious:    { rowHeight: 52, label: 'Spacious',    icon: StretchHorizontal },
};

const DENSITY_ORDER: RowDensity[] = ['compact', 'comfortable', 'spacious'];

// ---------------------------------------------------------------------------
// Group Pills config
// ---------------------------------------------------------------------------

export interface GroupPillConfig {
  id: ColumnGroupId;
  label: string;
  defaultVisible: boolean;
}

export const GROUP_PILLS: GroupPillConfig[] = [
  { id: GROUP_IDS.IDENTITY,       label: 'Identity',      defaultVisible: true },
  { id: GROUP_IDS.REVENUE,        label: 'Revenue',       defaultVisible: true },
  { id: GROUP_IDS.VELOCITY,       label: 'Velocity',      defaultVisible: true },
  { id: GROUP_IDS.SALES_STAGE,    label: 'Sales',         defaultVisible: true },
  { id: GROUP_IDS.PRESALES_STAGE, label: 'Presales',      defaultVisible: false },
  { id: GROUP_IDS.DEPENDENCIES,   label: 'Alliance/Deps', defaultVisible: false },
];

export function buildInitialGroupVisibility(): Record<ColumnGroupId, boolean> {
  const map = {} as Record<ColumnGroupId, boolean>;
  for (const pill of GROUP_PILLS) {
    map[pill.id] = pill.defaultVisible;
  }
  return map;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Group pill color mapping
// ---------------------------------------------------------------------------

const PILL_COLORS: Record<string, { activeBg: string; activeText: string; activeBorder: string }> = {
  Identity:       { activeBg: 'bg-[#E6F1FB]', activeText: 'text-[#0C447C]', activeBorder: 'border-[#85B7EB]' },
  Revenue:        { activeBg: 'bg-[#E1F5EE]', activeText: 'text-[#085041]', activeBorder: 'border-[#5DCAA5]' },
  Velocity:       { activeBg: 'bg-[#FAEEDA]', activeText: 'text-[#633806]', activeBorder: 'border-[#EF9F27]' },
  Sales:          { activeBg: 'bg-[#EEEDFE]', activeText: 'text-[#3C3489]', activeBorder: 'border-[#AFA9EC]' },
  Presales:       { activeBg: 'bg-[#FAECE7]', activeText: 'text-[#712B13]', activeBorder: 'border-[#F0997B]' },
  'Alliance/Deps': { activeBg: 'bg-[#EAF3DE]', activeText: 'text-[#27500A]', activeBorder: 'border-[#97C459]' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface StructuralToolbarProps {
  groupVisibility: Record<ColumnGroupId, boolean>;
  onToggleGroup: (groupId: ColumnGroupId) => void;
  density: RowDensity;
  onSetDensity: (d: RowDensity) => void;
}

export function StructuralToolbar({ groupVisibility, onToggleGroup, density, onSetDensity }: StructuralToolbarProps) {
  return (
    <div className="flex h-9 items-center gap-2 border-b bg-muted/20 px-3">
      <span className="text-xs font-medium text-muted-foreground">Columns:</span>

      {GROUP_PILLS.map((pill) => {
        const isActive = groupVisibility[pill.id];
        const colors = PILL_COLORS[pill.label];
        return (
          <button
            key={pill.id}
            onClick={() => onToggleGroup(pill.id)}
            className={cn(
              'inline-flex h-6 items-center rounded-md border px-2 text-xs font-medium transition-colors',
              isActive && colors
                ? `${colors.activeBg} ${colors.activeText} ${colors.activeBorder}`
                : 'border-border bg-background text-muted-foreground hover:bg-muted/50',
            )}
          >
            {pill.label}
            <span className="ml-0.5 text-[10px] opacity-60">{isActive ? ' ◂' : ' ▸'}</span>
          </button>
        );
      })}

      <div className="flex-1" />

      {/* 3-segment density toggle */}
      <div className="flex items-center rounded-md border bg-muted/30 p-0.5">
        {DENSITY_ORDER.map((d) => {
          const Icon = DENSITY_CONFIG[d].icon;
          const isActive = density === d;
          return (
            <button
              key={d}
              onClick={() => onSetDensity(d)}
              title={DENSITY_CONFIG[d].label}
              className={cn(
                'inline-flex h-5 items-center gap-1 rounded px-1.5 text-xs transition-colors',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-3" />
              {DENSITY_CONFIG[d].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
