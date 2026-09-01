/**
 * MOLECULE: Slider - اسلایدر لمس‌پسند (fill + thumb + حباب مقدار حین درگ)
 * حالت bare: بدون دستگیره و نازک - سبک استم‌های Moises
 * با Pointer Events (موس + لمس)، کیبورد-اکسسیبل (role=slider)
 */
import * as React from "react";
import { motion, type ThemeTokens } from "../../tokens";

export type SliderProps = {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  tokens: ThemeTokens;
  /** رنگ fill - پیش‌فرض textPrimary (سبک Moises) */
  accent?: string;
  ariaLabel: string;
  /** نمایش مقدار در حباب بالای thumb حین درگ */
  showBubble?: boolean;
  formatValue?: (v: number) => string;
  disabled?: boolean;
  width?: React.CSSProperties["width"];
  /** بدون دستگیره، تراک نازک - سبک ردیف استم Moises */
  bare?: boolean;
  /** اطلاع حالت درگ به والد (مثلاً برای نمایش لیبل زیر ردیف) */
  onDragStateChange?: (dragging: boolean) => void;
};

export const Slider = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  tokens: tk,
  accent,
  ariaLabel,
  showBubble = true,
  formatValue,
  disabled = false,
  width = "100%",
  bare = false,
  onDragStateChange,
}: SliderProps) => {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const setDrag = (d: boolean) => {
    setDragging(d);
    onDragStateChange?.(d);
  };

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const frac = max > min ? clamp((value - min) / (max - min)) : 0;
  const fill = accent ?? tk.textPrimary;
  const trackH = bare ? 3 : 4;
  const thumbS = bare ? 0 : 14;

  const fromClientX = (clientX: number) => {
    const el = trackRef.current;
    if (!el || disabled) return;
    const rect = el.getBoundingClientRect();
    const f = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
    const raw = min + Math.min(1, Math.max(0, f)) * (max - min);
    const stepped = Math.round(raw / step) * step;
    onChange(clamp(Math.round(stepped * 1e6) / 1e6));
  };

  return (
    <div
      ref={trackRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      onPointerDown={(e) => {
        if (disabled) return;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        setDrag(true);
        fromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging) fromClientX(e.clientX);
      }}
      onPointerUp={() => setDrag(false)}
      onPointerCancel={() => setDrag(false)}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") onChange(clamp(value + step));
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") onChange(clamp(value - step));
        else if (e.key === "Home") onChange(min);
        else if (e.key === "End") onChange(max);
        else return;
        e.preventDefault();
      }}
      style={{
        position: "relative",
        width,
        height: 28,
        display: "flex",
        alignItems: "center",
        touchAction: "none",
        cursor: disabled ? "default" : "pointer",
        outline: "none",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      {/* track */}
      <div style={{ position: "relative", width: "100%", height: trackH, borderRadius: 999, background: tk.hoverBg, overflow: "visible" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${frac * 100}%`,
            borderRadius: 999,
            background: fill,
            opacity: bare ? 0.95 : 1,
            transition: dragging ? "none" : `width 120ms ${motion.easing.lux}`,
          }}
        />
        {/* thumb */}
        {thumbS > 0 && (
          <div
            style={{
              position: "absolute",
              left: `${frac * 100}%`,
              top: "50%",
              width: thumbS,
              height: thumbS,
              borderRadius: 999,
              background: tk.textPrimary,
              transform: "translate(-50%, -50%)",
              boxShadow: dragging ? `0 0 0 6px ${fill}22` : "none",
              transition: dragging ? "none" : `box-shadow 300ms ${motion.easing.lux}`,
            }}
          />
        )}
        {/* value bubble */}
        {showBubble && dragging && (
          <div
            style={{
              position: "absolute",
              left: `${frac * 100}%`,
              bottom: "calc(100% + 10px)",
              transform: "translateX(-50%)",
              padding: "5px 11px",
              borderRadius: 999,
              background: "rgba(60,60,64,0.95)",
              color: tk.textPrimary,
              fontSize: 12,
              fontWeight: 650,
              fontFamily: "ui-monospace, monospace",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              zIndex: 30,
              animation: "popIn 0.18s cubic-bezier(0.32,0.72,0,1)",
            }}
          >
            {formatValue ? formatValue(value) : Math.round(value)}
          </div>
        )}
      </div>
    </div>
  );
};
