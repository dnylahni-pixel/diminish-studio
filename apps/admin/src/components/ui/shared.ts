/**
 * Shared, token-driven style fragments reused across the component library.
 * Centralizing these keeps every component consistent and avoids hardcoded
 * visual values scattered through the codebase.
 */

export const focusRing =
  "outline-none focus-visible:ring-[3px] focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-0";

export const focusRingInset =
  "outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-0";

export const transitionBase = "transition-all duration-[var(--duration-base)] ease-[var(--ease-standard)]";
export const transitionFast = "transition-all duration-[var(--duration-fast)] ease-[var(--ease-standard)]";
export const transitionColors = "transition-colors duration-[var(--duration-fast)] ease-[var(--ease-standard)]";
export const transitionTransform = "transition-transform duration-[var(--duration-base)] ease-[var(--ease-emphasized)]";

export const disabledStyles = "disabled:pointer-events-none disabled:opacity-[var(--opacity-disabled)]";

export const surfaceCard =
  "bg-neutral-0 border border-neutral-200 rounded-xl shadow-[var(--shadow-sm)]";

export const scrollbarThin = "[scrollbar-width:thin]";

export type Size = "xs" | "sm" | "md" | "lg" | "xl";

export type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

export const toneText: Record<Tone, string> = {
  neutral: "text-neutral-700",
  primary: "text-primary-700",
  success: "text-success-700",
  warning: "text-warning-700",
  danger: "text-danger-700",
  info: "text-info-700",
};

export const toneSoftBg: Record<Tone, string> = {
  neutral: "bg-neutral-100",
  primary: "bg-primary-50",
  success: "bg-success-50",
  warning: "bg-warning-50",
  danger: "bg-danger-50",
  info: "bg-info-50",
};

export const toneSolidBg: Record<Tone, string> = {
  neutral: "bg-neutral-800",
  primary: "bg-primary-600",
  success: "bg-success-600",
  warning: "bg-warning-500",
  danger: "bg-danger-600",
  info: "bg-info-600",
};

export const toneBorder: Record<Tone, string> = {
  neutral: "border-neutral-200",
  primary: "border-primary-200",
  success: "border-success-200",
  warning: "border-warning-200",
  danger: "border-danger-200",
  info: "border-info-200",
};

export const toneDot: Record<Tone, string> = {
  neutral: "bg-neutral-400",
  primary: "bg-primary-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
  info: "bg-info-500",
};
