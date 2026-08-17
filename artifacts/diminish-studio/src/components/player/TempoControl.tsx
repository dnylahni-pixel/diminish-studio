import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useSpring, useTransform } from "framer-motion";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── تنظیمات ────────────────────────────────────────────────────────────────
const BASE_BPM = 120; // بیس فرضی همه‌ی آهنگ‌ها
const MIN = 0.5;
const MAX = 1.5;
const STEP = 0.05;
const GAP_RESET_MS = 2200; // وقفه‌ی زیاد بین ضرب‌ها = شروعِ ضرب‌گیری تازه
const MAX_TAPS = 6;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

export function TempoControl({
  tempo,
  setTempo,
  resetIdle,
}: {
  tempo: number;
  setTempo: React.Dispatch<React.SetStateAction<number>>;
  resetIdle: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  const tapsRef = useRef<number[]>([]);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── عدد نرم: هر تغییری با فنر دنبال می‌شه ────────────────────────────────
  const sTempo = useSpring(tempo, { stiffness: 480, damping: 38, mass: 0.6 });
  useEffect(() => {
    sTempo.set(tempo);
  }, [tempo, sTempo]);
  const bpmText = useTransform(sTempo, (v) => String(Math.round(v * BASE_BPM)));

  // ── بستن با Escape ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => { if (clearTimer.current) clearTimeout(clearTimer.current); }, []);

  // ── ضرب‌گیری: تمپو از ریتم ضرب‌های کاربر درمیاد ───────────────────────────
  const registerTap = useCallback(() => {
    const now = performance.now();
    const taps = tapsRef.current;

    if (taps.length && now - taps[taps.length - 1] > GAP_RESET_MS) taps.length = 0;
    taps.push(now);
    if (taps.length > MAX_TAPS) taps.shift();
    setTapCount(taps.length);

    // بعد از وقفه، نقاط ضرب محو بشن
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setTapCount(0), GAP_RESET_MS);

    if (taps.length >= 2) {
      let sum = 0;
      for (let i = 1; i < taps.length; i++) sum += taps[i] - taps[i - 1];
      const avg = sum / (taps.length - 1);
      const tapped = 60000 / avg; // BPM ضرب‌زده‌شده توسط کاربر
      let next = clamp(tapped / BASE_BPM, MIN, MAX);
      if (Math.abs(next - 1) < 0.02) next = 1; // آهن‌ربای ملایم روی تمپوی اصلی
      setTempo(round2(next));
    }
    resetIdle();
  }, [setTempo, resetIdle]);

  const step = useCallback(
    (dir: number) => {
      setTempo((p) => clamp(round2(p + dir * STEP), MIN, MAX));
      resetIdle();
    },
    [setTempo, resetIdle],
  );

  const sheet = (
    <>
      <motion.div
        key="scrim"
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onPointerDown={() => setOpen(false)}
      />

      <motion.div
        key="sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 380, damping: 40 }}
        onPan={(_, info) => info.offset.y > 24 && setOpen(false)}
        className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-sm rounded-t-3xl border-t border-border bg-card px-6 pt-2.5 shadow-2xl"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
        role="dialog"
        aria-label="تنظیم تمپو"
        data-testid="tempo-drawer"
      >
        {/* دستگیره + سربرگ */}
        <div className="mx-auto mb-3 h-1 w-9 rounded-full bg-border" />
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">تمپو</span>
          <AnimatePresence>
            {tempo !== 1 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                transition={{ type: "spring", stiffness: 500, damping: 28 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => setTempo(1)}
                className="rounded-full px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                data-testid="btn-tempo-reset"
              >
                ریست
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* پد ضرب‌گیری */}
        <div className="relative mx-auto mt-4 aspect-square w-[min(62vw,212px)] select-none">
          {tapCount > 0 && (
            <motion.span
              key={tapCount}
              className="absolute inset-0 rounded-full border-2 border-primary"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.32, opacity: 0 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            />
          )}

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={registerTap}
            className="relative flex h-full w-full flex-col items-center justify-center rounded-full border border-border bg-gradient-to-b from-background to-muted/50 touch-none"
            aria-label="ضرب بزن تا تمپو گرفته بشه"
            data-testid="tempo-tap-pad"
          >
            <motion.span className="text-[54px] font-bold leading-none tabular-nums tracking-tight">
              {bpmText}
            </motion.span>
            <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/60">
              BPM
            </span>

            {/* نقاط ضرب‌های گرفته‌شده */}
            <div className="mt-3.5 flex items-center gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors duration-200",
                    i < Math.min(tapCount, 4) ? "bg-primary" : "bg-border",
                  )}
                />
              ))}
            </div>
          </motion.button>
        </div>

        <p className="mt-3 text-center text-[11px] text-muted-foreground/60">
          برای گرفتن تمپو، به ریتم روی دایره ضرب بزن
        </p>

        {/* تنظیم دقیق */}
        <div className="mt-3.5 flex items-center justify-center gap-5">
          <button
            aria-label="کندتر"
            onClick={() => step(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-90"
            data-testid="btn-tempo-minus"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span
            className={cn(
              "w-14 text-center text-sm font-semibold tabular-nums",
              tempo === 1 ? "text-muted-foreground/70" : "text-primary",
            )}
          >
            {tempo === 1 ? "1×" : `×${round2(tempo)}`}
          </span>
          <button
            aria-label="تندتر"
            onClick={() => step(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-90"
            data-testid="btn-tempo-plus"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </>
  );

  return (
    <>
      {/* چیپ جمع‌شده — برچسبش موقع تغییر، نسبت رو نشون می‌ده */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen(true)}
        className="flex h-12 w-14 flex-col items-center justify-center rounded-2xl transition-colors hover:bg-muted/50"
        aria-label="تنظیم تمپو"
        data-testid="btn-tempo"
      >
        <span className="text-base font-bold leading-none tabular-nums">
          {Math.round(BASE_BPM * tempo)}
        </span>
        <span
          className={cn(
            "mt-1 text-[9px] font-semibold uppercase tracking-[0.18em]",
            tempo === 1 ? "text-muted-foreground/50" : "text-primary",
          )}
        >
          {tempo === 1 ? "BPM" : `×${round2(tempo)}`}
        </span>
      </motion.button>

      {open && createPortal(
        <AnimatePresence>{sheet}</AnimatePresence>,
        document.body,
      )}
    </>
  );
}
