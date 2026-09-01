/**
 * PART: KeySheet - شیت Song Key (جراحی از Key-Control-Tempo-Style-BACKUP.html)
 * طراحی: هدر KEY + RESET / نمایش بزرگ گام با keyBump / پیانوی 7+5 کلید / دکمه‌های ♭♯ با long-press
 * معماری: LAB - Drawer (vaul) + tokens + motion + global.css keyBump
 */
import * as React from "react";
import { Theme, ThemeTokens, motion } from "../../../tokens";
import {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
} from "../../../molecules/Drawer/Drawer";
import { clamp } from "./ui";

export type KeySheetProps = {
  tokens: ThemeTokens;
  theme: Theme;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  minor: boolean;
  keyRoot: number;
  baseKeyRoot: number;
  onPitch: (semitones: number) => void;
};

const SHARP_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as const;
const FLAT_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"] as const;

const WHITE_KEYS = [
  { pc: 0, name: "C" },
  { pc: 2, name: "D" },
  { pc: 4, name: "E" },
  { pc: 5, name: "F" },
  { pc: 7, name: "G" },
  { pc: 9, name: "A" },
  { pc: 11, name: "B" },
] as const;

const BLACK_KEYS = [
  { pc: 1, n: 1 },
  { pc: 3, n: 2 },
  { pc: 6, n: 4 },
  { pc: 8, n: 5 },
  { pc: 10, n: 6 },
] as const;

