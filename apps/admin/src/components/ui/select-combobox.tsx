import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Command as CommandPrimitive } from "cmdk";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "../../utils/cn";
import { transitionFast } from "./shared";
import type { FieldSize, FieldState } from "./inputs";

const triggerSizes: Record<FieldSize, string> = {
  sm: "h-[var(--size-control-sm)] text-sm px-3 rounded-[var(--radius-sm)]",
  md: "h-[var(--size-control-md)] text-sm px-3.5 rounded-[var(--radius-md)]",
  lg: "h-[var(--size-control-lg)] text-base px-4 rounded-[var(--radius-md)]",
};

const stateBorder: Record<FieldState, string> = {
  default: "border-neutral-200 data-[state=open]:border-primary-400",
  error: "border-danger-300",
  success: "border-success-300",
  warning: "border-warning-300",
};

/* ---------------------------------------------------------------------
   Select
   --------------------------------------------------------------------- */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function Select({
  options,
  placeholder = "Select an option",
  size = "md",
  state = "default",
  disabled,
  value,
  onValueChange,
}: {
  options: SelectOption[];
  placeholder?: string;
  size?: FieldSize;
  state?: FieldState;
  disabled?: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectPrimitive.Trigger
        className={cn(
          "flex w-full items-center justify-between gap-2 bg-neutral-0 border shadow-[var(--shadow-xs)] text-neutral-900 outline-none",
          "data-[placeholder]:text-neutral-400 disabled:opacity-[var(--opacity-disabled)] disabled:pointer-events-none",
          "focus:ring-[3px] focus:ring-primary-100",
          transitionFast,
          triggerSizes[size],
          stateBorder[state],
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDown className="size-[var(--size-icon-sm)] text-neutral-400" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className="z-[var(--z-dropdown)] overflow-hidden rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-0 shadow-[var(--shadow-lg)] animate-[var(--animate-scale-in)]"
          position="popper"
          sideOffset={6}
        >
          <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1 text-neutral-400">
            <ChevronUp className="size-4" />
          </SelectPrimitive.ScrollUpButton>
          <SelectPrimitive.Viewport className="p-1.5 min-w-[var(--radix-select-trigger-width)]">
            {options.map((opt) => (
              <SelectPrimitive.Item
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className={cn(
                  "relative flex cursor-pointer select-none items-center rounded-[var(--radius-sm)] px-2.5 py-2 text-sm text-neutral-700 outline-none",
                  "data-[highlighted]:bg-primary-50 data-[highlighted]:text-primary-800",
                  "data-[state=checked]:font-medium data-[state=checked]:text-primary-700",
                  "data-[disabled]:opacity-[var(--opacity-disabled)] data-[disabled]:pointer-events-none",
                )}
              >
                <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2.5">
                  <Check className="size-4 text-primary-600" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
          <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1 text-neutral-400">
            <ChevronDown className="size-4" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

/* ---------------------------------------------------------------------
   Multi-select
   --------------------------------------------------------------------- */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select options",
  size = "md",
  disabled,
}: {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  size?: FieldSize;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  const toggle = (val: string) => {
    onChange(value.includes(val) ? value.filter((v) => v !== val) : [...value, val]);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full flex-wrap items-center gap-1.5 bg-neutral-0 border border-neutral-200 shadow-[var(--shadow-xs)] outline-none text-left",
            "focus:ring-[3px] focus:ring-primary-100 disabled:opacity-[var(--opacity-disabled)] disabled:pointer-events-none",
            transitionFast,
            value.length ? "py-1.5 px-2 min-h-[var(--size-control-md)]" : triggerSizes[size],
            "rounded-[var(--radius-md)]",
          )}
        >
          {value.length === 0 && <span className="text-neutral-400 text-sm">{placeholder}</span>}
          {value.map((v) => {
            const opt = options.find((o) => o.value === v);
            return (
              <span
                key={v}
                className="inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-primary-50 text-primary-700 text-xs font-medium pl-2.5 pr-1.5 py-1"
              >
                {opt?.label ?? v}
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(v);
                  }}
                  className="rounded-full hover:bg-primary-200/70 p-0.5"
                >
                  <X className="size-3" />
                </span>
              </span>
            );
          })}
          <ChevronDown className="ml-auto size-4 text-neutral-400 shrink-0" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-[var(--z-dropdown)] w-[var(--radix-popover-trigger-width)] rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-0 p-1.5 shadow-[var(--shadow-lg)] animate-[var(--animate-scale-in)]"
        >
          {options.map((opt) => {
            const checked = value.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                disabled={opt.disabled}
                className={cn(
                  "flex w-full items-center justify-between rounded-[var(--radius-sm)] px-2.5 py-2 text-sm text-neutral-700 hover:bg-primary-50 hover:text-primary-800",
                  checked && "bg-primary-50/60 font-medium text-primary-700",
                  opt.disabled && "opacity-[var(--opacity-disabled)] pointer-events-none",
                )}
              >
                {opt.label}
                {checked && <Check className="size-4 text-primary-600" />}
              </button>
            );
          })}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/* ---------------------------------------------------------------------
   Combobox
   --------------------------------------------------------------------- */
export function Combobox({
  options,
  value,
  onValueChange,
  placeholder = "Search options…",
  emptyText = "No results found.",
  size = "md",
  disabled,
}: {
  options: SelectOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  size?: FieldSize;
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full items-center justify-between gap-2 bg-neutral-0 border border-neutral-200 shadow-[var(--shadow-xs)] outline-none text-left text-neutral-900",
            "focus:ring-[3px] focus:ring-primary-100 disabled:opacity-[var(--opacity-disabled)] disabled:pointer-events-none",
            transitionFast,
            triggerSizes[size],
          )}
        >
          <span className={cn("truncate", !selected && "text-neutral-400")}>{selected ? selected.label : placeholder}</span>
          <ChevronDown className="size-4 text-neutral-400 shrink-0" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={6}
          className="z-[var(--z-dropdown)] w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-[var(--radius-md)] border border-neutral-200 bg-neutral-0 shadow-[var(--shadow-lg)] animate-[var(--animate-scale-in)]"
        >
          <CommandPrimitive className="w-full">
            <div className="border-b border-neutral-100 px-2">
              <CommandPrimitive.Input
                placeholder="Type to filter…"
                className="h-10 w-full bg-transparent px-1 text-sm outline-none placeholder:text-neutral-400"
              />
            </div>
            <CommandPrimitive.List className="max-h-60 overflow-y-auto p-1.5">
              <CommandPrimitive.Empty className="py-6 text-center text-sm text-neutral-400">{emptyText}</CommandPrimitive.Empty>
              {options.map((opt) => (
                <CommandPrimitive.Item
                  key={opt.value}
                  value={opt.label}
                  disabled={opt.disabled}
                  onSelect={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded-[var(--radius-sm)] px-2.5 py-2 text-sm text-neutral-700 aria-selected:bg-primary-50 aria-selected:text-primary-800",
                  )}
                >
                  {opt.label}
                  {opt.value === value && <Check className="size-4 text-primary-600" />}
                </CommandPrimitive.Item>
              ))}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
