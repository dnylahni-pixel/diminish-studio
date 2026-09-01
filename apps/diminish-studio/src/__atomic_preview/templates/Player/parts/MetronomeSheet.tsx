/**
 * PART: MetronomeSheet - شیت Tempo تمیز (پورت از Tempo-Control-Clean.html)
 * + سوئیچ ساده Smart Metronome که دراور دوم (صدادار) را روی همین دراور باز می‌کند
 * معماری: Drawer (vaul) + tokens/motion - جراحی: Volume/L&R/Subdivision از تمپو کات و به دراور دوم منتقل شد
 */
import * as React from "react";
import { Theme, ThemeTokens, motion } from "../../../tokens";
import {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerContent,
} from "../../../molecules/Drawer/Drawer";
import { Slider } from "../../../molecules/Slider/Slider";
import { Switch, Seg } from "./ui";
import { TempoRuler } from "./TempoRuler";

export type MetronomeSheetProps = {
  tokens: ThemeTokens;
  theme: Theme;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  metroOn: boolean;
  onMetroOn: (v: boolean) => void;
  metroVol: number;
  onMetroVol: (v: number) => void;
  metroBal: number;
  onMetroBal: (v: number) => void;
  subdiv: 0.5 | 1 | 2;
  onSubdiv: (v: 0.5 | 1 | 2) => void;
  bpm: number;
  baseBpm: number;
  onBpm: (v: number) => void;
};

export const MetronomeSheet = (p: MetronomeSheetProps) => {
  const { tokens: tk } = p;
  const isDark = p.theme === "dark";
  const [soundOpen, setSoundOpen] = React.useState(false);

  // وقتی مترو روشن شد، دراور صدا را باز کن
  const handleMetroToggle = (v: boolean) => {
    p.onMetroOn(v);
    if (v) setSoundOpen(true);
    else setSoundOpen(false);
  };

  // اگر دراور تمپو بسته شد، دراور صدا هم ببند
  React.useEffect(() => {
    if (!p.open) setSoundOpen(false);
  }, [p.open]);

  return (
    <>
      {/* دراور اول: Tempo تمیز */}
      <Drawer tokens={tk} theme={p.theme} open={p.open} onOpenChange={p.onOpenChange}>
        <DrawerPortal>
          <DrawerOverlay />
          <DrawerContent
            aria-label="Tempo"
            showHandle={false}
            style={{
              maxWidth: 560,
              padding: "10px 0 12px 0",
              background: isDark ? "#07090A" : "#F8FAFC",
              borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
            }}
          >
            {/* هدر TEMPO + RESET مثل KeySheet */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 24px 0 24px" }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  color: isDark ? "#8A8F98" : "#9CA3AF",
                }}
              >
                TEMPO
              </span>
              <button
                onClick={() => p.onBpm(p.baseBpm)}
                disabled={p.bpm === p.baseBpm}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  color: "#0FB5B5",
                  opacity: p.bpm === p.baseBpm ? 0.32 : 1,
                  pointerEvents: p.bpm === p.baseBpm ? "none" : "auto",
                  background: "none",
                  border: "none",
                  cursor: p.bpm === p.baseBpm ? "default" : "pointer",
                  transition: `opacity 300ms ${motion.easing.lux}`,
                }}
              >
                RESET
              </button>
            </div>

            <TempoRuler
              tokens={tk}
              theme={p.theme}
              min={60}
              max={200}
              value={p.bpm}
              original={p.baseBpm}
              onChange={(v) => p.onBpm(v)}
              format={(v) => String(Math.round(v))}
            />

            {/* سوئیچ ساده Smart Metronome - ان/اف */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "18px 24px 8px 24px",
                marginTop: 8,
                borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: tk.textPrimary, letterSpacing: "-0.01em" }}>Smart Metronome</span>
              <Switch tokens={tk} checked={p.metroOn} onChange={handleMetroToggle} label="Smart Metronome" />
            </div>
            <div style={{ height: 6 }} />
          </DrawerContent>
        </DrawerPortal>
      </Drawer>

      {/* دراور دوم: تنظیمات صدادار - روی دراور اول */}
      <Drawer tokens={tk} theme={p.theme} open={soundOpen} onOpenChange={setSoundOpen}>
        <DrawerPortal>
          <DrawerOverlay style={{ zIndex: 55, background: "rgba(0,0,0,0.28)", backdropFilter: "blur(8px)" } as React.CSSProperties} />
          <DrawerContent
            aria-label="Metronome Sound"
            showHandle={true}
            style={{
              maxWidth: 560,
              zIndex: 56,
              padding: "10px 14px calc(18px + env(safe-area-inset-bottom)) 14px",
              background: tk.sidebar,
              borderTop: `1px solid ${tk.borderColor}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "2px 0 14px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: isDark ? "#8A8F98" : "#9CA3AF" }}>SMART METRONOME</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 20, padding: "8px 10px 6px" }}>
              <div>
                <div style={{ fontSize: 13.5, color: tk.textMuted, marginBottom: 2 }}>Volume</div>
                <Slider tokens={tk} ariaLabel="Metronome volume" value={p.metroVol} min={0} max={100} onChange={p.onMetroVol} showBubble={false} />
              </div>
              <div>
                <div style={{ fontSize: 13.5, color: tk.textMuted, marginBottom: 2, textAlign: "right" }}>L &amp; R</div>
                <Slider tokens={tk} ariaLabel="Metronome balance" value={p.metroBal} min={-100} max={100} onChange={p.onMetroBal} showBubble={false} />
              </div>
            </div>

            <div style={{ padding: "8px 10px 4px" }}>
              <div style={{ fontSize: 13.5, color: tk.textMuted, marginBottom: 10 }}>Subdivision</div>
              <Seg
                tokens={tk}
                value={p.subdiv}
                onChange={(v) => p.onSubdiv(v)}
                options={[
                  { v: 0.5, label: "0.5x" },
                  { v: 1, label: "1x" },
                  { v: 2, label: "2x" },
                ]}
              />
            </div>

            <div style={{ height: 10 }} />
            <button
              onClick={() => setSoundOpen(false)}
              style={{
                width: "100%",
                height: 44,
                borderRadius: 999,
                border: `1px solid ${tk.borderColor}`,
                background: tk.activeBg,
                color: tk.textPrimary,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Done
            </button>
          </DrawerContent>
        </DrawerPortal>
      </Drawer>
    </>
  );
};
