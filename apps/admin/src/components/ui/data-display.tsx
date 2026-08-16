"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { ChevronDown, Copy, Check } from "lucide-react";
import { cn } from "../../utils/cn";
import { transitionFast } from "./shared";

/* ---------------------------------------------------------------------
   Card
   --------------------------------------------------------------------- */
export function Card({
  className,
  padding = "md",
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { padding?: "none" | "sm" | "md" | "lg"; interactive?: boolean }) {
  const paddings = { none: "", sm: "p-4", md: "p-5", lg: "p-7" };
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-neutral-200 bg-neutral-0 shadow-[var(--shadow-sm)]",
        paddings[padding],
        interactive && "cursor-pointer hover:shadow-[var(--shadow-md)] hover:border-neutral-300",
        transitionFast,
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-start justify-between gap-4 mb-4", className)} {...props} />;
}
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-base font-semibold text-neutral-900", className)} {...props} />;
}
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-neutral-500 mt-1", className)} {...props} />;
}
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-5 pt-4 border-t border-neutral-100 flex items-center gap-2.5", className)} {...props} />;
}

/* ---------------------------------------------------------------------
   Badge
   --------------------------------------------------------------------- */
type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "info";

const badgeTones: Record<Tone, string> = {
  neutral: "bg-neutral-100 text-neutral-600",
  primary: "bg-primary-50 text-primary-700",
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  info: "bg-info-50 text-info-700",
};

export function Badge({
  tone = "neutral",
  size = "md",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; size?: "sm" | "md" }) {
  const sizes = { sm: "text-[0.6875rem] px-1.5 py-0.5", md: "text-xs px-2 py-1" };
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-[var(--radius-xs)] font-semibold", badgeTones[tone], sizes[size], className)}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------------
   Status indicator
   --------------------------------------------------------------------- */
const statusDot: Record<Tone, string> = {
  neutral: "bg-neutral-400",
  primary: "bg-primary-500",
  success: "bg-success-500",
  warning: "bg-warning-500",
  danger: "bg-danger-500",
  info: "bg-info-500",
};

export function StatusIndicator({ tone = "neutral", label, pulse }: { tone?: Tone; label: string; pulse?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-neutral-600">
      <span className="relative flex size-2">
        {pulse && <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", statusDot[tone])} />}
        <span className={cn("relative inline-flex size-2 rounded-full", statusDot[tone])} />
      </span>
      {label}
    </span>
  );
}

/* ---------------------------------------------------------------------
   Avatar / Avatar group
   --------------------------------------------------------------------- */
const avatarSizes = {
  xs: "size-[var(--size-avatar-xs)] text-[0.625rem]",
  sm: "size-[var(--size-avatar-sm)] text-xs",
  md: "size-[var(--size-avatar-md)] text-sm",
  lg: "size-[var(--size-avatar-lg)] text-base",
  xl: "size-[var(--size-avatar-xl)] text-xl",
};

export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
  ring,
}: {
  src?: string;
  alt?: string;
  fallback: string;
  size?: keyof typeof avatarSizes;
  ring?: boolean;
}) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 font-semibold text-primary-700",
        ring && "ring-2 ring-neutral-0 shadow-[var(--shadow-xs)]",
        avatarSizes[size],
      )}
    >
      <AvatarPrimitive.Image src={src} alt={alt} className="size-full object-cover" />
      <AvatarPrimitive.Fallback className="flex size-full items-center justify-center">{fallback}</AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export function AvatarGroup({ children, max = 4 }: { children: React.ReactNode[]; max?: number }) {
  const visible = children.slice(0, max);
  const remaining = children.length - max;
  return (
    <div className="flex -space-x-2.5">
      {visible.map((child, i) => (
        <div key={i}>{child}</div>
      ))}
      {remaining > 0 && (
        <div className="flex size-[var(--size-avatar-md)] items-center justify-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-500 ring-2 ring-neutral-0">
          +{remaining}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   Table / Data table
   --------------------------------------------------------------------- */
export function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-[var(--radius-lg)] border border-neutral-200 shadow-[var(--shadow-xs)]">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}
export function TableHead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("bg-neutral-50", className)} {...props} />;
}
export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("divide-y divide-neutral-100", className)} {...props} />;
}
export function TableRow({ className, selected, ...props }: React.TableHTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return <tr className={cn("hover:bg-neutral-50/70", selected && "bg-primary-50/50", transitionFast, className)} {...props} />;
}
export function TableHeaderCell({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500", className)} {...props} />;
}
export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3.5 text-neutral-700", className)} {...props} />;
}

/* ---------------------------------------------------------------------
   Data table — Table composed with sortable headers, selection, and a
   pagination-ready footer. Content and columns remain fully generic.
   --------------------------------------------------------------------- */
