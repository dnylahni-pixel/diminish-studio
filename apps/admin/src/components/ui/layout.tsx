import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "../../utils/cn";

/* ---------------------------------------------------------------------
   Container
   --------------------------------------------------------------------- */
export function Container({
  size = "content",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { size?: "sm" | "md" | "lg" | "xl" | "content" }) {
  const sizes = {
    sm: "max-w-[var(--container-md)]",
    md: "max-w-[var(--container-2xl)]",
    lg: "max-w-[var(--container-3xl)]",
    xl: "max-w-[var(--container-content)]",
    content: "max-w-[var(--container-content)]",
  };
  return <div className={cn("mx-auto w-full px-6", sizes[size], className)} {...props} />;
}

/* ---------------------------------------------------------------------
   Stack (vertical flex) / Inline (horizontal flex)
   --------------------------------------------------------------------- */
type GapSize = "none" | "xs" | "sm" | "md" | "lg" | "xl";
const gaps: Record<GapSize, string> = {
  none: "gap-0",
  xs: "gap-1.5",
  sm: "gap-2.5",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-9",
};

export function Stack({
  gap = "md",
  align,
  justify,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { gap?: GapSize; align?: "start" | "center" | "end" | "stretch"; justify?: "start" | "center" | "end" | "between" }) {
  const alignMap = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" };
  const justifyMap = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between" };
  return (
    <div
      className={cn("flex flex-col", gaps[gap], align && alignMap[align], justify && justifyMap[justify], className)}
      {...props}
    />
  );
}

export function Inline({
  gap = "md",
  align = "center",
  justify,
  wrap = true,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  gap?: GapSize;
  align?: "start" | "center" | "end" | "stretch";
  justify?: "start" | "center" | "end" | "between";
  wrap?: boolean;
}) {
  const alignMap = { start: "items-start", center: "items-center", end: "items-end", stretch: "items-stretch" };
  const justifyMap = { start: "justify-start", center: "justify-center", end: "justify-end", between: "justify-between" };
  return (
    <div
      className={cn("flex flex-row", wrap && "flex-wrap", gaps[gap], alignMap[align], justify && justifyMap[justify], className)}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------------
   Grid
   --------------------------------------------------------------------- */
export function Grid({
  columns = 2,
  gap = "md",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { columns?: 1 | 2 | 3 | 4 | 5 | 6; gap?: GapSize }) {
  const cols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 lg:grid-cols-5",
    6: "grid-cols-2 lg:grid-cols-6",
  };
  return <div className={cn("grid", cols[columns], gaps[gap], className)} {...props} />;
}

/* ---------------------------------------------------------------------
   Spacer / Separator
   --------------------------------------------------------------------- */
export function Spacer({ size = "md", axis = "vertical" }: { size?: GapSize; axis?: "vertical" | "horizontal" }) {
  const sizeMap: Record<GapSize, string> = { none: "0", xs: "0.375rem", sm: "0.625rem", md: "1rem", lg: "1.5rem", xl: "2.25rem" };
  return (
    <span
      aria-hidden
      style={axis === "vertical" ? { height: sizeMap[size] } : { width: sizeMap[size] }}
      className="block shrink-0"
    />
  );
}

export function LayoutSeparator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-neutral-200", className)} />;
}

/* ---------------------------------------------------------------------
   Scroll area
   --------------------------------------------------------------------- */
export function ScrollArea({ className, children, viewportClassName }: { className?: string; children: React.ReactNode; viewportClassName?: string }) {
  return (
    <ScrollAreaPrimitive.Root className={cn("overflow-hidden", className)}>
      <ScrollAreaPrimitive.Viewport className={cn("size-full", viewportClassName)}>{children}</ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar orientation="vertical" className="flex w-2.5 touch-none select-none p-0.5">
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-neutral-300" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Scrollbar orientation="horizontal" className="flex h-2.5 touch-none select-none p-0.5">
        <ScrollAreaPrimitive.Thumb className="relative flex-1 rounded-full bg-neutral-300" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  );
}

/* ---------------------------------------------------------------------
   Aspect ratio
   --------------------------------------------------------------------- */
export function AspectRatio({ ratio = 16 / 9, className, children }: { ratio?: number; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("relative w-full overflow-hidden rounded-[var(--radius-md)]", className)} style={{ aspectRatio: ratio }}>
      <div className="absolute inset-0">{children}</div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   Responsive wrapper — reveals content differently across breakpoints
   --------------------------------------------------------------------- */
export function ResponsiveWrapper({
  className,
  mobile,
  desktop,
}: {
  className?: string;
  mobile: React.ReactNode;
  desktop: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="block lg:hidden">{mobile}</div>
      <div className="hidden lg:block">{desktop}</div>
    </div>
  );
}
