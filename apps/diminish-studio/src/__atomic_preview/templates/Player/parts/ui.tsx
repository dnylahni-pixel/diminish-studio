/**
 * PARTS: اجزای کوچک مشترک پلیر - Switch / Seg / Marquee / کمکی‌های موزیکال
 */
import * as React from "react";
import { ThemeTokens, motion } from "../../../tokens";

/* ---------- Switch (سوییچ سفید Moises) ---------- */
export const Switch = ({ checked, onChange, tokens: tk, label }: { checked: boolean; onChange: (v: boolean) => void; tokens: ThemeTokens; label: string }) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={() => onChange(!checked)}
    style={{
      width: 52,
      height: 30,
      borderRadius: 999,
      border: "none",
      cursor: "pointer",
      padding: 3,
      display: "flex",
      alignItems: "center",
      flexShrink: 0,
      background: checked ? tk.textPrimary : "rgba(120,120,128,0.32)",
      transition: `background 300ms ${motion.easing.lux}`,
    }}
  >
    <span
      style={{
        width: 24,
        height: 24,
        borderRadius: 999,
        background: checked ? tk.app : "#fff",
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
        transform: checked ? "translateX(22px)" : "translateX(0)",
        transition: `transform 400ms ${motion.easing.lux}, background 300ms ${motion.easing.lux}`,
      }}
    />
  </button>
);

/* ---------- Segmented (Active = قرص سفید مثل شیت مترونوم) ---------- */
export const Seg = <T extends string | number>({ options, value, onChange, tokens: tk, filled = true }: { options: { v: T; label: string }[]; value: T; onChange: (v: T) => void; tokens: ThemeTokens; filled?: boolean }) => (
  <div style={{ display: "flex", gap: 8 }}>
    {options.map((o) => {
      const active = o.v === value;
      return (
        <button
          key={String(o.v)}
          onClick={() => onChange(o.v)}
          style={{
            flex: 1,
            height: 42,
            borderRadius: 999,
            border: "none",
            background: active ? (filled ? tk.textPrimary : tk.activeBg) : "rgba(120,120,128,0.22)",
            color: active ? (filled ? tk.app : tk.textPrimary) : tk.textPrimary,
            fontSize: 13.5,
            fontWeight: 600,
            cursor: "pointer",
            transition: `all 300ms ${motion.easing.lux}`,
          }}
        >
          {o.label}
        </button>
      );
    })}
  </div>
);

/* ---------- Marquee (عنوان طولانی که می‌غرد) ---------- */
export const Marquee = ({ text, tokens: tk, fontSize = 17 }: { text: string; tokens: ThemeTokens; fontSize?: number }) => {
  const long = text.length > 26;
  return (
    <div style={{ overflow: "hidden", flex: 1, minWidth: 0, maskImage: long ? "linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)" : undefined, WebkitMaskImage: long ? "linear-gradient(90deg,transparent,#000 6%,#000 94%,transparent)" : undefined }}>
      <div
        className={long ? "marquee-inner" : undefined}
        style={{
          display: "flex",
          gap: 56,
          width: "max-content",
          whiteSpace: "nowrap",
          color: tk.textPrimary,
          fontSize,
          fontWeight: 700,
          letterSpacing: "-0.01em",
        }}
      >
        <span>{text}</span>
        {long && <span aria-hidden>{text}</span>}
      </div>
    </div>
  );
};

/* ---------- کمکی‌های موزیکال ---------- */
export const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** نام تمپو بر اساس BPM (Largo...Presto) */
export const tempoName = (bpm: number) => {
  if (bpm < 55) return "Larghissimo";
  if (bpm < 70) return "Largo";
  if (bpm < 82) return "Adagio";
  if (bpm < 100) return "Andante";
  if (bpm < 116) return "Moderato";
  if (bpm < 140) return "Allegro";
  if (bpm < 164) return "Vivace";
  if (bpm < 184) return "Presto";
  return "Prestissimo";
};

/** نام گام */
export const keyNameOf = (root: number, minor: boolean) => `${NOTES[((root % 12) + 12) % 12]}${minor ? "m" : ""}`;
