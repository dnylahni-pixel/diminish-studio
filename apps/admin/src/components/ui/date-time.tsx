import * as React from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { CalendarDays, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";
import { transitionFast } from "./shared";
import type { FieldSize, FieldState } from "./inputs";

const fieldSizeMap: Record<FieldSize, string> = {
  sm: "h-[var(--size-control-sm)] text-sm px-3 rounded-[var(--radius-sm)]",
  md: "h-[var(--size-control-md)] text-sm px-3.5 rounded-[var(--radius-md)]",
  lg: "h-[var(--size-control-lg)] text-base px-4 rounded-[var(--radius-md)]",
};

/* ---------------------------------------------------------------------
   Date input / Time input (native, styled)
   --------------------------------------------------------------------- */
export function DateInput({
  size = "md",
  state = "default",
  disabled,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & { size?: FieldSize; state?: FieldState }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-neutral-0 border border-neutral-200 shadow-[var(--shadow-xs)]",
        "focus-within:ring-[3px] focus-within:ring-primary-100 focus-within:border-primary-400",
        disabled && "opacity-[var(--opacity-disabled)] pointer-events-none bg-neutral-50",
        state === "error" && "border-danger-300",
        transitionFast,
        fieldSizeMap[size],
        className,
      )}
    >
      <CalendarDays className="size-[var(--size-icon-sm)] text-neutral-400 shrink-0" />
      <input type="date" disabled={disabled} className="flex-1 min-w-0 bg-transparent outline-none text-neutral-900" {...props} />
    </div>
  );
}

export function TimeInput({
  size = "md",
  state = "default",
  disabled,
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & { size?: FieldSize; state?: FieldState }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 bg-neutral-0 border border-neutral-200 shadow-[var(--shadow-xs)]",
        "focus-within:ring-[3px] focus-within:ring-primary-100 focus-within:border-primary-400",
        disabled && "opacity-[var(--opacity-disabled)] pointer-events-none bg-neutral-50",
        state === "error" && "border-danger-300",
        transitionFast,
        fieldSizeMap[size],
        className,
      )}
    >
      <Clock className="size-[var(--size-icon-sm)] text-neutral-400 shrink-0" />
      <input type="time" disabled={disabled} className="flex-1 min-w-0 bg-transparent outline-none text-neutral-900" {...props} />
    </div>
  );
}

/* ---------------------------------------------------------------------
   Calendar — shared day-grid primitive
   --------------------------------------------------------------------- */
const calendarClassNames = {
  months: "flex flex-col gap-4",
  month: "space-y-3",
  month_caption: "flex items-center justify-center h-9 font-semibold text-sm text-neutral-800 relative",
  nav: "flex items-center justify-between absolute inset-x-0 px-1",
  button_previous: "size-7 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
  button_next: "size-7 inline-flex items-center justify-center rounded-[var(--radius-sm)] text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
  weekdays: "flex",
  weekday: "size-9 flex items-center justify-center text-xs font-medium text-neutral-400",
  week: "flex w-full",
  day: "size-9 flex items-center justify-center p-0 text-sm",
  day_button:
    "size-9 rounded-[var(--radius-sm)] font-normal text-neutral-700 hover:bg-neutral-100 aria-selected:opacity-100 outline-none focus-visible:ring-[3px] focus-visible:ring-primary-200",
  today: "font-semibold text-primary-600",
  selected: "[&>button]:bg-primary-600 [&>button]:text-neutral-0 [&>button]:hover:bg-primary-700",
  outside: "text-neutral-300",
  disabled: "text-neutral-300 line-through pointer-events-none",
  range_start: "[&>button]:bg-primary-600 [&>button]:text-neutral-0 [&>button]:rounded-l-[var(--radius-sm)]",
  range_end: "[&>button]:bg-primary-600 [&>button]:text-neutral-0 [&>button]:rounded-r-[var(--radius-sm)]",
  range_middle: "bg-primary-50 [&>button]:bg-transparent [&>button]:text-primary-700 [&>button]:rounded-none",
  hidden: "invisible",
};

export function Calendar(props: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays
      classNames={calendarClassNames}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />,
      }}
      className="p-3 rounded-[var(--radius-lg)] border border-neutral-200 bg-neutral-0 shadow-[var(--shadow-sm)]"
      {...props}
    />
  );
}

/* ---------------------------------------------------------------------
   Date Picker (single)
   --------------------------------------------------------------------- */
export function DatePicker({
  value,
  onChange,
  placeholder = "Select a date",
  size = "md",
  disabled,
}: {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  size?: FieldSize;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full items-center gap-2 bg-neutral-0 border border-neutral-200 shadow-[var(--shadow-xs)] text-left outline-none",
            "focus:ring-[3px] focus:ring-primary-100 disabled:opacity-[var(--opacity-disabled)]",
            transitionFast,
            fieldSizeMap[size],
          )}
        >
          <CalendarDays className="size-[var(--size-icon-sm)] text-neutral-400 shrink-0" />
          <span className={cn("truncate", !value && "text-neutral-400")}>
            {value ? value.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : placeholder}
          </span>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content align="start" sideOffset={8} className="z-[var(--z-dropdown)] animate-[var(--animate-scale-in)]">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(d) => {
              onChange?.(d);
              setOpen(false);
            }}
          />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/* ---------------------------------------------------------------------
   Date Range Picker
   --------------------------------------------------------------------- */
export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select a date range",
  size = "md",
  disabled,
}: {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  size?: FieldSize;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const label =
    value?.from && value?.to
      ? `${value.from.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${value.to.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
      : value?.from
        ? value.from.toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : undefined;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full items-center gap-2 bg-neutral-0 border border-neutral-200 shadow-[var(--shadow-xs)] text-left outline-none",
            "focus:ring-[3px] focus:ring-primary-100 disabled:opacity-[var(--opacity-disabled)]",
            transitionFast,
            fieldSizeMap[size],
          )}
        >
          <CalendarDays className="size-[var(--size-icon-sm)] text-neutral-400 shrink-0" />
          <span className={cn("truncate", !label && "text-neutral-400")}>{label ?? placeholder}</span>
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content align="start" sideOffset={8} className="z-[var(--z-dropdown)] animate-[var(--animate-scale-in)]">
          <Calendar mode="range" selected={value} onSelect={onChange} numberOfMonths={2} />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
