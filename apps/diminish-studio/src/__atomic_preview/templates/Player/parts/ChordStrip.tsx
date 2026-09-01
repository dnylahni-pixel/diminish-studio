/**
 * PART: ChordStrip - نوار آکورد بالا (بلوک‌های میزان؛ میزان فعلی سفید؛
 * بلوک قفل پرمیوم با تولتیپ "Unlock unlimited Chords") - اسکرول خودکار دنبال پخش
 */
import * as React from "react";
import { Theme, ThemeTokens, motion } from "../../../tokens";
import { LockIcon } from "./icons";

const BW = 72;
const GAP = 6;

export type ChordStripProps = {
  tokens: ThemeTokens;
  theme: Theme;
  count: number;
  activeBar: number;
  /** آکورد هر میزان یا null */
  chordAt: (bar: number) => string | null;
  /** ایندکس میزان قفل‌شده (پرمیوم) */
  lockedAt?: number | null;
};

export const ChordStrip = ({ tokens: tk, theme, count, activeBar, chordAt, lockedAt }: ChordStripProps) => {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const [offset, setOffset] = React.useState(0);
  const [lockTip, setLockTip] = React.useState(false);

  React.useEffect(() => {
    const w = wrapRef.current?.offsetWidth ?? 0;
    if (!w) return;
    const total = count * (BW + GAP);
    const raw = w / 2 - activeBar * (BW + GAP) - BW / 2;
    setOffset(Math.min(0, Math.max(w - total, raw)));
  }, [activeBar, count]);

  React.useEffect(() => {
    if (!lockTip) return;
    const t = window.setTimeout(() => setLockTip(false), 2400);
    return () => window.clearTimeout(t);
  }, [lockTip]);

  return (
    <div ref={wrapRef} style={{ position: "relative", overflow: "hidden", flexShrink: 0, padding: "2px 0 4px" }}>
      <div
        style={{
          display: "flex",
          gap: GAP,
          width: "max-content",
          transform: `translateX(${offset}px)`,
          transition: `transform 500ms ${motion.easing.lux}`,
          padding: "0 6px",
        }}
      >
        {Array.from({ length: count }, (_, bar) => {
          const locked = lockedAt === bar;
          const active = bar === activeBar;
          const chord = chordAt(bar);
          return (
            <div
              key={bar}
              onClick={() => locked && setLockTip(true)}
              style={{
                position: "relative",
                width: BW,
                height: 54,
                borderRadius: 10,
                flexShrink: 0,
                display: "grid",
                placeItems: "center",
                background: locked ? "rgba(120,120,128,0.28)" : active ? tk.textPrimary : "rgba(120,120,128,0.22)",
                color: active ? tk.app : tk.textMuted,
                fontSize: 15,
                fontWeight: 700,
                cursor: locked ? "pointer" : "default",
                transition: `background 300ms ${motion.easing.lux}, color 300ms ${motion.easing.lux}`,
                boxShadow: active ? `0 0 0 1.5px ${tk.accent}` : "none",
              }}
              aria-current={active ? "true" : undefined}
              aria-label={locked ? "Locked section" : chord ?? `Bar ${bar + 1}`}
            >
              {locked ? <LockIcon size={18} /> : chord}
              {locked && lockTip && (
                <span
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: tk.textPrimary,
                    color: tk.app,
                    fontSize: 12,
                    fontWeight: 650,
                    padding: "8px 14px",
                    borderRadius: 999,
                    whiteSpace: "nowrap",
                    zIndex: 40,
                    animation: "popIn 0.25s cubic-bezier(0.32,0.72,0,1)",
                  }}
                >
                  Unlock unlimited Chords
                </span>
              )}
            </div>
          );
        })}
      </div>
      {/* فید لبه‌ها */}
      <div aria-hidden style={{ position: "absolute", inset: "0 auto 0 0", width: 14, background: theme === "dark" ? "linear-gradient(90deg,#0E0E0E,transparent)" : "linear-gradient(90deg,#F5F5F5,transparent)", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", inset: "0 0 0 auto", width: 14, background: theme === "dark" ? "linear-gradient(270deg,#0E0E0E,transparent)" : "linear-gradient(270deg,#F5F5F5,transparent)", pointerEvents: "none" }} />
    </div>
  );
};
