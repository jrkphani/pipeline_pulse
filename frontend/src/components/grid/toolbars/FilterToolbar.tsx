import { useMemo } from 'react';
import { ChevronDown, Plus, Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useRefData } from '@/hooks/useAdmin';
import type { Deal, FilterState } from '@/types/index';
import { EMPTY_FILTER_STATE } from '@/types/index';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FilterToolbarProps {
  totalCount: number;
  filteredCount: number;
  showNewDealButton: boolean;
  isFinance: boolean;
  onNewDeal?: () => void;
  onExport?: () => void;
  deals: Deal[];
  filterState: FilterState;
  onFilterChange: (state: FilterState) => void;
}

// ---------------------------------------------------------------------------
// Chip → filterState key mapping
// ---------------------------------------------------------------------------

const KEY_MAP = {
  Stage:        'stages',
  Seller:       'sellers',
  'GTM Motion': 'gtmMotions',
  Funding:      'fundingFlags',
} as const;

type ChipName = keyof typeof KEY_MAP;

const ALL_CHIPS: ChipName[] = ['Stage', 'Seller', 'GTM Motion', 'Funding'];
const FINANCE_CHIPS: ChipName[] = ['Stage', 'Funding'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toggleValue(arr: string[], value: string): string[] {
  return arr.includes(value)
    ? arr.filter((v) => v !== value)
    : [...arr, value];
}

// ---------------------------------------------------------------------------
// FilterToolbar
// ---------------------------------------------------------------------------

export function FilterToolbar({
  totalCount,
  filteredCount,
  showNewDealButton,
  isFinance,
  onNewDeal,
  onExport,
  deals,
  filterState,
  onFilterChange,
}: FilterToolbarProps) {
  const { data: refData } = useRefData();
  const chips = isFinance ? FINANCE_CHIPS : ALL_CHIPS;

  // Derive options per chip from reference data + deals
  const optionsMap = useMemo<Record<ChipName, string[]>>(() => {
    const stageOptions =
      refData?.stage_slas?.map((s) => s.stage) ?? [];
    const gtmOptions =
      refData?.gtm_motions
        ?.filter((m) => m.status === 'active')
        .map((m) => m.label) ?? [];
    const fundingOptions: string[] = ['AWS Funded', 'Customer Funded'];
    const sellerOptions = Array.from(
      new Set(deals.map((d) => d.seller).filter(Boolean)),
    ).sort();

    return {
      Stage: stageOptions,
      Seller: sellerOptions,
      'GTM Motion': gtmOptions,
      Funding: fundingOptions,
    };
  }, [refData, deals]);

  const hasActiveFilters =
    filterState.stages.length > 0 ||
    filterState.sellers.length > 0 ||
    filterState.gtmMotions.length > 0 ||
    filterState.fundingFlags.length > 0;

  function handleToggle(chip: ChipName, value: string) {
    const key = KEY_MAP[chip];
    onFilterChange({
      ...filterState,
      [key]: toggleValue(filterState[key], value),
    });
  }

  function handleClear() {
    onFilterChange(EMPTY_FILTER_STATE);
  }

  return (
    <div className="flex h-9 items-center gap-2 border-b px-3">
      <span className="text-xs font-medium text-muted-foreground">Filter:</span>

      {chips.map((chip) => {
        const key = KEY_MAP[chip];
        const activeCount = filterState[key].length;
        const isActive = activeCount > 0;
        const options = optionsMap[chip];

        return (
          <DropdownMenu key={chip}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'h-6 gap-1 rounded-md px-2 text-xs',
                  isActive && 'border-primary bg-primary/10 text-primary',
                )}
              >
                {chip}
                {isActive && ` \u00b7 ${activeCount}`}
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
              {options.map((option) => (
                <DropdownMenuCheckboxItem
                  key={option}
                  checked={filterState[key].includes(option)}
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={() => handleToggle(chip, option)}
                >
                  {option}
                </DropdownMenuCheckboxItem>
              ))}
              {options.length === 0 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No options available
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={handleClear}
        >
          <X className="size-3" />
          Clear
        </Button>
      )}

      <div className="flex-1" />

      <span className="text-xs text-muted-foreground">
        Showing {filteredCount} of {totalCount} deals
      </span>

      <Button
        variant="outline"
        size="sm"
        className="ml-2 h-6 gap-1 text-xs"
        onClick={onExport}
      >
        <Download className="size-3" />
        Export
      </Button>

      {showNewDealButton && (
        <Button size="sm" className="h-6 gap-1 text-xs" onClick={onNewDeal}>
          <Plus className="size-3" />
          New deal
        </Button>
      )}
    </div>
  );
}
