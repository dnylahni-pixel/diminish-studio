/**
 * PART: StemMixer - ردیف‌های استم سبک Moises
 * آیکون (کلیک = Mute، حالت Mute آیکون خط‌خورده و کم‌رنگ) + اسلایدر نازک + «...»
 * با حباب درصد حین درگ و لیبل زیر ردیف فعال؛ «...» پاپ‌اور شیشه‌ای (L & R / Export)
 */
import * as React from "react";
import { Theme, ThemeTokens, motion } from "../../../tokens";
import { Slider } from "../../../molecules/Slider/Slider";
import { Ico, MicIcon, DrumsIcon, GuitarIcon, BassIcon, PianoIcon, StringsIcon, MoreIcon, HeadphonesIcon, ExportIcon, SparkIcon } from "./icons";

export type StemId = "vocals" | "drums" | "guitar" | "bass" | "piano" | "strings";
export type StemState = { volume: number; pan: number; muted: boolean };

export const STEMS: { id: StemId; label: string; Icon: React.FC<{ size?: number }>; ai?: boolean }[] = [
  { id: "vocals", label: "Vocals", Icon: MicIcon },
  { id: "drums", label: "Drums", Icon: DrumsIcon },
  { id: "guitar", label: "Guitar", Icon: GuitarIcon },
  { id: "bass", label: "Bass", Icon: BassIcon },
  { id: "piano", label: "Piano", Icon: PianoIcon, ai: true },
  { id: "strings", label: "Strings", Icon: StringsIcon, ai: true },
];

export const defaultStems = (): Record<StemId, StemState> =>
  Object.fromEntries(STEMS.map((s) => [s.id, { volume: s.id === "drums" || s.id === "guitar" ? 65 : 0, pan: 0, muted: false }])) as Record<StemId, StemState>;

export type StemMixerProps = {
  tokens: ThemeTokens;
  theme: Theme;
  stems: Record<StemId, StemState>;
  onStems: (next: Record<StemId, StemState>) => void;
  /** کلید استمی که شیت L&R برای آن باز است */
  onLR: (id: StemId) => void;
  onExport: (id: StemId) => void;
};

export const StemMixer = ({ tokens: tk, stems, onStems, onLR, onExport }: StemMixerProps) => {
  const [menuFor, setMenuFor] = React.useState<StemId | null>(null);
  const [dragFor, setDragFor] = React.useState<StemId | null>(null);

  const update = (id: StemId, patch: Partial<StemState>) => onStems({ ...stems, [id]: { ...stems[id], ...patch } });

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {STEMS.map((s, i) => {
        const st = stems[s.id];
        const dimmed = st.muted || st.volume === 0;
        return (
          <div
            key={`${s.id}-${st.volume}-${st.muted}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "7px 18px",
              animation: `fadeUp 0.45s cubic-bezier(0.32,0.72,0,1) ${i * 60}ms backwards`,
            }}
          >
            {/* آیکون + کلیک Mute */}
            <button
              onClick={() => update(s.id, { muted: !st.muted })}
              aria-label={st.muted ? `Unmute ${s.label}` : `Mute ${s.label}`}
              aria-pressed={st.muted}
              title={st.muted ? "Unmute" : "Mute"}
              style={{
                position: "relative",
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: 12,
                border: "none",
                background: "transparent",
                color: dimmed ? tk.textMuted : tk.textPrimary,
                opacity: dimmed ? 0.55 : 1,
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                transition: `color 300ms ${motion.easing.lux}, opacity 300ms ${motion.easing.lux}`,
              }}
            >
              <s.Icon />
              {s.ai && (
                <span style={{ position: "absolute", top: 2, left: 2, color: dimmed ? tk.textMuted : tk.textPrimary, display: "flex", opacity: 0.9 }}>
                  <SparkIcon size={11} />
                </span>
              )}
              {st.muted && (
                <span aria-hidden style={{ position: "absolute", width: 26, height: 1.6, background: tk.textMuted, transform: "rotate(-45deg)", borderRadius: 2 }} />
              )}
            </button>

            {/* اسلایدر + لیبل حین درگ */}
            <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
              <Slider
                tokens={tk}
                bare
                ariaLabel={`${s.label} volume`}
                value={st.volume}
                min={0}
                max={100}
                onChange={(v) => update(s.id, { volume: v })}
                formatValue={(v) => `${Math.round(v)}%`}
                onDragStateChange={(d) => setDragFor(d ? s.id : null)}
              />
              <div
                style={{
                  height: 20,
                  fontSize: 13,
                  fontWeight: 500,
                  color: tk.textPrimary,
                  opacity: dragFor === s.id ? 1 : 0,
                  transform: dragFor === s.id ? "translateY(0)" : "translateY(-4px)",
                  transition: `opacity 250ms ${motion.easing.lux}, transform 250ms ${motion.easing.lux}`,
                }}
              >
                {s.label}
              </div>
            </div>

            {/* منوی سه‌نقطه */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={() => setMenuFor(menuFor === s.id ? null : s.id)}
                aria-label={`${s.label} options`}
                aria-haspopup="menu"
                aria-expanded={menuFor === s.id}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 999,
                  border: "none",
                  background: "transparent",
                  color: menuFor === s.id ? tk.accent : tk.textMuted,
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  transition: `color 250ms ${motion.easing.lux}`,
                }}
              >
                <MoreIcon size={17} />
              </button>
              {menuFor === s.id && (
                <>
                  <div style={{ position: "fixed", inset: 0, zIndex: 58 }} onClick={() => setMenuFor(null)} />
                  <div
                    role="menu"
                    style={{
                      position: "absolute",
                      right: 6,
                      top: "calc(100% + 6px)",
                      zIndex: 59,
                      minWidth: 200,
                      borderRadius: 18,
                      background: "rgba(44,44,48,0.92)",
                      backdropFilter: "blur(24px)",
                      WebkitBackdropFilter: "blur(24px)",
                      border: `1px solid ${tk.borderColor}`,
                      boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
                      padding: 6,
                      animation: "menuIn 0.25s cubic-bezier(0.32,0.72,0,1)",
                    }}
                  >
                    <button
                      role="menuitem"
                      onClick={() => { setMenuFor(null); onLR(s.id); }}
                      style={popItem(tk)}
                    >
                      <span style={{ display: "flex", color: tk.textPrimary }}><HeadphonesIcon /></span>
                      L &amp; R
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => { setMenuFor(null); onExport(s.id); }}
                      style={popItem(tk)}
                    >
                      <span style={{ display: "flex", color: tk.textPrimary }}><ExportIcon /></span>
                      Export
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const popItem = (tk: ThemeTokens): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  gap: 14,
  width: "100%",
  padding: "0 14px",
  height: 46,
  borderRadius: 12,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 550,
  color: tk.textPrimary,
  transition: `background 200ms ${motion.easing.lux}`,
});
