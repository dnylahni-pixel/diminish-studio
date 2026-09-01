/**
 * PART: SectionsView - نمای سکشن‌ها (شبکه میزان‌ها با شماره، بلوک آکورد سفید فعال،
 * قطعه lyrics زیر هر سکشن) + چیپس سکشن‌ها (Intro/Verse/Chorus + قفل More Sections)
 */
import * as React from "react";
import { Theme, ThemeTokens, motion } from "../../../tokens";
import { LockIcon } from "./icons";

export type SongSection = {
  label: string;
  bars: number;
  chord: string | null;
  lyric?: string;
  locked?: boolean;
};

export type SectionsViewProps = {
  tokens: ThemeTokens;
  theme: Theme;
  sections: SongSection[];
  /** ایندکس سکشن فعلی */
  activeSection: number;
  /** شماره میزان مطلق فعلی (0-based) */
  activeBar: number;
  onSeekSection: (sectionIndex: number) => void;
};

const BW = 72;
const GAP = 6;

export const SectionsView = ({ tokens: tk, theme, sections, activeSection, activeBar, onSeekSection }: SectionsViewProps) => {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const secRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    const box = boxRef.current;
    const el = secRefs.current[activeSection];
    if (!box || !el) return;
    box.scrollTo({ top: Math.max(0, el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2), behavior: "smooth" });
  }, [activeSection]);

  let barCursor = 0;

  return (
    <div
      ref={boxRef}
      style={{
        flex: 1,
        minHeight: 220,
        overflowY: "auto",
        scrollbarWidth: "none",
        padding: "10px 20px 30px 20px",
      }}
    >
      {sections.map((sec, si) => {
        const startBar = barCursor;
        barCursor += sec.bars;
        const rows: number[] = Array.from({ length: Math.ceil(sec.bars / 4) }, (_, r) => r);
        const isActiveSec = si === activeSection;
        return (
          <div
            key={si}
            ref={(el) => {
              secRefs.current[si] = el;
            }}
            style={{ marginBottom: 26, opacity: sec.locked ? 0.55 : 1 }}
          >
            {/* شماره میزان شروع سکشن */}
            <div style={{ fontSize: 12, fontFamily: "ui-monospace, monospace", color: tk.textMuted, marginBottom: 6, direction: "ltr", textAlign: "left" }}>
              {startBar + 1}
            </div>
            {rows.map((r) => (
              <div key={r} style={{ display: "flex", gap: GAP, marginBottom: GAP }}>
                {Array.from({ length: Math.min(4, sec.bars - r * 4) }, (_, c) => {
                  const bar = startBar + r * 4 + c;
                  const firstOfSec = bar === startBar;
                  const active = bar === activeBar && !sec.locked;
                  return (
                    <div
                      key={c}
                      onClick={() => !sec.locked && onSeekSection(si)}
                      style={{
                        width: Math.min(BW, `calc((100% - ${3 * GAP}px) / 4)` as unknown as number),
                        flex: 1,
                        height: 54,
                        borderRadius: 10,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 16,
                        fontWeight: 700,
                        cursor: sec.locked ? "default" : "pointer",
                        background: sec.locked ? "rgba(120,120,128,0.18)" : active ? tk.textPrimary : isActiveSec ? "rgba(120,120,128,0.30)" : "rgba(120,120,128,0.20)",
                        color: active ? tk.app : tk.textMuted,
                        boxShadow: active ? `0 0 0 1.5px ${tk.accent}` : firstOfSec && !sec.locked ? `inset 2.5px 0 0 ${theme === "dark" ? "#fff" : "#000"}` : "none",
                        transition: `background 300ms ${motion.easing.lux}, color 300ms ${motion.easing.lux}`,
                      }}
                    >
                      {sec.locked ? <LockIcon size={16} /> : firstOfSec ? sec.chord : ""}
                    </div>
                  );
                })}
              </div>
            ))}
            {sec.lyric && (
              <div style={{ textAlign: "center", fontFamily: "Vazirmatn, Inter, sans-serif", fontSize: 16, color: tk.textPrimary, opacity: isActiveSec ? 0.95 : 0.4, marginTop: 8, transition: `opacity 400ms ${motion.easing.lux}` }}>
                {sec.lyric}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ---------- چیپس سکشن‌ها (بالای نوار پیشرفت) ---------- */
export type SectionChipsProps = {
  tokens: ThemeTokens;
  sections: SongSection[];
  activeSection: number;
  onSeekSection: (i: number) => void;
  onLocked: () => void;
};

export const SectionChips = ({ tokens: tk, sections, activeSection, onSeekSection, onLocked }: SectionChipsProps) => {
  const [tip, setTip] = React.useState(false);
  React.useEffect(() => {
    if (!tip) return;
    const t = window.setTimeout(() => setTip(false), 2200);
    return () => window.clearTimeout(t);
  }, [tip]);

  return (
    <div style={{ position: "relative", display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none", padding: "2px 20px", flexShrink: 0 }}>
      {sections.slice(0, 4).map((sec, i) => {
        const active = i === activeSection;
        return (
          <button
            key={i}
            onClick={() => onSeekSection(i)}
            style={{
              flexShrink: 0,
              height: 40,
              padding: "0 18px",
              borderRadius: 12,
              border: `1.5px solid ${active ? tk.textPrimary : tk.borderColor}`,
              background: active ? "rgba(120,120,128,0.30)" : "transparent",
              color: tk.textPrimary,
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
              transition: `all 300ms ${motion.easing.lux}`,
            }}
          >
            {sec.label}
          </button>
        );
      })}
      <button
        onClick={() => setTip(true)}
        style={{
          flexShrink: 0,
          height: 40,
          padding: "0 16px",
          borderRadius: 12,
          border: `1.5px solid ${tk.borderColor}`,
          background: "transparent",
          color: tk.textMuted,
          fontSize: 13.5,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
        }}
      >
        <LockIcon size={15} />
        More Sections
      </button>
      {tip && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            right: 24,
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
          Unlock unlimited Sections
        </span>
      )}
    </div>
  );
};