export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  sortable?: boolean;
  align?: "left" | "right" | "center";
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  sortKey,
  sortDirection = "asc",
  onSortChange,
  selectable,
  selectedIds,
  onSelectionChange,
  footer,
}: {
  columns: DataTableColumn<T>[];
  data: T[];
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onSortChange?: (key: string) => void;
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;
  footer?: React.ReactNode;
}) {
  const allSelected = selectable && data.length > 0 && data.every((row) => selectedIds?.includes(row.id));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : data.map((r) => r.id));
  };

  const toggleOne = (id: string | number) => {
    if (!onSelectionChange || !selectedIds) return;
    onSelectionChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);
  };

  return (
    <div className="flex flex-col gap-3">
      <Table>
        <TableHead>
          <tr>
            {selectable && (
              <TableHeaderCell className="w-10">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="size-3.5 rounded-xs border-neutral-300" />
              </TableHeaderCell>
            )}
            {columns.map((col) => (
              <TableHeaderCell
                key={col.key}
                className={cn(col.align === "right" && "text-right", col.sortable && "cursor-pointer select-none hover:text-neutral-700")}
                onClick={() => col.sortable && onSortChange?.(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    <ChevronDown className={cn("size-3 transition-transform", sortDirection === "asc" && "rotate-180")} />
                  )}
                </span>
              </TableHeaderCell>
            ))}
          </tr>
        </TableHead>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.id} selected={selectedIds?.includes(row.id)}>
              {selectable && (
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedIds?.includes(row.id) ?? false}
                    onChange={() => toggleOne(row.id)}
                    className="size-3.5 rounded-xs border-neutral-300"
                  />
                </TableCell>
              )}
              {columns.map((col) => (
                <TableCell key={col.key} className={cn(col.align === "right" && "text-right tabular-nums")}>
                  {col.render(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {footer && <div className="flex items-center justify-between px-1">{footer}</div>}
    </div>
  );
}

/* ---------------------------------------------------------------------
   List / List item / Description list
   --------------------------------------------------------------------- */
export function List({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn("divide-y divide-neutral-100 rounded-[var(--radius-lg)] border border-neutral-200 bg-neutral-0", className)} {...props} />;
}

export function ListItem({
  leading,
  trailing,
  title,
  description,
  className,
  ...props
}: React.LiHTMLAttributes<HTMLLIElement> & { leading?: React.ReactNode; trailing?: React.ReactNode; title: React.ReactNode; description?: React.ReactNode }) {
  return (
    <li className={cn("flex items-center gap-3.5 px-4 py-3.5", className)} {...props}>
      {leading}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-800 truncate">{title}</p>
        {description && <p className="text-xs text-neutral-500 truncate mt-0.5">{description}</p>}
      </div>
      {trailing}
    </li>
  );
}

export function DescriptionList({ items }: { items: { term: string; description: React.ReactNode }[] }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
      {items.map((item) => (
        <div key={item.term}>
          <dt className="text-xs font-medium uppercase tracking-wide text-neutral-400">{item.term}</dt>
          <dd className="mt-1 text-sm font-medium text-neutral-800">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------------------------------------------------------------------
   Accordion
   --------------------------------------------------------------------- */
export const Accordion = AccordionPrimitive.Root;

export function AccordionItem({ className, ...props }: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item className={cn("border-b border-neutral-100 last:border-0", className)} {...props} />;
}

export function AccordionTrigger({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header>
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex w-full items-center justify-between py-4 text-left text-sm font-medium text-neutral-800 outline-none",
          "focus-visible:ring-[3px] focus-visible:ring-primary-200 rounded-[var(--radius-xs)]",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown className="size-4 text-neutral-400 transition-transform duration-[var(--duration-base)] group-data-[state=open]:rotate-180" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({ className, children, ...props }: React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      className={cn(
        "overflow-hidden text-sm text-neutral-500 data-[state=open]:animate-[var(--animate-slide-down)]",
        className,
      )}
      {...props}
    >
      <div className="pb-4">{children}</div>
    </AccordionPrimitive.Content>
  );
}

/* ---------------------------------------------------------------------
   Timeline
   --------------------------------------------------------------------- */
export function Timeline({ items }: { items: { title: string; description?: string; timestamp?: string; tone?: Tone }[] }) {
  return (
    <ol className="relative border-l-2 border-neutral-100 pl-6">
      {items.map((item, i) => (
        <li key={i} className="mb-7 last:mb-0">
          <span
            className={cn(
              "absolute -left-[9px] flex size-4 items-center justify-center rounded-full ring-4 ring-neutral-0",
              statusDot[item.tone ?? "primary"],
            )}
          />
          <p className="text-sm font-semibold text-neutral-900">{item.title}</p>
          {item.description && <p className="mt-0.5 text-sm text-neutral-500">{item.description}</p>}
          {item.timestamp && <p className="mt-1 text-xs text-neutral-400">{item.timestamp}</p>}
        </li>
      ))}
    </ol>
  );
}

/* ---------------------------------------------------------------------
   Divider / Separator
   --------------------------------------------------------------------- */
export function Divider({ orientation = "horizontal", label, className }: { orientation?: "horizontal" | "vertical"; label?: string; className?: string }) {
  if (label) {
    return (
      <div className={cn("flex items-center gap-3", className)}>
        <SeparatorPrimitive.Root className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs font-medium text-neutral-400">{label}</span>
        <SeparatorPrimitive.Root className="h-px flex-1 bg-neutral-200" />
      </div>
    );
  }
  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      className={cn(orientation === "horizontal" ? "h-px w-full" : "w-px h-full", "bg-neutral-200", className)}
    />
  );
}

/* ---------------------------------------------------------------------
   Code block
   --------------------------------------------------------------------- */
export function CodeBlock({ code, language = "text" }: { code: string; language?: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-neutral-800 bg-neutral-900 shadow-[var(--shadow-md)]">
      <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2.5">
        <span className="text-xs font-medium text-neutral-400">{language}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-100"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[0.8125rem] leading-relaxed text-neutral-100 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}