import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { Check, X } from "lucide-react";
import { cn } from "../../utils/cn";
import { transitionFast } from "./shared";

/* ---------------------------------------------------------------------
   Tabs
   --------------------------------------------------------------------- */
export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("inline-flex items-center gap-1 border-b border-neutral-200", className)}
      {...props}
    />
  );
}

export function TabsTrigger({ className, ...props }: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative px-3.5 py-2.5 text-sm font-medium text-neutral-500 outline-none -mb-px border-b-2 border-transparent",
        "hover:text-neutral-800",
        "data-[state=active]:text-primary-700 data-[state=active]:border-primary-600",
        "focus-visible:ring-[3px] focus-visible:ring-primary-200 rounded-t-[var(--radius-xs)]",
        "disabled:opacity-[var(--opacity-disabled)] disabled:pointer-events-none",
        transitionFast,
        className,
      )}
      {...props}
    />
  );
}

export const TabsContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>>(
  ({ className, ...props }, ref) => (
    <TabsPrimitive.Content ref={ref} className={cn("pt-4 outline-none animate-[var(--animate-fade-in)]", className)} {...props} />
  ),
);
TabsContent.displayName = "TabsContent";

/* ---------------------------------------------------------------------
   Segmented control
   --------------------------------------------------------------------- */
export function SegmentedControl({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md";
}) {
  const padding = size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3.5 py-2 text-sm";
  return (
    <div role="tablist" className="inline-flex items-center gap-0.5 rounded-[var(--radius-md)] bg-neutral-100 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          type="button"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-[var(--radius-sm)] font-medium outline-none",
            padding,
            value === opt.value ? "bg-neutral-0 text-neutral-900 shadow-[var(--shadow-xs)]" : "text-neutral-500 hover:text-neutral-800",
            "focus-visible:ring-[3px] focus-visible:ring-primary-200",
            transitionFast,
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Chips / Tags / Pills
   --------------------------------------------------------------------- */
export function Chip({
  children,
  onRemove,
  selected,
  disabled,
  className,
}: {
  children: React.ReactNode;
  onRemove?: () => void;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border px-3 py-1.5 text-sm font-medium",
        selected ? "bg-primary-50 border-primary-200 text-primary-700" : "bg-neutral-0 border-neutral-200 text-neutral-700",
        disabled && "opacity-[var(--opacity-disabled)] pointer-events-none",
        transitionFast,
        className,
      )}
    >
      {children}
      {onRemove && (
        <button onClick={onRemove} className="rounded-full hover:bg-neutral-900/10 p-0.5" aria-label="Remove">
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

export function Tag({ tone = "neutral", children, className }: { tone?: "neutral" | "primary"; children: React.ReactNode; className?: string }) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-600",
    primary: "bg-primary-50 text-primary-700",
  };
  return (
    <span className={cn("inline-flex items-center rounded-[var(--radius-xs)] px-2 py-1 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Pill({ active, children, onClick, className }: { active?: boolean; children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-3.5 py-1.5 text-sm font-medium outline-none",
        active ? "bg-neutral-900 text-neutral-0" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
        "focus-visible:ring-[3px] focus-visible:ring-primary-200",
        transitionFast,
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------------
   Choice card / Checkbox card / Radio card
   --------------------------------------------------------------------- */
export function ChoiceCard({
  title,
  description,
  selected,
  disabled,
  icon,
  onClick,
  indicator = "radio",
}: {
  title: string;
  description?: string;
  selected?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  indicator?: "radio" | "checkbox" | "none";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-[var(--radius-lg)] border bg-neutral-0 p-4 text-left shadow-[var(--shadow-xs)] outline-none",
        selected ? "border-primary-400 ring-1 ring-primary-200" : "border-neutral-200 hover:border-neutral-300",
        "focus-visible:ring-[3px] focus-visible:ring-primary-200",
        "disabled:opacity-[var(--opacity-disabled)] disabled:pointer-events-none",
        transitionFast,
      )}
    >
      {icon && <div className="mt-0.5 shrink-0 text-neutral-500">{icon}</div>}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        {description && <p className="mt-0.5 text-xs text-neutral-500">{description}</p>}
      </div>
      {indicator !== "none" && (
        <div
          className={cn(
            "mt-0.5 flex size-[1.125rem] shrink-0 items-center justify-center border",
            indicator === "radio" ? "rounded-full" : "rounded-[0.375rem]",
            selected ? "border-primary-600 bg-primary-600" : "border-neutral-300 bg-neutral-0",
          )}
        >
          {selected && (indicator === "radio" ? <span className="size-2 rounded-full bg-neutral-0" /> : <Check className="size-3 text-neutral-0" />)}
        </div>
      )}
    </button>
  );
}

export const CheckboxCard = (props: Omit<React.ComponentProps<typeof ChoiceCard>, "indicator">) => (
  <ChoiceCard {...props} indicator="checkbox" />
);
export const RadioCard = (props: Omit<React.ComponentProps<typeof ChoiceCard>, "indicator">) => (
  <ChoiceCard {...props} indicator="radio" />
);
