import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { Check, Minus } from "lucide-react";
import { cn } from "../../utils/cn";
import { transitionFast } from "./shared";

/* ---------------------------------------------------------------------
   Checkbox
   --------------------------------------------------------------------- */
export interface CheckboxProps extends React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> {
  label?: string;
  indeterminate?: boolean;
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, label, indeterminate, checked, ...props }, ref) => {
    return (
      <label className={cn("inline-flex items-center gap-2.5 cursor-pointer", props.disabled && "opacity-[var(--opacity-disabled)] cursor-not-allowed")}>
        <CheckboxPrimitive.Root
          ref={ref}
          checked={indeterminate ? "indeterminate" : checked}
          className={cn(
            "peer size-[1.125rem] shrink-0 rounded-[0.375rem] border border-neutral-300 bg-neutral-0 shadow-[var(--shadow-xs)] outline-none",
            "data-[state=checked]:bg-primary-600 data-[state=checked]:border-primary-600",
            "data-[state=indeterminate]:bg-primary-600 data-[state=indeterminate]:border-primary-600",
            "focus-visible:ring-[3px] focus-visible:ring-primary-200",
            transitionFast,
            className,
          )}
          {...props}
        >
          <CheckboxPrimitive.Indicator className="flex items-center justify-center text-neutral-0">
            {indeterminate ? <Minus className="size-3" /> : <Check className="size-3" />}
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        {label && <span className="text-sm text-neutral-700">{label}</span>}
      </label>
    );
  },
);
Checkbox.displayName = "Checkbox";

/* ---------------------------------------------------------------------
   Radio
   --------------------------------------------------------------------- */
export function RadioGroup({ className, ...props }: React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root className={cn("flex flex-col gap-2.5", className)} {...props} />;
}

export function RadioItem({ value, label, disabled }: { value: string; label?: string; disabled?: boolean }) {
  return (
    <label className={cn("inline-flex items-center gap-2.5 cursor-pointer", disabled && "opacity-[var(--opacity-disabled)] cursor-not-allowed")}>
      <RadioGroupPrimitive.Item
        value={value}
        disabled={disabled}
        className={cn(
          "size-[1.125rem] shrink-0 rounded-full border border-neutral-300 bg-neutral-0 shadow-[var(--shadow-xs)] outline-none",
          "data-[state=checked]:border-primary-600",
          "focus-visible:ring-[3px] focus-visible:ring-primary-200",
          transitionFast,
          "flex items-center justify-center",
        )}
      >
        <RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-primary-600" />
      </RadioGroupPrimitive.Item>
      {label && <span className="text-sm text-neutral-700">{label}</span>}
    </label>
  );
}

/* ---------------------------------------------------------------------
   Switch
   --------------------------------------------------------------------- */
export function Switch({ className, size = "md", ...props }: React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> & { size?: "sm" | "md" }) {
  const sizes = {
    sm: { root: "h-5 w-9", thumb: "size-4 data-[state=checked]:translate-x-4" },
    md: { root: "h-6 w-11", thumb: "size-5 data-[state=checked]:translate-x-5" },
  };
  return (
    <SwitchPrimitive.Root
      className={cn(
        "relative inline-flex shrink-0 items-center rounded-full border border-transparent bg-neutral-200 outline-none",
        "data-[state=checked]:bg-primary-600",
        "focus-visible:ring-[3px] focus-visible:ring-primary-200",
        "disabled:opacity-[var(--opacity-disabled)] disabled:pointer-events-none",
        transitionFast,
        sizes[size].root,
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block translate-x-0.5 rounded-full bg-neutral-0 shadow-[var(--shadow-sm)]",
          transitionFast,
          sizes[size].thumb,
        )}
      />
    </SwitchPrimitive.Root>
  );
}

/* ---------------------------------------------------------------------
   Toggle (stateful pressed button — no assigned meaning)
   --------------------------------------------------------------------- */
export function Toggle({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root>) {
  return (
    <TogglePrimitive.Root
      className={cn(
        "inline-flex items-center justify-center gap-1.5 h-[var(--size-control-sm)] px-3 rounded-[var(--radius-sm)] border border-neutral-200 bg-neutral-0 text-sm font-medium text-neutral-600 shadow-[var(--shadow-xs)] outline-none",
        "hover:bg-neutral-50",
        "data-[state=on]:bg-primary-50 data-[state=on]:border-primary-200 data-[state=on]:text-primary-700",
        "focus-visible:ring-[3px] focus-visible:ring-primary-200",
        "disabled:opacity-[var(--opacity-disabled)] disabled:pointer-events-none",
        transitionFast,
        className,
      )}
      {...props}
    >
      {children}
    </TogglePrimitive.Root>
  );
}

/* ---------------------------------------------------------------------
   Slider / Range Slider
   --------------------------------------------------------------------- */
export function Slider({ className, ...props }: React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>) {
  const thumbCount = props.value?.length ?? props.defaultValue?.length ?? 1;
  return (
    <SliderPrimitive.Root
      className={cn("relative flex w-full touch-none select-none items-center py-2", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-neutral-200">
        <SliderPrimitive.Range className="absolute h-full bg-primary-500" />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }).map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            "block size-4.5 rounded-full border-2 border-primary-600 bg-neutral-0 shadow-[var(--shadow-sm)] outline-none",
            "hover:scale-110",
            "focus-visible:ring-[3px] focus-visible:ring-primary-200",
            "disabled:opacity-[var(--opacity-disabled)]",
            transitionFast,
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export const RangeSlider = Slider;
