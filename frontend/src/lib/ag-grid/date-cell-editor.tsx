import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { ICellEditorParams } from '@ag-grid-community/core';
import { format, parseISO, isValid } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Deal } from '@/types/index';

// ---------------------------------------------------------------------------
// DateCellEditor — AG Grid Community custom cell editor
// ---------------------------------------------------------------------------
// Renders a compact text input + calendar popover inside the grid cell.
// Accepts ISO strings (yyyy-MM-dd) and returns ISO strings to AG Grid.
// ---------------------------------------------------------------------------

function parseValue(value: unknown): Date | undefined {
  if (!value) return undefined;
  const d = typeof value === 'string' ? parseISO(value) : undefined;
  return d && isValid(d) ? d : undefined;
}

function formatDisplay(date: Date | undefined): string {
  if (!date) return '';
  return format(date, 'dd MMM yyyy');
}

function toISO(date: Date | undefined): string | null {
  if (!date) return null;
  return format(date, 'yyyy-MM-dd');
}

interface DateCellEditorProps extends ICellEditorParams<Deal> {}

export const DateCellEditor = forwardRef<unknown, DateCellEditorProps>(
  (props, ref) => {
    const [date, setDate] = useState<Date | undefined>(() =>
      parseValue(props.value),
    );
    const [month, setMonth] = useState<Date | undefined>(date);
    const [textValue, setTextValue] = useState(() => formatDisplay(date));
    const [open, setOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus the text input on mount
    useEffect(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, []);

    // Expose getValue to AG Grid
    useImperativeHandle(ref, () => ({
      getValue: () => toISO(date),
      isCancelAfterEnd: () => false,
    }));

    const handleTextChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setTextValue(raw);
        // Try parsing what the user typed
        const parsed = new Date(raw);
        if (isValid(parsed) && parsed.getFullYear() > 1970) {
          setDate(parsed);
          setMonth(parsed);
        }
      },
      [],
    );

    const handleCalendarSelect = useCallback((selected: Date | undefined) => {
      setDate(selected);
      setTextValue(formatDisplay(selected));
      setMonth(selected);
      setOpen(false);
      // Refocus the input after calendar pick
      setTimeout(() => inputRef.current?.focus(), 0);
    }, []);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown' && !open) {
          e.preventDefault();
          setOpen(true);
        }
        // Let AG Grid handle Enter/Tab/Escape via its own key listeners
      },
      [open],
    );

    return (
      <div className="flex h-full w-full items-center gap-0.5 px-1">
        <Input
          ref={inputRef}
          value={textValue}
          placeholder="dd MMM yyyy"
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          className={cn(
            'h-7 flex-1 border-0 bg-transparent px-1 text-sm shadow-none',
            'focus-visible:ring-0 focus-visible:border-0',
          )}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="shrink-0"
              aria-label="Select date"
              tabIndex={-1}
            >
              <CalendarIcon className="size-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            sideOffset={8}
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Calendar
              mode="single"
              selected={date}
              month={month}
              onMonthChange={setMonth}
              onSelect={handleCalendarSelect}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  },
);

DateCellEditor.displayName = 'DateCellEditor';
