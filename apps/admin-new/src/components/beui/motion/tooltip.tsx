"use client";
// Adapted from beui.dev/components/motion/tooltip (token mapping: shadcn roles -> Appica roles; RTL logical props).

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/beui-utils";

export type TooltipSide = "top" | "right" | "bottom" | "left";

export interface TooltipProps {
  content: ReactNode;
  side?: TooltipSide;
  /** Delay before showing (ms). Default 120. */
  delay?: number;
  className?: string;
  /** Classes for the outer wrapper span. Use to fix baseline / fill parent. */
  wrapperClassName?: string;
  children: ReactNode;
}

const GAP = 8;
const EDGE = 8;

interface TooltipPosition {
  x: number;
  y: number;
  side: TooltipSide;
}

const SIDE_ENTER: Record<TooltipSide, { x?: number; y?: number }> = {
  top: { y: 4 },
  right: { x: -4 },
  bottom: { y: -4 },
  left: { x: 4 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Fixed-position tooltip that keeps itself inside the viewport. When the
 * preferred side would overflow, it flips to the opposite side, then clamps
 * to the window edges — so it can never create page overflow / scrollbars.
 */
function computePosition(
  trigger: DOMRect,
  tipWidth: number,
  tipHeight: number,
  preferred: TooltipSide,
): TooltipPosition {
  const centerX = trigger.left + trigger.width / 2 - tipWidth / 2;
  const centerY = trigger.top + trigger.height / 2 - tipHeight / 2;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (preferred === "top" || preferred === "bottom") {
    const topY = trigger.top - tipHeight - GAP;
    const bottomY = trigger.bottom + GAP;
    let side = preferred;
    let y = preferred === "top" ? topY : bottomY;

    if (y < EDGE && bottomY + tipHeight + EDGE <= viewportHeight) {
      side = "bottom";
      y = bottomY;
    } else if (
      y + tipHeight + EDGE > viewportHeight &&
      topY >= EDGE
    ) {
      side = "top";
      y = topY;
    }

    return {
      x: clamp(centerX, EDGE, viewportWidth - tipWidth - EDGE),
      y: clamp(y, EDGE, viewportHeight - tipHeight - EDGE),
      side,
    };
  }

  const leftX = trigger.left - tipWidth - GAP;
  const rightX = trigger.right + GAP;
  let side = preferred;
  let x = preferred === "left" ? leftX : rightX;

  if (x < EDGE && rightX + tipWidth + EDGE <= viewportWidth) {
    side = "right";
    x = rightX;
  } else if (
    x + tipWidth + EDGE > viewportWidth &&
    leftX >= EDGE
  ) {
    side = "left";
    x = leftX;
  }

  return {
    x: clamp(x, EDGE, viewportWidth - tipWidth - EDGE),
    y: clamp(centerY, EDGE, viewportHeight - tipHeight - EDGE),
    side,
  };
}

/**
 * Hover / focus tooltip with blur enter/exit and spring spawn.
 */
export function Tooltip({
  content,
  side = "top",
  delay = 120,
  className,
  wrapperClassName,
  children,
}: TooltipProps) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  const show = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setOpen(true), delay);
  };

  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
    setPosition(null);
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const update = () => {
      const trigger = triggerRef.current;
      const tooltip = tooltipRef.current;
      if (!trigger || !tooltip) return;
      setPosition(
        computePosition(
          trigger.getBoundingClientRect(),
          tooltip.offsetWidth,
          tooltip.offsetHeight,
          side,
        ),
      );
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, side]);

  const enter = SIDE_ENTER[position?.side ?? side];

  return (
    <span
      ref={triggerRef}
      className={cn("relative inline-flex", wrapperClassName)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
    >
      {children}
      <AnimatePresence>
        {open ? (
          <motion.span
            ref={tooltipRef}
            id={id}
            role="tooltip"
            style={
              position
                ? { left: position.x, top: position.y }
                : { left: 0, top: 0 }
            }
            className={cn(
              "pointer-events-none fixed z-50 inline-flex max-w-64 items-center rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground shadow-lg",
              "whitespace-nowrap",
              !position && "invisible",
              className,
            )}
            initial={reduce ? { opacity: 0 } : { opacity: 0, ...enter }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, ...enter }}
            transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.7 }}
          >
            {content}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
