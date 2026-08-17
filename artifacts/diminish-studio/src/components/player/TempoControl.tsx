import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useSpring,
  useTransform,
} from "framer-motion";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────
const MIN = 0.5;
const MAX = 1.5;
const SNAPS = [0.5, 0.75, 0.9, 1, 1.1, 1.25, 1.5];
const PRESETS = [0.5, 0.75, 1, 1.25, 1.5];

// Dial geometry — 240×240 viewBox, y-axis points down
const C = 120;
const R = 96;
const A0 = 135; // gauge starts bottom-left…
const SWEEP = 270; // …and travels clockwise to bottom-right

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

const tempoToAngle = (t: number) => A0 + ((t - MIN) / (MAX - MIN)) * SWEEP;
const polar = (angle: number, r: number) => ({
  x: C + r * Math.cos((angle * Math.PI) / 180),
  y: C + r * Math.sin((angle * Math.PI) / 180),
});

function arcPath(startDeg: number, endDeg: number, r: number) {
  const sweep = endDeg - startDeg;
  if (sweep <= 0.4) return "";
  const a = polar(startDeg, r);
  const b = polar(endDeg, r);
  const large = sweep > 180 ? 1 : 0;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

// magnetic snap: اگر مقدار به یکی از نقاط موسیقایی نزدیک باشه، بچسبه بهش
const magnet = (t: number) => {
  for (const s of SNAPS) if (Math.abs(t - s) < 0.022) return s;
  return round2(t);
};

const ratioLabel = (t: number) => (t === 1 ? "1×" : `${round2(t)}×`);

// ─── Static dial furniture (ticks + labels) ──────────────────────────────────
function DialTicks() {
  const ticks: React.ReactNode[] = [];
  const oneAngle = tempoToAngle(1);
  for (let a = A0; a <= A0 + SWEEP + 0.01; a += 10) {
    const isOne = Math.abs(a - oneAngle) < 1;
    const isSnap = !isOne && SNAPS.some((s) => Math.abs(tempoToAngle(s) - a) < 1);
    const p1 = polar(a, isSnap || isOne ? 101 : 104.5);
    const p2 = polar(a, isSnap || isOne ? 113 : 110);
    ticks.push(
      <line
        key={a}
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        strokeLinecap="round"
        strokeWidth={isOne ? 2.2 : isSnap ? 1.5 : 1}
        className={
          isOne
            ? "stroke-primary"
            : isSnap
              ? "stroke-muted-foreground/45"
              : "stroke-muted-foreground/20"
        }
      />,
    );
  }
  const label = (a: number, txt: string, anchor: "start" | "middle" | "end") => {
    const p = polar(a, 72);
    return (
      <text
        x={p.x}
        y={p.y + 3}
        textAnchor={anchor}
        className="fill-muted-foreground/55 text-[9px] font-semibold"
      >
        {txt}
      </text>
    );
  };
  return (
    <g>
      {ticks}
      {label(A0, "0.5×", "end")}
      {label(tempoToAngle(1), "1×", "middle")}
      {label(A0 + SWEEP, "1.5×", "start")}
    </g>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export function TempoControl({
  bpm,
  tempo,
  setTempo,
  resetIdle,
}: {
  bpm: number;
  tempo: number;
  setTempo: React.Dispatch<React.SetStateAction<number>>;
  resetIdle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draggingChip, setDraggingChip] = useState(false);

  const hasBpm = Number.isFinite(bpm) && bpm > 0;
  const pct = Math.round((tempo - 1) * 100);
  const pos = (tempo - MIN) / (MAX - MIN); // 0..1 across the micro-track

  // ── spring: همه‌ی نمایش‌های عددی و قوس رو نرم دنبال می‌کنه ──────────────
  const sTempo = useSpring(tempo, { stiffness: 480, damping: 38, mass: 0.6 });
  useEffect(() => {
    sTempo.set(tempo);
  }, [tempo, sTempo]);

  const arc = useTransform(sTempo, (v) => arcPath(A0, tempoToAngle(v), R));
  const knobX = useTransform(sTempo, (v) => polar(tempoToAngle(v), R).x);
  const knobY = useTransform(sTempo, (v) => polar(tempoToAngle(v), R).y);
  const bigText = useTransform(sTempo, (v) =>
    hasBpm ? String(Math.round(v * bpm)) : `${Math.round(v * 100)}%`,
  );

  // ── popover close: Escape ─────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // ── dial drag: هر نقطه‌ای از صفحه‌ی دیال، زاویه‌ی اشاره‌گر رو می‌خونه ────
  const dialRef = useRef<HTMLDivElement>(null);
  const dialDrag = useRef(false);

  const dialPoint = useCallback(
    (e: React.PointerEvent) => {
      const el = dialRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scale = 240 / rect.width;
      const x = (e.clientX - rect.left) * scale - C;
      const y = (e.clientY - rect.top) * scale - C;
      let rel = (Math.atan2(y, x) * 180) / Math.PI - A0;
      while (rel < 0) rel += 360;
      let t: number;
      if (rel > SWEEP) {
        t = rel < SWEEP + 45 ? MAX : MIN; // ناحیه‌ی مرده پایین: بچسب به نزدیک‌ترین سر
      } else {
        t = MIN + (rel / SWEEP) * (MAX - MIN);
      }
      setTempo(magnet(clamp(t, MIN, MAX)));
    },
    [setTempo],
  );

  // ── chip gesture: تپ = باز کردن دیال، درگ عمودی = تنظیم سریع ─────────────
  const chipGesture = useRef({ y: 0, t0: 1, mode: "tap" as "tap" | "drag", active: false });

  const onChipDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    chipGesture.current = { y: e.clientY, t0: tempo, mode: "tap", active: true };
  };
  const onChipMove = (e: React.PointerEvent) => {
    const g = chipGesture.current;
    if (!g.active) return;
    const dy = g.y - e.clientY;
    if (g.mode === "tap" && Math.abs(dy) > 5) {
      g.mode = "drag";
      setDraggingChip(true);
    }
    if (g.mode === "drag") {
      setTempo(clamp(round2(g.t0 + Math.round(dy / 6) * 0.05), MIN, MAX));
    }
    resetIdle();
  };
  const onChipUp = () => {
    const g = chipGesture.current;
    g.active = false;
    setDraggingChip(false);
    if (g.mode === "tap") setOpen((o) => !o);
  };

  // ── fine steppers: نگه‌داشتن = تکرار ──────────────────────────────────────
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdInt = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopHold = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (holdInt.current) clearInterval(holdInt.current);
    holdTimer.current = holdInt.current = null;
  }, []);
  useEffect(() => stopHold, [stopHold]);

  const stepBy = useCallback(
    (dir: number) => setTempo((p) => clamp(round2(p + dir * 0.01), MIN, MAX)),
    [setTempo],
  );
  const startHold = useCallback(
    (dir: number) => {
      stopHold();
      stepBy(dir);
      holdTimer.current = setTimeout(() => {
        holdInt.current = setInterval(() => stepBy(dir), 70);
      }, 340);
    },
    [stepBy, stopHold],
  );

  const chipTouched = tempo !== 1 || draggingChip;

  return (
    <>
      {/* ═══ Collapsed chip ═══ */}
      <motion.div
        whileTap={{ scale: 0.93 }}
        className={cn(
          "relative flex h-12 w-[58px] cursor-pointer select-none flex-col items-center justify-center rounded-2xl border touch-none transition-colors duration-200",
          chipTouched
            ? "border-primary/50 bg-primary/10"
            : "border-transparent hover:border-border/60",
        )}
        onPointerDown={onChipDown}
        onPointerMove={onChipMove}
        onPointerUp={onChipUp}
        onPointerCancel={onChipUp}
        onContextMenu={(e) => e.preventDefault()}
        data-testid="drag-tempo"
        role="button"
        aria-label="تنظیم تمپو"
      >
        <span className="text-[15px] font-bold leading-none tabular-nums">
          {hasBpm ? Math.round(bpm * tempo) : ratioLabel(tempo)}
        </span>
        <span className="mt-1 text-[8px] font-semibold uppercase leading-none tracking-[0.18em] text-muted-foreground/55">
          {hasBpm ? "BPM" : "TEMPO"}
        </span>

        {/* micro position track — نقطه‌ی وسط یعنی تمپوی اصلی آهنگ */}
        <div className="relative mt-1.5 h-[3px] w-8 rounded-full bg-border/80">
          <div className="absolute left-1/2 top-1/2 h-[7px] w-[1.5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-muted-foreground/45" />
          <div
            className="absolute top-0 bottom-0 rounded-full bg-primary"
            style={
              pos >= 0.5
                ? { left: "50%", width: `${(pos - 0.5) * 100}%` }
                : { left: `${pos * 100}%`, width: `${(0.5 - pos) * 100}%` }
            }
          />
          <div
            className="absolute top-1/2 h-[7px] w-[7px] -translate-y-1/2 rounded-full bg-primary shadow-sm ring-2 ring-card"
            style={{ left: `calc(${pos * 100}% - 3.5px)` }}
          />
        </div>

        {/* percent bubble */}
        <AnimatePresence>
          {tempo !== 1 && !draggingChip && (
            <motion.span
              key="pct"
              initial={{ opacity: 0, scale: 0.5, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.5, y: 4 }}
              transition={{ type: "spring", stiffness: 500, damping: 26 }}
              className="absolute -top-1.5 -right-1 rounded-full bg-primary px-1 py-px text-[8px] font-bold leading-tight tabular-nums text-primary-foreground shadow"
            >
              {pct > 0 ? `+${pct}%` : `${pct}%`}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══ Expanded radial dial ═══ */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="scrim"
              className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onPointerDown={() => setOpen(false)}
            />

            <div
              className="pointer-events-none absolute inset-x-0 bottom-full z-50 flex justify-center pb-2.5"
            >
              <motion.div
                initial={{ opacity: 0, y: 16, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.94, transition: { duration: 0.14 } }}
                transition={{ type: "spring", stiffness: 380, damping: 28 }}
                className="pointer-events-auto w-[min(320px,calc(100vw-20px))] rounded-3xl border border-border/60 bg-card/95 p-4 shadow-2xl backdrop-blur-xl"
                role="dialog"
                aria-label="تنظیم تمپو"
                data-testid="tempo-popover"
              >
                {/* header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                    Tempo
                  </span>
                  <AnimatePresence>
                    {tempo !== 1 && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ type: "spring", stiffness: 500, damping: 28 }}
                        whileTap={{ scale: 0.85 }}
                        onClick={() => setTempo(1)}
                        className="flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        data-testid="btn-tempo-reset"
                      >
                        <RotateCcw className="h-3 w-3" />
                        ریست
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

                {/* dial + fine steppers */}
                <div className="relative mt-2 flex items-center justify-center">
                  <div
                    ref={dialRef}
                    className="relative aspect-square w-full max-w-[220px] cursor-grab touch-none select-none active:cursor-grabbing"
                    onPointerDown={(e) => {
                      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                      dialDrag.current = true;
                      dialPoint(e);
                      resetIdle();
                    }}
                    onPointerMove={(e) => {
                      if (dialDrag.current) dialPoint(e);
                    }}
                    onPointerUp={() => (dialDrag.current = false)}
                    onPointerCancel={() => (dialDrag.current = false)}
                    onContextMenu={(e) => e.preventDefault()}
                    data-testid="tempo-dial"
                  >
                    <svg viewBox="0 0 240 240" className="h-full w-full overflow-visible">
                      <defs>
                        <filter id="tempoGlow" x="-60%" y="-60%" width="220%" height="220%">
                          <feGaussianBlur stdDeviation="5" />
                        </filter>
                      </defs>

                      {/* track */}
                      <path
                        d={arcPath(A0, A0 + SWEEP, R)}
                        fill="none"
                        strokeWidth={4}
                        strokeLinecap="round"
                        className="stroke-border opacity-60"
                      />

                      <DialTicks />

                      {/* progress: لایه‌ی درخشان زیرین + قوس اصلی */}
                      <motion.path
                        d={arc}
                        fill="none"
                        strokeWidth={9}
                        strokeLinecap="round"
                        className="stroke-primary"
                        opacity={0.22}
                        filter="url(#tempoGlow)"
                      />
                      <motion.path
                        d={arc}
                        fill="none"
                        strokeWidth={4.5}
                        strokeLinecap="round"
                        className="stroke-primary"
                      />

                      {/* knob */}
                      <motion.circle cx={knobX} cy={knobY} r={13} className="fill-primary" opacity={0.2} filter="url(#tempoGlow)" />
                      <motion.circle cx={knobX} cy={knobY} r={8} className="fill-card stroke-primary" strokeWidth={2.5} />
                      <motion.circle cx={knobX} cy={knobY} r={2.6} className="fill-primary" />
                    </svg>
                  </div>

                  {/* fine steppers */}
                  <button
                    aria-label="کندتر"
                    className="absolute left-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-90"
                    onPointerDown={() => startHold(-1)}
                    onPointerUp={stopHold}
                    onPointerLeave={stopHold}
                    onPointerCancel={stopHold}
                    data-testid="btn-tempo-minus"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    aria-label="تندتر"
                    className="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border/60 bg-background/60 text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-90"
                    onPointerDown={() => startHold(1)}
                    onPointerUp={stopHold}
                    onPointerLeave={stopHold}
                    onPointerCancel={stopHold}
                    data-testid="btn-tempo-plus"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* presets */}
                <div className="mt-1 flex items-center justify-center gap-1 rounded-full bg-muted/50 p-1">
                  {PRESETS.map((p) => {
                    const active = tempo === p;
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          setTempo(p);
                          resetIdle();
                        }}
                        className={cn(
                          "relative rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums transition-colors",
                          active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                        )}
                        data-testid={`btn-tempo-preset-${p}`}
                      >
                        {active && (
                          <motion.span
                            layoutId="tempoPresetPill"
                            className="absolute inset-0 rounded-full border border-primary/30 bg-primary/15"
                            transition={{ type: "spring", stiffness: 500, damping: 35 }}
                          />
                        )}
                        <span className="relative">{ratioLabel(p)}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
