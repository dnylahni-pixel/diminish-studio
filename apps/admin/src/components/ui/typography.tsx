import * as React from "react";
import { cn } from "../../utils/cn";

/* ---------------------------------------------------------------------
   Display
   --------------------------------------------------------------------- */
export function Display({
  as: Tag = "h1",
  size = "lg",
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: "h1" | "h2" | "div"; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "text-3xl",
    md: "text-4xl",
    lg: "text-5xl",
  };
  return (
    <Tag
      className={cn(
        sizes[size],
        "font-extrabold tracking-[var(--tracking-tighter)] leading-[var(--leading-tight)] text-neutral-900",
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------------
   Headings
   --------------------------------------------------------------------- */
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const headingSizeMap: Record<HeadingLevel, string> = {
  1: "text-3xl",
  2: "text-2xl",
  3: "text-xl",
  4: "text-lg",
  5: "text-md",
  6: "text-base",
};

export function Heading({
  level = 2,
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { level?: HeadingLevel }) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return (
    <Tag
      className={cn(
        headingSizeMap[level],
        "font-semibold tracking-[var(--tracking-tight)] leading-[var(--leading-tight)] text-neutral-900",
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------------
   Body text
   --------------------------------------------------------------------- */
export function Text({
  as: Tag = "p",
  size = "md",
  weight = "normal",
  tone = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
  as?: "p" | "span" | "div";
  size?: "xs" | "sm" | "md" | "lg";
  weight?: "normal" | "medium" | "semibold" | "bold";
  tone?: "default" | "muted" | "subtle" | "inverted";
}) {
  const sizes = { xs: "text-xs", sm: "text-sm", md: "text-base", lg: "text-lg" };
  const weights = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };
  const tones = {
    default: "text-neutral-800",
    muted: "text-neutral-500",
    subtle: "text-neutral-400",
    inverted: "text-neutral-0",
  };
  return (
    <Tag
      className={cn(sizes[size], weights[weight], tones[tone], "leading-[var(--leading-normal)]", className)}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------------
   Label
   --------------------------------------------------------------------- */
export function Label({
  className,
  required,
  optional,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean; optional?: boolean }) {
  return (
    <label
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium text-neutral-700 leading-[var(--leading-snug)]",
        className,
      )}
      {...props}
    >
      {props.children}
      {required && <span className="text-danger-500">*</span>}
      {optional && <span className="text-neutral-400 font-normal">(optional)</span>}
    </label>
  );
}

/* ---------------------------------------------------------------------
   Caption / Helper text
   --------------------------------------------------------------------- */
export function Caption({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("text-xs font-medium tracking-[var(--tracking-wide)] uppercase text-neutral-400", className)}
      {...props}
    />
  );
}

export function HelperText({
  tone = "default",
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { tone?: "default" | "danger" | "success" | "warning" }) {
  const tones = {
    default: "text-neutral-500",
    danger: "text-danger-600",
    success: "text-success-600",
    warning: "text-warning-600",
  };
  return <p className={cn("text-xs leading-[var(--leading-normal)]", tones[tone], className)} {...props} />;
}

/* ---------------------------------------------------------------------
   Link
   --------------------------------------------------------------------- */
export function Link({
  className,
  underline = "hover",
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { underline?: "always" | "hover" | "none" }) {
  const underlines = {
    always: "underline underline-offset-4 decoration-primary-300",
    hover: "hover:underline underline-offset-4 decoration-primary-300",
    none: "no-underline",
  };
  return (
    <a
      className={cn(
        "font-medium text-primary-600 hover:text-primary-700 transition-colors duration-[var(--duration-fast)] rounded-xs outline-none focus-visible:ring-[3px] focus-visible:ring-primary-300",
        underlines[underline],
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------------
   Code (inline) & numeric text
   --------------------------------------------------------------------- */
export function Code({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <code
      className={cn(
        "rounded-xs bg-neutral-100 border border-neutral-200 px-1.5 py-0.5 font-mono text-[0.8125rem] text-neutral-700",
        className,
      )}
      {...props}
    />
  );
}

export function NumericText({
  size = "md",
  tabular = true,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { size?: "sm" | "md" | "lg" | "xl"; tabular?: boolean }) {
  const sizes = { sm: "text-sm", md: "text-base", lg: "text-xl", xl: "text-3xl" };
  return (
    <span
      className={cn(
        sizes[size],
        "font-semibold text-neutral-900",
        tabular && "tabular-nums",
        className,
      )}
      {...props}
    />
  );
}