export const KeySheet = ({ tokens: tk, theme, open, onOpenChange, minor, keyRoot, baseKeyRoot, onPitch }: KeySheetProps) => {
  const isDark = theme === "dark";
  const normalizedBase = ((baseKeyRoot % 12) + 12) % 12;
  const normalizedKey = ((keyRoot % 12) + 12) % 12;

  const [notation, setNotation] = React.useState<"sharp" | "flat">("sharp");
  const [bump, setBump] = React.useState(false);
  const holdTimeout = React.useRef<number | null>(null);
  const holdInterval = React.useRef<number | null>(null);

  const notes = notation === "sharp" ? SHARP_NOTES : FLAT_NOTES;
  const displayName = `${notes[normalizedKey]}${minor ? "m" : ""}`;

  const deltaRaw = (normalizedKey - normalizedBase + 12) % 12;
  const delta = deltaRaw > 6 ? deltaRaw - 12 : deltaRaw;
  const deltaLabel = delta === 0 ? "ORIGINAL" : `${delta > 0 ? `+${delta}` : `${delta}`} SEMITONE${Math.abs(delta) === 1 ? "" : "S"}`;

  React.useEffect(() => {
    setBump(true);
    const t = window.setTimeout(() => setBump(false), 180);
    return () => window.clearTimeout(t);
  }, [normalizedKey, notation]);

  const clearHold = React.useCallback(() => {
    if (holdTimeout.current) window.clearTimeout(holdTimeout.current);
    if (holdInterval.current) window.clearInterval(holdInterval.current);
    holdTimeout.current = null;
    holdInterval.current = null;
  }, []);

  React.useEffect(() => () => clearHold(), [clearHold]);

  const step = React.useCallback(
    (dir: -1 | 1) => {
      setNotation(dir === -1 ? "flat" : "sharp");
      const cur = delta;
      const next = clamp(cur + dir, -6, 6);
      onPitch(next);
    },
    [delta, onPitch]
  );

  const startHold = React.useCallback(
    (dir: -1 | 1) => {
      const doStep = () => step(dir);
      doStep();
      holdTimeout.current = window.setTimeout(() => {
        holdInterval.current = window.setInterval(doStep, 90);
      }, 300);
    },
    [step]
  );

  const handleWhiteKey = (pc: number) => {
    let d = pc - normalizedBase;
    if (d > 6) d -= 12;
    if (d < -6) d += 12;
    onPitch(clamp(d, -6, 6));
  };

  const handleBlackKey = (pc: number) => {
    let d = pc - normalizedBase;
    if (d > 6) d -= 12;
    if (d < -6) d += 12;
    onPitch(clamp(d, -6, 6));
  };

  const whiteKeyWidth = "(100% - 36px)/7";

  return (
    <Drawer tokens={tk} theme={theme} open={open} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <DrawerOverlay />
        <DrawerContent aria-label="Song Key" showHandle={false} style={{ maxWidth: 560, padding: "10px 0 18px 0", background: isDark ? "#07090A" : "#F8FAFC" }}>
          {/* هدر */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 24px 0 24px" }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.22em",
                color: isDark ? "#8A8F98" : "#9CA3AF",
              }}
            >
              KEY
            </span>
            <button
              onClick={() => {
                setNotation("sharp");
                onPitch(0);
              }}
              disabled={delta === 0}
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: "#0FB5B5",
                opacity: delta === 0 ? 0.32 : 1,
                pointerEvents: delta === 0 ? "none" : "auto",
                background: "none",
                border: "none",
                cursor: delta === 0 ? "default" : "pointer",
                transition: `opacity 300ms ${motion.easing.lux}`,
              }}
            >
              RESET
            </button>
          </div>

          {/* نمایش بزرگ */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 8, padding: "0 24px" }}>
            <div
              style={{
                fontSize: "clamp(96px, 27vw, 148px)",
                fontWeight: 800,
                lineHeight: 0.9,
                letterSpacing: "-0.02em",
                color: "#0FB5B5",
                fontFamily: "Inter, Vazirmatn, ui-sans-serif, system-ui, sans-serif",
                animation: bump ? "keyBump 180ms cubic-bezier(0.34,1.56,0.64,1)" : "none",
                transformOrigin: "center",
                willChange: "transform",
              }}
            >
              {displayName.replace("m", "")}
              {minor && (
                <span style={{ fontSize: "0.42em", verticalAlign: "super", marginLeft: 2, opacity: 0.95 }}>m</span>
              )}
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.18em",
                color: isDark ? "#8A8F98" : "#9CA3AF",
                transition: `color 300ms ${motion.easing.lux}`,
              }}
            >
              {deltaLabel}
            </div>
          </div>

          {/* پیانو */}
          <div style={{ position: "relative", width: "calc(100% - 40px)", height: 106, marginTop: 48, marginLeft: 20, marginRight: 20, borderRadius: 16 }}>
            <div style={{ display: "flex", gap: 6, height: "100%", width: "100%" }}>
              {WHITE_KEYS.map((k) => {
                const active = normalizedKey === k.pc;
                return (
                  <button
                    key={k.pc}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      handleWhiteKey(k.pc);
                    }}
                    aria-label={`Play ${k.name}`}
                    style={{
                      flex: 1,
                      height: "100%",
                      position: "relative",
                      borderRadius: 10,
                      border: "none",
                      backgroundColor: active ? "#0FB5B5" : "#FFFFFF",
                      boxShadow: active ? "0 6px 16px rgba(15,181,181,0.45)" : isDark ? "0 1px 0 rgba(255,255,255,0.06) inset" : "0 1px 3px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)",
                      transform: active ? "scale(1.02)" : "scale(1)",
                      transition: `all 200ms ${motion.easing.lux}`,
                      touchAction: "none",
                      cursor: "pointer",
                    }}
                  />
                );
              })}
            </div>
            {/* black keys overlay */}
            <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "60%", pointerEvents: "none" }}>
              {BLACK_KEYS.map((k) => {
                const active = normalizedKey === k.pc;
                const left = `calc(((${whiteKeyWidth}) + 6px)*${k.n} - (${whiteKeyWidth})*0.62/2)`;
                const width = `calc((${whiteKeyWidth})*0.62)`;
                const label = notes[k.pc];
                return (
                  <button
                    key={k.pc}
                    onPointerDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleBlackKey(k.pc);
                    }}
                    aria-label={`Play ${label}`}
                    style={{
                      position: "absolute",
                      top: 0,
                      left,
                      width,
                      height: "100%",
                      borderRadius: "2px 2px 8px 8px",
                      border: "none",
                      backgroundColor: active ? "#0FB5B5" : isDark ? "#0A0E12" : "#07090A",
                      boxShadow: active ? "0 6px 16px rgba(15,181,181,0.45)" : "0 4px 10px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.08) inset",
                      transform: active ? "scale(1.06)" : "scale(1)",
                      transition: `all 200ms ${motion.easing.lux}`,
                      pointerEvents: "auto",
                      touchAction: "none",
                      cursor: "pointer",
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* دکمه‌های ♭ ♯ با long-press */}
          <div style={{ width: 280, marginTop: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", alignSelf: "center" }}>
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                startHold(-1);
              }}
              onPointerUp={clearHold}
              onPointerLeave={clearHold}
              onPointerCancel={clearHold}
              aria-label="Flat -1 semitone"
              style={{
                width: 56,
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                border: "none",
                background: "transparent",
                fontSize: 34,
                lineHeight: 1,
                color: isDark ? "#E5E7EB" : "#111827",
                opacity: 0.6,
                touchAction: "none",
                fontWeight: 700,
                userSelect: "none",
                WebkitUserSelect: "none",
                cursor: "pointer",
                transition: `transform 150ms ${motion.easing.lux}`,
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <span style={{ transform: "translateY(-1px)" }}>♭</span>
            </button>
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                startHold(1);
              }}
              onPointerUp={clearHold}
              onPointerLeave={clearHold}
              onPointerCancel={clearHold}
              aria-label="Sharp +1 semitone"
              style={{
                width: 56,
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 999,
                border: "none",
                background: "transparent",
                fontSize: 34,
                lineHeight: 1,
                color: isDark ? "#E5E7EB" : "#111827",
                opacity: 0.6,
                touchAction: "none",
                fontWeight: 700,
                userSelect: "none",
                WebkitUserSelect: "none",
                cursor: "pointer",
                transition: `transform 150ms ${motion.easing.lux}`,
              }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <span style={{ transform: "translateY(-2px)" }}>♯</span>
            </button>
          </div>

          <div style={{ height: 8 }} />
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
};
