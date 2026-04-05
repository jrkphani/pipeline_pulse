import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { format, isValid } from "date-fns"

import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

function formatDate(date: Date | undefined): string {
  if (!date) return ""
  return format(date, "dd MMMM, yyyy")
}

function isValidDate(date: Date | undefined): boolean {
  if (!date) return false
  return isValid(date) && date.getFullYear() > 1970
}

// ---------------------------------------------------------------------------
// DatePickerInput — form-field date picker with text input + calendar popover
// ---------------------------------------------------------------------------

interface DatePickerInputProps {
  id?: string
  label?: string
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}

export function DatePickerInput({
  id = "date-picker-input",
  label,
  value,
  onChange,
  placeholder = "dd MMMM, yyyy",
  className,
}: DatePickerInputProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(value)
  const [month, setMonth] = React.useState<Date | undefined>(date)
  const [textValue, setTextValue] = React.useState(formatDate(date))

  // Sync external value changes
  React.useEffect(() => {
    if (value && isValidDate(value)) {
      setDate(value)
      setMonth(value)
      setTextValue(formatDate(value))
    }
  }, [value])

  const handleTextChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      setTextValue(raw)
      const parsed = new Date(raw)
      if (isValidDate(parsed)) {
        setDate(parsed)
        setMonth(parsed)
        onChange?.(parsed)
      }
    },
    [onChange],
  )

  const handleCalendarSelect = React.useCallback(
    (selected: Date | undefined) => {
      setDate(selected)
      setTextValue(formatDate(selected))
      setMonth(selected)
      setOpen(false)
      onChange?.(selected)
    },
    [onChange],
  )

  return (
    <Field className={className}>
      {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
      <InputGroup>
        <InputGroupInput
          id={id}
          value={textValue}
          placeholder={placeholder}
          onChange={handleTextChange}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <InputGroupAddon align="inline-end">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <InputGroupButton
                variant="ghost"
                size="icon-xs"
                aria-label="Select date"
              >
                <CalendarIcon />
                <span className="sr-only">Select date</span>
              </InputGroupButton>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="end"
              sideOffset={8}
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
        </InputGroupAddon>
      </InputGroup>
    </Field>
  )
}
