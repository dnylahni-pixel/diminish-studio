import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2, ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";
import { focusRing, transitionFast, disabledStyles } from "./shared";

/* ---------------------------------------------------------------------
   Button
   --------------------------------------------------------------------- */
export const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 font-medium select-none whitespace-nowrap",
    "rounded-[var(--radius-md)] border",
    transitionFast,
    focusRing,
    disabledStyles,
  ),
  {
    variants: {
      variant: {
        primary:
          "bg-primary-600 border-primary-600 text-neutral-0 shadow-[var(--shadow-xs)] hover:bg-primary-700 hover:border-primary-700 active:bg-primary-800",
        secondary:
          "bg-neutral-0 border-neutral-200 text-neutral-800 shadow-[var(--shadow-xs)] hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100",
        soft: "bg-primary-50 border-transparent text-primary-700 hover:bg-primary-100 active:bg-primary-200",
        outline:
          "bg-transparent border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 active:bg-neutral-100",
        ghost: "bg-transparent border-transparent text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200",
        danger:
          "bg-danger-600 border-danger-600 text-neutral-0 shadow-[var(--shadow-xs)] hover:bg-danger-700 hover:border-danger-700 active:bg-danger-800",
      },
      size: {
        sm: "h-[var(--size-control-sm)] px-3 text-sm rounded-[var(--radius-sm)]",
        md: "h-[var(--size-control-md)] px-4 text-sm",
        lg: "h-[var(--size-control-lg)] px-5 text-base rounded-[var(--radius-lg)]",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading, disabled, leadingIcon, trailingIcon, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && <Loader2 className="size-[var(--size-icon-sm)] animate-spin" aria-hidden />}
        {!loading && leadingIcon}
        {children}
        {!loading && trailingIcon}
      </button>
    );
  },
);
Button.displayName = "Button";

/* ---------------------------------------------------------------------
   Icon Button
   --------------------------------------------------------------------- */
export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  label: string;
  loading?: boolean;
}

const iconButtonSize = {
  sm: "h-[var(--size-control-sm)] w-[var(--size-control-sm)] rounded-[var(--radius-sm)]",
  md: "h-[var(--size-control-md)] w-[var(--size-control-md)]",
  lg: "h-[var(--size-control-lg)] w-[var(--size-control-lg)] rounded-[var(--radius-lg)]",
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "secondary", size = "md", loading, label, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(buttonVariants({ variant, size: undefined }), iconButtonSize[size ?? "md"], "p-0", className)}
        {...props}
      >
        {loading ? <Loader2 className="size-[var(--size-icon-sm)] animate-spin" aria-hidden /> : children}
      </button>
    );
  },
);
IconButton.displayName = "IconButton";

/* ---------------------------------------------------------------------
   Button Group
   --------------------------------------------------------------------- */
export function ButtonGroup({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="group"
      className={cn(
        "inline-flex items-stretch overflow-hidden rounded-[var(--radius-md)] border border-neutral-200 shadow-[var(--shadow-xs)] divide-x divide-neutral-200",
        "[&>button]:rounded-none [&>button]:border-none [&>button]:shadow-none",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Split Button
   --------------------------------------------------------------------- */
export interface SplitButtonProps {
  children: React.ReactNode;
  onAction?: () => void;
  onToggle?: () => void;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  disabled?: boolean;
}

export function SplitButton({ children, onAction, onToggle, variant = "primary", size = "md", disabled }: SplitButtonProps) {
  return (
    <div className="inline-flex rounded-[var(--radius-md)] shadow-[var(--shadow-xs)]">
      <Button
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={onAction}
        className="rounded-r-none border-r border-r-neutral-0/20 shadow-none"
      >
        {children}
      </Button>
      <IconButton
        label="More actions"
        variant={variant}
        size={size}
        disabled={disabled}
        onClick={onToggle}
        className="rounded-l-none w-9 shadow-none"
      >
        <ChevronDown className="size-[var(--size-icon-sm)]" />
      </IconButton>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Link Button (looks like a link, behaves like a button)
   --------------------------------------------------------------------- */
export function LinkButton({
  className,
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "text-xs", md: "text-sm", lg: "text-base" };
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 font-medium text-primary-600 hover:text-primary-700 hover:underline underline-offset-4",
        transitionFast,
        focusRing,
        disabledStyles,
        "rounded-xs",
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
