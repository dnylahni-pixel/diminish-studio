import * as React from "react";
import { BarChart3, AlertTriangle } from "lucide-react";
import { cn } from "../../utils/cn";
import { Spinner } from "./feedback";

/* ---------------------------------------------------------------------
   Chart container / header / legend / tooltip
   --------------------------------------------------------------------- */
export function ChartContainer({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-[var(--radius-lg)] border border-neutral-200 bg-neutral-0 p-5 shadow-[var(--shadow-sm)]", className)}>
      {children}
    </div>
  );
}

export function ChartHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <p className="text-sm font-semibold text-neutral-900">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-4 mt-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2 text-xs font-medium text-neutral-500">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </div>
      ))}
    </div>
  );
}

export function ChartTooltip({ label, items }: { label: string; items: { name: string; value: string; color: string }[] }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-neutral-200 bg-neutral-0 px-3 py-2.5 shadow-[var(--shadow-md)] text-xs min-w-[9rem]">
      <p className="font-semibold text-neutral-800 mb-1.5">{label}</p>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-neutral-500">
              <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
              {item.name}
            </span>
            <span className="font-medium text-neutral-800 tabular-nums">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Chart loading / empty / error states
   --------------------------------------------------------------------- */
export function ChartLoadingState({ height = 220 }: { height?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5" style={{ height }}>
      <Spinner />
      <p className="text-xs text-neutral-400">Loading chart data…</p>
    </div>
  );
}

export function ChartEmptyState({ height = 220 }: { height?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5" style={{ height }}>
      <div className="flex size-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-400">
        <BarChart3 className="size-4" />
      </div>
      <p className="text-xs text-neutral-400">No data to display</p>
    </div>
  );
}

export function ChartErrorState({ height = 220 }: { height?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5" style={{ height }}>
      <div className="flex size-10 items-center justify-center rounded-full bg-danger-50 text-danger-500">
        <AlertTriangle className="size-4" />
      </div>
      <p className="text-xs text-danger-500">Chart failed to load</p>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Sparkline wrapper (renders any inline SVG/points as a compact trend)
   --------------------------------------------------------------------- */
export function Sparkline({
  points,
  width = 120,
  height = 36,
  color = "var(--color-primary-500)",
}: {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1 || 1);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${height - ((p - min) / range) * height}`).join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
