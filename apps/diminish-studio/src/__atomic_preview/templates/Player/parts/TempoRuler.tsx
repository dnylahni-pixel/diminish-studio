/**
 * PART: TempoRuler - خط‌کش تیک‌دار تمیز (پورت از Tempo-Control-Clean.html)
 * طراحی: BPM بزرگ 96px + خط‌کش افقی 168px با نشانگر سه‌تیکه فیروزه‌ای + تیک‌ها 60-200 + دکمه‌های ± با long-press
 * معماری: tokens + motion + global.css (no extra keyframes)
 */
import * as React from "react";
import { Theme, ThemeTokens, motion } from "../../../tokens";
import { clamp } from "./ui";

export type TempoRulerProps = {
  tokens: ThemeTokens;
  theme?: Theme;
  min: number;
  max: number;
  value: number;
  original: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
  label?: (v: number) => string;
  step?: number;
};

const KN = 20; // tick width
const ANIM_MS = 280;

export const TempoRuler = ({ tokens: tk, theme, min, max, value, original, onChange, format, label, step = 1 }: TempoRulerProps) => {
  const isDark = theme ? theme === "dark" : tk.textPrimary === "#FFFFFF" || tk.app === "#0E0E0E" || tk.app === "#07090A";
  const count = max - min + 1;

  const rulerRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [translate, setTranslate] = React.useState(0);
  const translateRef = React.useRef(0);
  const centerRef = React.useRef(190);
  const draggingRef = React.useRef(false);
  const startXRef = React.useRef(0);
  const startTranslateRef = React.useRef(0);
  const velocityRef = React.useRef(0);
  const lastXRef = React.useRef(0);
  const lastTimeRef = React.useRef(0);
  const animRef = React.useRef<number | null>(null);
  const pendingRef = React.useRef<number | null>(null);
  const holdTimeoutRef = React.useRef<number | null>(null);
  const holdIntervalRef = React.useRef<number | null>(null);
  const holdStartRef = React.useRef(0);
  const holdDirRef = React.useRef<1 | -1>(1);
  const [holdActive, setHoldActive] = React.useState<null | "plus" | "minus">(null);
  const isHoldingRef = React.useRef(false);
  const valueRef = React.useRef(value);

  React.useEffect(() => {
    valueRef.current = value;
  }, [value]);

  React.useEffect(() => {
    translateRef.current = translate;
  }, [translate]);

  const clampVal = React.useCallback((v: number) => clamp(Math.round(v / step) * step, min, max), [min, max, step]);

  const valueToTranslate = React.useCallback(
    (v: number, center = centerRef.current) => {
      const half = KN / 2;
      return center - (v - min) * KN - half;
    },
    [min]
  );

  const translateToValue = React.useCallback(
    (tr: number, center = centerRef.current) => {
      const half = KN / 2;
      return min + (center - half - tr) / KN;
    },
    [min]
  );

  const getBounds = React.useCallback(() => {
    const center = centerRef.current;
    const half = KN / 2;
    const minT = center - (max - min) * KN - half;
    const maxT = center - half;
    return { minT, maxT };
  }, [min, max]);

  // sync center on resize and on mount
  React.useLayoutEffect(() => {
    const updateCenter = () => {
      if (!rulerRef.current) return;
      const rect = rulerRef.current.getBoundingClientRect();
      const center = window.innerWidth / 2 - rect.left;
      // for drawer, fallback to container width center if window center is off
      const containerWidth = rulerRef.current.clientWidth;
      const fallback = containerWidth / 2;
      const finalCenter = Math.abs(center - fallback) > 200 ? fallback : center;
      centerRef.current = finalCenter;
      const tr = valueToTranslate(valueRef.current, finalCenter);
      setTranslate(tr);
      translateRef.current = tr;
    };
    updateCenter();
    const onResize = () => updateCenter();
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(updateCenter);
    if (rulerRef.current) ro.observe(rulerRef.current);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => {
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [valueToTranslate]);

  // when value prop changes externally, animate translate
  React.useEffect(() => {
    const target = valueToTranslate(value);
    if (Math.abs(translateRef.current - target) > 0.5) {
      animateTo(target, value);
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelAnim = React.useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;
  }, []);

  const animateTo = React.useCallback(
    (target: number, finalValue: number, duration = ANIM_MS) => {
      cancelAnim();
      const start = translateRef.current;
      const delta = target - start;
      const startTime = performance.now();
      const ease = (t: number) => 1 - Math.pow(1 - t, 3);
      const tick = (now: number) => {
        const elapsed = now - startTime;
        const p = clamp(elapsed / duration, 0, 1);
        const eased = ease(p);
        const cur = start + delta * eased;
        translateRef.current = cur;
        setTranslate(cur);
        if (p < 1) {
          animRef.current = requestAnimationFrame(tick);
        } else {
          onChange(finalValue);
          valueRef.current = finalValue;
        }
      };
      animRef.current = requestAnimationFrame(tick);
    },
    [onChange, cancelAnim]
  );

  const snap = React.useCallback(() => {
    const raw = Math.round(translateToValue(translateRef.current));
    const v = clampVal(raw);
    const tr = valueToTranslate(v);
    animateTo(tr, v);
  }, [clampVal, translateToValue, valueToTranslate, animateTo]);

  const handlePointerDown = (e: React.PointerEvent) => {
    cancelAnim();
    draggingRef.current = true;
    pendingRef.current = e.pointerId as unknown as number;
    startXRef.current = e.clientX;
    startTranslateRef.current = translateRef.current;
    velocityRef.current = 0;
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const now = performance.now();
    const dx = e.clientX - startXRef.current;
    const { minT, maxT } = getBounds();
    let next = startTranslateRef.current + dx;
    next = clamp(next, minT, maxT);
    translateRef.current = next;
    setTranslate(next);
    const raw = translateToValue(next);
    const v = clampVal(raw);
    // live update value while dragging for BPM display
    if (v !== valueRef.current) {
      valueRef.current = v;
      onChange(v);
    }
    const dt = now - lastTimeRef.current;
    if (dt > 0) {
      const vx = (e.clientX - lastXRef.current) / dt;
      velocityRef.current = velocityRef.current * 0.6 + vx * 0.4;
    }
    lastXRef.current = e.clientX;
    lastTimeRef.current = now;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    if (Math.abs(velocityRef.current) > 0.08) {
      const { minT, maxT } = getBounds();
      let vel = velocityRef.current * 16;
      const animateMomentum = () => {
        vel *= 0.92;
        if (Math.abs(vel) < 0.15) {
          snap();
          return;
        }
        let next = translateRef.current + vel;
        if (next <= minT) {
          next = minT;
          vel = 0;
        }
        if (next >= maxT) {
          next = maxT;
          vel = 0;
        }
        translateRef.current = next;
        setTranslate(next);
        const raw = translateToValue(next);
        const v = clampVal(raw);
        if (v !== valueRef.current) {
          valueRef.current = v;
          onChange(v);
        }
        if (next === minT || next === maxT) {
          snap();
          return;
        }
        animRef.current = requestAnimationFrame(animateMomentum);
      };
      animRef.current = requestAnimationFrame(animateMomentum);
    } else {
      snap();
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
    if (Math.abs(delta) < 1) return;
    e.preventDefault();
    cancelAnim();
    const { minT, maxT } = getBounds();
    let next = translateRef.current - delta * 0.6;
    next = clamp(next, minT, maxT);
    translateRef.current = next;
    setTranslate(next);
    const raw = translateToValue(next);
    const v = clampVal(raw);
    onChange(v);
    valueRef.current = v;
  };

  const clearHold = React.useCallback(() => {
    if (holdTimeoutRef.current) window.clearTimeout(holdTimeoutRef.current);
    if (holdIntervalRef.current) window.clearInterval(holdIntervalRef.current);
    holdTimeoutRef.current = null;
    holdIntervalRef.current = null;
  }, []);

  const doStep = React.useCallback(
    (dir: 1 | -1) => {
      const cur = valueRef.current;
      const next = clampVal(cur + dir * step);
      if (next === cur) return;
      const tr = valueToTranslate(next);
      animateTo(tr, next, 180);
    },
    [clampVal, valueToTranslate, animateTo, step]
  );

  const startHold = (e: React.PointerEvent, dir: 1 | -1) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    clearHold();
    cancelAnim();
    holdDirRef.current = dir as 1 | -1;
    holdStartRef.current = Date.now();
    isHoldingRef.current = false;
    setHoldActive(dir === 1 ? "plus" : "minus");
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    holdTimeoutRef.current = window.setTimeout(() => {
      holdTimeoutRef.current = null;
      isHoldingRef.current = true;
      try {
        if (navigator.vibrate) navigator.vibrate(12);
      } catch {}
      const tick = () => {
        const elapsed = Date.now() - holdStartRef.current;
        let interval = 110;
        if (elapsed > 3000) interval = 28;
        else if (elapsed > 1500) interval = 55;
        doStep(holdDirRef.current);
        try {
          if (navigator.vibrate) navigator.vibrate(elapsed > 1500 ? 6 : 3);
        } catch {}
        holdIntervalRef.current = window.setTimeout(tick, interval);
      };
      tick();
    }, 300);
  };

  const endHold = (e: React.PointerEvent, dir: 1 | -1) => {
    e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    const wasHolding = isHoldingRef.current;
    if (holdTimeoutRef.current) window.clearTimeout(holdTimeoutRef.current);
    holdTimeoutRef.current = null;
    if (!wasHolding) {
      doStep(dir);
      try {
        if (navigator.vibrate) navigator.vibrate(8);
      } catch {}
    }
    if (holdIntervalRef.current) window.clearTimeout(holdIntervalRef.current);
    holdIntervalRef.current = null;
    isHoldingRef.current = false;
    setHoldActive(null);
  };

  const cancelHold = (e: React.PointerEvent) => {
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    clearHold();
    isHoldingRef.current = false;
    setHoldActive(null);
  };

  React.useEffect(() => () => {
    clearHold();
    cancelAnim();
  }, [clearHold, cancelAnim]);

  const display = format(value);
  const ticks = Array.from({ length: count }, (_, i) => min + i);
  const selectedRounded = Math.round(value);

  return (
    <div ref={containerRef} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "4px 0 2px", width: "100%" }}>
      {label && (
        <div style={{ fontSize: 14, color: tk.textPrimary, fontWeight: 550, fontFamily: "Vazirmatn, Inter, ui-sans-serif", letterSpacing: "-0.01em" }}>{label(value)}</div>
      )}

      {/* BPM بزرگ */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", paddingTop: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
          <span
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 0.9,
              fontVariantNumeric: "tabular-nums",
              color: isDark ? "#FFFFFF" : "#07090A",
              fontFamily: "Vazirmatn, Inter, ui-sans-serif, system-ui, sans-serif",
              transition: `color 300ms ${motion.easing.lux}`,
            }}
          >
            {display}
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: "0.18em",
              marginBottom: 14,
              color: isDark ? "rgba(255,255,255,0.4)" : "rgba(7,9,10,0.45)",
              transition: `color 300ms ${motion.easing.lux}`,
            }}
          >
            BPM
          </span>
        </div>
      </div>

      {/* خط‌کش */}
      <div
        ref={rulerRef}
        className="relative w-full mt-[44px] h-[168px]"
        style={{ width: "100%" }}
      >
        {/* نشانگر مرکز */}
        <div className="absolute top-0 z-30 flex flex-col items-center pointer-events-none" style={{ left: "50%", transform: "translateX(-50%)" }}>
          <div style={{ width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderTop: "8px solid #0FB5B5", filter: "drop-shadow(0 0 8px rgba(15,181,181,0.65))" }} />
          <div
            style={{
              width: 2,
              height: 64,
              marginTop: 2,
              borderRadius: 1,
              background: "linear-gradient(to bottom, #0FB5B5 0%, rgba(15,181,181,0.42) 100%)",
              boxShadow: "0 0 12px rgba(15,181,181,0.6)",
            }}
          />
          <div
            style={{
              width: 5,
              height: 5,
              borderRadius: 999,
              marginTop: 6,
              background: "#0FB5B5",
              boxShadow: "0 0 10px rgba(15,181,181,0.75), 0 0 20px rgba(15,181,181,0.35)",
              opacity: 0.95,
            }}
          />
        </div>

        {/* تیک‌ها */}
        <div
          className="absolute left-0 right-0 top-[86px] h-[82px] overflow-hidden"
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
            maskImage: "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
          }}
        >
          <div
            className="absolute top-0 left-0 flex items-start cursor-grab active:cursor-grabbing will-change-transform touch-none select-none"
            style={{ transform: `translate3d(${translate}px, 0, 0)`, touchAction: "none" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
          >
            {ticks.map((v) => {
              const isMajor = v % 10 === 0;
              const isMedium = v % 5 === 0;
              const isSelected = v === selectedRounded;
              const isOriginal = v === original;
              const isNear = Math.abs(v - value) < 4.5;
              let h = 10;
              let w = 1;
              let alpha = 0.18;
              const rgb = isDark ? "255,255,255" : "7,9,10";
              if (isMajor) {
                h = 36;
                w = 1.5;
                alpha = isSelected ? 1 : isNear ? 0.55 : isDark ? 0.34 : 0.3;
              } else if (isMedium) {
                h = 20;
                w = 1;
                alpha = isSelected ? 0.92 : isNear ? 0.4 : isDark ? 0.24 : 0.22;
              } else {
                h = 10;
                w = 1;
                alpha = isSelected ? 0.72 : isDark ? 0.17 : 0.15;
              }
              if (isSelected && isMajor) alpha = 1;
              const tickBg = isSelected ? (isDark ? "rgba(255,255,255,1)" : "rgba(7,9,10,0.92)") : `rgba(${rgb},${alpha})`;
              const labelColor = isSelected
                ? isDark
                  ? "rgba(255,255,255,0.95)"
                  : "rgba(7,9,10,0.9)"
                : isNear
                  ? isDark
                    ? "rgba(255,255,255,0.44)"
                    : "rgba(7,9,10,0.44)"
                  : isDark
                    ? "rgba(255,255,255,0.28)"
                    : "rgba(7,9,10,0.32)";
              return (
                <div key={v} className="flex flex-col items-center shrink-0" style={{ width: KN, paddingTop: 0 }}>
                  <div
                    style={{
                      width: w,
                      height: h,
                      background: tickBg,
                      borderRadius: 999,
                      transition: "background 120ms, opacity 120ms",
                    }}
                  />
                  {isMajor && (
                    <span
                      className="mt-[10px] text-[11px] font-medium tabular-nums select-none"
                      style={{ color: labelColor, letterSpacing: "-0.01em", transition: "color 300ms ease" }}
                    >
                      {v}
                    </span>
                  )}
                  {isOriginal && !isMajor && (
                    <span
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: 999,
                        background: isDark ? "rgba(255,255,255,0.9)" : "rgba(7,9,10,0.9)",
                        marginTop: 6,
                        opacity: 0.9,
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* دکمه‌های ± */}
      <div className="w-full flex justify-center" style={{ marginTop: 28 }}>
        <div className="w-[280px] max-w-full flex justify-between items-center">
          <button
            type="button"
            aria-label="Decrease BPM"
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => startHold(e, -1)}
            onPointerUp={(e) => endHold(e, -1)}
            onPointerCancel={cancelHold}
            className="flex items-center justify-center select-none outline-none"
            style={{
              width: 64,
              height: 64,
              background: "transparent",
              border: "none",
              WebkitTapHighlightColor: "transparent",
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              cursor: "pointer",
              transition: "transform 120ms ease, opacity 150ms ease",
              transform: holdActive === "minus" ? "scale(0.9)" : "scale(1)",
              opacity: holdActive === "minus" ? 1 : 0.6,
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 300,
                lineHeight: 1,
                color: isDark ? "#FFFFFF" : "#07090A",
                fontFamily: "Vazirmatn, Inter, ui-sans-serif, system-ui, sans-serif",
                letterSpacing: "-0.02em",
                marginTop: -2,
                pointerEvents: "none",
              }}
            >
              −
            </span>
          </button>
          <button
            type="button"
            aria-label="Increase BPM"
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => startHold(e, 1)}
            onPointerUp={(e) => endHold(e, 1)}
            onPointerCancel={cancelHold}
            className="flex items-center justify-center select-none outline-none"
            style={{
              width: 64,
              height: 64,
              background: "transparent",
              border: "none",
              WebkitTapHighlightColor: "transparent",
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              cursor: "pointer",
              transition: "transform 120ms ease, opacity 150ms ease",
              transform: holdActive === "plus" ? "scale(0.9)" : "scale(1)",
              opacity: holdActive === "plus" ? 1 : 0.6,
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 300,
                lineHeight: 1,
                color: isDark ? "#FFFFFF" : "#07090A",
                fontFamily: "Vazirmatn, Inter, ui-sans-serif, system-ui, sans-serif",
                letterSpacing: "-0.02em",
                pointerEvents: "none",
              }}
            >
              +
            </span>
          </button>
        </div>
      </div>


    </div>
  );
};
