"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { Info, CheckCircle2, AlertTriangle, XCircle, X, Loader2, Inbox, ServerCrash } from "lucide-react";
import { cn } from "../../utils/cn";
import { useI18n } from "@/i18n/client";

type Tone = "neutral" | "info" | "success" | "warning" | "danger";

const toneConfig: Record<Tone, { bg: string; border: string; icon: React.ElementType; iconColor: string; text: string }> = {
  neutral: { bg: "bg-neutral-50", border: "border-neutral-200", icon: Info, iconColor: "text-neutral-500", text: "text-neutral-800" },
  info: { bg: "bg-info-50", border: "border-info-200", icon: Info, iconColor: "text-info-500", text: "text-info-900" },
  success: { bg: "bg-success-50", border: "border-success-200", icon: CheckCircle2, iconColor: "text-success-500", text: "text-success-900" },
  warning: { bg: "bg-warning-50", border: "border-warning-200", icon: AlertTriangle, iconColor: "text-warning-500", text: "text-warning-900" },
  danger: { bg: "bg-danger-50", border: "border-danger-200", icon: XCircle, iconColor: "text-danger-500", text: "text-danger-900" },
};

/* ---------------------------------------------------------------------
   Alert
   --------------------------------------------------------------------- */
export function Alert({
  tone = "neutral",
  title,
  children,
  onDismiss,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  const cfg = toneConfig[tone];
  const Icon = cfg.icon;
  return (
    <div className={cn("flex gap-3 rounded-[var(--radius-md)] border p-4", cfg.bg, cfg.border, className)}>
      <Icon className={cn("size-[var(--size-icon-md)] shrink-0", cfg.iconColor)} />
      <div className="flex-1 min-w-0">
        {title && <p className={cn("text-sm font-semibold", cfg.text)}>{title}</p>}
        {children && <div className={cn("text-sm mt-0.5", cfg.text, "opacity-80")}>{children}</div>}
      </div>
      {onDismiss && (
        <button onClick={onDismiss} className={cn("shrink-0 opacity-60 hover:opacity-100", cfg.text)} aria-label={t("ui.feedback.dismiss")}>
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Banner (full-width variant of alert)
   --------------------------------------------------------------------- */
export function Banner({ tone = "info", children, action, onDismiss }: { tone?: Tone; children: React.ReactNode; action?: React.ReactNode; onDismiss?: () => void }) {
  const { t } = useI18n();
  const cfg = toneConfig[tone];
  const Icon = cfg.icon;
  return (
    <div className={cn("flex items-center gap-3 border-b px-5 py-3", cfg.bg, cfg.border)}>
      <Icon className={cn("size-4 shrink-0", cfg.iconColor)} />
      <p className={cn("flex-1 text-sm font-medium", cfg.text)}>{children}</p>
      {action}
      {onDismiss && (
        <button onClick={onDismiss} className={cn("shrink-0 opacity-60 hover:opacity-100", cfg.text)} aria-label={t("ui.feedback.dismiss")}>
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Toast / Snackbar
   --------------------------------------------------------------------- */
export const ToastProvider = ToastPrimitive.Provider;
export function ToastViewport() {
  return (
    <ToastPrimitive.Viewport className="fixed bottom-0 end-0 z-[var(--z-toast)] m-0 flex w-96 max-w-[100vw] list-none flex-col gap-2.5 p-6 outline-none" />
  );
}

export function Toast({
  open,
  onOpenChange,
  tone = "neutral",
  title,
  description,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tone?: Tone;
  title: string;
  description?: string;
}) {
  const { t } = useI18n();
  const cfg = toneConfig[tone];
  const Icon = cfg.icon;
  return (
    <ToastPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      className={cn(
        "flex items-start gap-3 rounded-[var(--radius-md)] border bg-neutral-0 p-4 shadow-[var(--shadow-lg)]",
        "data-[state=open]:animate-[var(--animate-slide-up)] data-[state=closed]:animate-[var(--animate-fade-in)]",
        cfg.border,
      )}
    >
      <Icon className={cn("size-4 shrink-0 mt-0.5", cfg.iconColor)} />
      <div className="flex-1">
        <ToastPrimitive.Title className="text-sm font-semibold text-neutral-900">{title}</ToastPrimitive.Title>
        {description && <ToastPrimitive.Description className="text-xs text-neutral-500 mt-0.5">{description}</ToastPrimitive.Description>}
      </div>
      <ToastPrimitive.Close className="text-neutral-400 hover:text-neutral-700" aria-label={t("ui.feedback.close")}>
        <X className="size-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
}

// Snackbar: a lighter-weight, single-line toast variant
export function Snackbar({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-4 rounded-[var(--radius-md)] bg-neutral-900 text-neutral-0 px-4 py-3 shadow-[var(--shadow-lg)] text-sm">
      <span>{children}</span>
      {action}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Tooltip
   --------------------------------------------------------------------- */
export const TooltipProvider = TooltipPrimitive.Provider;

export function Tooltip({ content, children, side = "top" }: { content: React.ReactNode; children: React.ReactNode; side?: "top" | "right" | "bottom" | "left" }) {
  return (
    <TooltipPrimitive.Root delayDuration={200}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          className="z-[var(--z-tooltip)] rounded-[var(--radius-sm)] bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-neutral-0 shadow-[var(--shadow-md)] animate-[var(--animate-fade-in)]"
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-neutral-900" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}

/* ---------------------------------------------------------------------
   Popover
   --------------------------------------------------------------------- */
export function Popover({ trigger, children, align = "center" }: { trigger: React.ReactNode; children: React.ReactNode; align?: "start" | "center" | "end" }) {
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align={align}
          sideOffset={8}
          className="z-[var(--z-popover)] w-72 rounded-[var(--radius-lg)] border border-neutral-200 bg-neutral-0 p-4 shadow-[var(--shadow-lg)] animate-[var(--animate-scale-in)]"
        >
          {children}
          <PopoverPrimitive.Arrow className="fill-neutral-0" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

/* ---------------------------------------------------------------------
   Progress
   --------------------------------------------------------------------- */
export function Progress({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const height = size === "sm" ? "h-1.5" : "h-2.5";
  return (
    <ProgressPrimitive.Root value={value} className={cn("relative w-full overflow-hidden rounded-full bg-neutral-100", height)}>
      <ProgressPrimitive.Indicator
        className="h-full rounded-full bg-primary-500 transition-transform duration-[var(--duration-slow)] ease-[var(--ease-standard)]"
        style={{ transform: `translateX(-${100 - value}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

/* ---------------------------------------------------------------------
   Spinner
   --------------------------------------------------------------------- */
export function Spinner({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizes = { sm: "size-4", md: "size-5", lg: "size-7" };
  return <Loader2 className={cn(sizes[size], "animate-spin text-primary-500", className)} />;
}

/* ---------------------------------------------------------------------
   Skeleton
   --------------------------------------------------------------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-[var(--radius-sm)] bg-shimmer", className)} />;
}

/* ---------------------------------------------------------------------
   Empty / Error / Loading state
   --------------------------------------------------------------------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t("ui.feedback.emptyTitle");
  const resolvedDescription = description ?? t("ui.feedback.emptyDescription");
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-neutral-200 px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
        {icon ?? <Inbox className="size-5" />}
      </div>
      <div>
        <p className="text-sm font-semibold text-neutral-800">{resolvedTitle}</p>
        <p className="mt-1 text-sm text-neutral-500 max-w-xs">{resolvedDescription}</p>
      </div>
      {action}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t("ui.feedback.errorTitle");
  const resolvedDescription = description ?? t("ui.feedback.errorDescription");
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-danger-100 bg-danger-50/40 px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-danger-100 text-danger-500">
        <ServerCrash className="size-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-danger-800">{resolvedTitle}</p>
        <p className="mt-1 text-sm text-danger-600/80 max-w-xs">{resolvedDescription}</p>
      </div>
      {action}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n();
  const resolvedLabel = label ?? t("ui.feedback.loading");
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <Spinner size="lg" />
      <p className="text-sm text-neutral-500">{resolvedLabel}</p>
    </div>
  );
}
