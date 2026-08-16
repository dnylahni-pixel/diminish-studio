import * as React from "react";
import { Eye, EyeOff, Search, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "../../utils/cn";
import { transitionFast } from "./shared";

export type FieldState = "default" | "error" | "success" | "warning";
export type FieldSize = "sm" | "md" | "lg";

const fieldSizeMap: Record<FieldSize, string> = {
  sm: "h-[var(--size-control-sm)] text-sm px-3 rounded-[var(--radius-sm)]",
  md: "h-[var(--size-control-md)] text-sm px-3.5 rounded-[var(--radius-md)]",
  lg: "h-[var(--size-control-lg)] text-base px-4 rounded-[var(--radius-md)]",
};

const stateRing: Record<FieldState, string> = {
  default: "border-neutral-200 focus-within:border-primary-400",
  error: "border-danger-300 focus-within:border-danger-400",
  success: "border-success-300 focus-within:border-success-400",
  warning: "border-warning-300 focus-within:border-warning-400",
};

export const fieldWrapperBase = cn(
  "flex items-center gap-2 w-full bg-neutral-0 border shadow-[var(--shadow-xs)]",
  transitionFast,
  "focus-within:ring-[3px] focus-within:ring-primary-100",
);

export interface BaseFieldWrapperProps {
  size?: FieldSize;
  state?: FieldState;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FieldShell({ size = "md", state = "default", disabled, readOnly, className, children }: BaseFieldWrapperProps) {
  return (
    <div
      className={cn(
        fieldWrapperBase,
        fieldSizeMap[size],
        stateRing[state],
        disabled && "opacity-[var(--opacity-disabled)] pointer-events-none bg-neutral-50",
        readOnly && "bg-neutral-50",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function fieldStateIcon(state?: FieldState) {
  if (state === "error") return <AlertCircle className="size-[var(--size-icon-sm)] text-danger-500" />;
  if (state === "success") return <CheckCircle2 className="size-[var(--size-icon-sm)] text-success-500" />;
  return null;
}

/* ---------------------------------------------------------------------
   Text Input
   --------------------------------------------------------------------- */
export interface TextInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: FieldSize;
  state?: FieldState;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const TextInput = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, size = "md", state = "default", leadingIcon, trailingIcon, disabled, readOnly, ...props }, ref) => {
    return (
      <FieldShell size={size} state={state} disabled={disabled} readOnly={readOnly}>
        {leadingIcon && <span className="text-neutral-400 shrink-0">{leadingIcon}</span>}
        <input
          ref={ref}
          disabled={disabled}
          readOnly={readOnly}
          className={cn(
            "flex-1 min-w-0 bg-transparent outline-none placeholder:text-neutral-400 text-neutral-900",
            className,
          )}
          {...props}
        />
        {trailingIcon ?? fieldStateIcon(state)}
      </FieldShell>
    );
  },
);
TextInput.displayName = "TextInput";

/* ---------------------------------------------------------------------
   Number Input
   --------------------------------------------------------------------- */
export interface NumberInputProps extends Omit<TextInputProps, "type" | "onChange"> {
  value?: number;
  onChange?: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

export function NumberInput({ value, onChange, step = 1, min, max, size = "md", state = "default", disabled, className, ...props }: NumberInputProps) {
  const update = (delta: number) => {
    const next = (value ?? 0) + delta;
    if (min !== undefined && next < min) return;
    if (max !== undefined && next > max) return;
    onChange?.(next);
  };
  return (
    <FieldShell size={size} state={state} disabled={disabled} className={cn("pr-1.5", className)}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={(e) => onChange?.(Number(e.target.value))}
        className="flex-1 min-w-0 bg-transparent outline-none text-neutral-900 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        {...props}
      />
      <div className="flex flex-col shrink-0 -mr-1">
        <button
          type="button"
          disabled={disabled}
          onClick={() => update(step)}
          className="px-1.5 leading-none text-neutral-500 hover:text-neutral-900 disabled:opacity-40"
          aria-label="Increment"
        >
          ▲
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => update(-step)}
          className="px-1.5 leading-none text-neutral-500 hover:text-neutral-900 disabled:opacity-40"
          aria-label="Decrement"
        >
          ▼
        </button>
      </div>
    </FieldShell>
  );
}

/* ---------------------------------------------------------------------
   Password Input
   --------------------------------------------------------------------- */
export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<TextInputProps, "type" | "trailingIcon">>(
  ({ size = "md", state = "default", disabled, className, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    return (
      <FieldShell size={size} state={state} disabled={disabled}>
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          disabled={disabled}
          className={cn("flex-1 min-w-0 bg-transparent outline-none placeholder:text-neutral-400 text-neutral-900", className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="text-neutral-400 hover:text-neutral-700 shrink-0"
          aria-label={visible ? "Hide value" : "Show value"}
        >
          {visible ? <EyeOff className="size-[var(--size-icon-sm)]" /> : <Eye className="size-[var(--size-icon-sm)]" />}
        </button>
      </FieldShell>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

/* ---------------------------------------------------------------------
   Search Input
   --------------------------------------------------------------------- */
export function SearchInput({ size = "md", state = "default", disabled, className, value, onChange, onClear, ...props }: TextInputProps & { onClear?: () => void }) {
  return (
    <FieldShell size={size} state={state} disabled={disabled}>
      <Search className="size-[var(--size-icon-sm)] text-neutral-400 shrink-0" />
      <input
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn("flex-1 min-w-0 bg-transparent outline-none placeholder:text-neutral-400 text-neutral-900", className)}
        {...props}
      />
      {!!value && (
        <button type="button" onClick={onClear} className="text-neutral-400 hover:text-neutral-700 shrink-0" aria-label="Clear search">
          <X className="size-[var(--size-icon-sm)]" />
        </button>
      )}
    </FieldShell>
  );
}

/* ---------------------------------------------------------------------
   Textarea
   --------------------------------------------------------------------- */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  state?: FieldState;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, state = "default", disabled, readOnly, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        disabled={disabled}
        readOnly={readOnly}
        className={cn(
          "w-full resize-y bg-neutral-0 border rounded-[var(--radius-md)] px-3.5 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-[var(--shadow-xs)] outline-none",
          transitionFast,
          "focus:ring-[3px] focus:ring-primary-100",
          stateRing[state],
          disabled && "opacity-[var(--opacity-disabled)] pointer-events-none bg-neutral-50",
          readOnly && "bg-neutral-50",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

/* ---------------------------------------------------------------------
   Field wrapper: label + control + helper text composition
   --------------------------------------------------------------------- */
export function Field({
  label,
  htmlFor,
  required,
  optional,
  helper,
  state = "default",
  className,
  children,
}: {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  helper?: string;
  state?: FieldState;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="inline-flex items-center gap-1 text-sm font-medium text-neutral-700">
          {label}
          {required && <span className="text-danger-500">*</span>}
          {optional && <span className="text-neutral-400 font-normal text-xs">(optional)</span>}
        </label>
      )}
      {children}
      {helper && (
        <p
          className={cn(
            "text-xs",
            state === "error" && "text-danger-600",
            state === "success" && "text-success-600",
            state === "warning" && "text-warning-600",
            state === "default" && "text-neutral-500",
          )}
        >
          {helper}
        </p>
      )}
    </div>
  );
}
