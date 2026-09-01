/**
 * PART: TransportBar - نوار پیشرفت نازک با استایل super_x5f_player_x5f_chunk_x5f_download
 * مهاجرت: پالس اولیه (bufferedPulse) → دانلود چانکی نمادین (chunks) → پیشرفت خطی
 * معماری: tokens + motion + foundations/global.css (keyframes)
 * - حالت عادی: 3 لایه (skeleton 40% sliding → buffered pulse → played solid + glow)
 * - حالت segments: هر سگمنت چانک جداگانه (gap 4px) با buffered/ played در هر سگمنت
 */
import * as React from "react";
import { Theme, ThemeTokens, motion } from "../../../tokens";
import { MetronomeIcon, KeySigIcon, RwIcon, FfIcon, PlayIcon, PauseIcon } from "./icons";
import { fmtTime, clamp } from "./ui";

export type TransportBarProps = {
  tokens: ThemeTokens;
  theme: Theme;
  playing: boolean;
  time: number;
  duration: number;
  segments?: number[];
  counting: number | null;
  metroOn: boolean;
  metroBpm: number;
  metroChanged: boolean;
  keyLabel: string | null;
  keyChanged: boolean;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
  onMetronome: () => void;
  onKey: () => void;
};

export const TransportBar = (p: TransportBarProps) => {
  const tk = p.tokens;
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [hover, setHover] = React.useState(false);
  const [dragTime, setDragTime] = React.useState(0);
  const [buffered, setBuffered] = React.useState(0);

  const shown = dragging ? dragTime : p.time;
  const frac = p.duration > 0 ? clamp(shown / p.duration, 0, 1) : 0;

  // chunk-download simulation: buffered 0 → 100% در چانک‌های 8-18% هر 280-420ms
  React.useEffect(() => {
    setBuffered(0);
    let iv: number | undefined;
    const start = window.setTimeout(() => {
      let b = 0;
      iv = window.setInterval(() => {
        b += 8 + Math.random() * 11;
        if (b >= 100) {
          b = 100;
          setBuffered(100);
          if (iv) window.clearInterval(iv);
        } else {
          setBuffered(b);
        }
      }, 320 + Math.random() * 90);
    }, 520);
    return () => {
      window.clearTimeout(start);
      if (iv) window.clearInterval(iv);
    };
  }, [p.duration]);

  const isSkeleton = buffered < 18;
  const trackH = dragging || hover ? 6 : 4;
  const trackBg = p.theme === "dark" ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.06)";
  const bufferedBg = p.theme === "dark" ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.14)";
  const skeletonBg = p.theme === "dark" ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.20)";
  const playedBg = tk.textPrimary;
  const glow = p.theme === "dark" && p.playing && !dragging && frac > 0.01 ? "0 0 8px rgba(255,255,255,0.32)" : "none";

  const seekClient = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const t = Math.round(clamp((clientX - rect.left) / rect.width, 0, 1) * p.duration);
    if (dragging) setDragTime(t);
    p.onSeek(t);
  };

  const bounds = React.useMemo(() => {
    if (!p.segments || p.segments.length === 0) return [0, p.duration];
    const b = [0, ...p.segments.filter((s) => s > 0 && s < p.duration), p.duration];
    return Array.from(new Set(b)).sort((a, z) => a - z);
  }, [p.segments, p.duration]);

  const transportBtn = (onClick: () => void, label: string, child: React.ReactNode, badge?: { text: string; active: boolean }) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 48 }}>
      <button
        onClick={onClick}
        aria-label={label}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: tk.textPrimary,
          display: "grid",
          placeItems: "center",
          padding: 8,
          transition: `opacity 250ms ${motion.easing.lux}, transform 250ms ${motion.easing.lux}`,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        {child}
      </button>
      {badge && (
        <span style={{ fontSize: 11, fontWeight: 650, fontFamily: "ui-monospace, monospace", color: badge.active ? tk.accent : "transparent", height: 14 }}>
          {badge.text}
        </span>
      )}
    </div>
  );

  return (
    <div style={{ flexShrink: 0, padding: "4px 22px 6px" }}>
      {/* نوار پیشرفت - استایل super chunk download */}
      <div
        ref={trackRef}
        role="slider"
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={p.duration}
        aria-valuenow={Math.round(shown)}
        tabIndex={0}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          setDragging(true);
          const rect = trackRef.current?.getBoundingClientRect();
          if (rect) {
            const t = Math.round(clamp((e.clientX - rect.left) / rect.width, 0, 1) * p.duration);
            setDragTime(t);
            p.onSeek(t);
          }
        }}
        onPointerMove={(e) => {
          if (dragging) seekClient(e.clientX);
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onPointerEnter={() => setHover(true)}
        onPointerLeave={() => setHover(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") p.onSeek(clamp(p.time + 5, 0, p.duration));
          if (e.key === "ArrowLeft") p.onSeek(clamp(p.time - 5, 0, p.duration));
        }}
        style={{ cursor: "pointer", touchAction: "none", outline: "none", padding: "6px 0" }}
      >
        {p.segments && bounds.length > 2 ? (
          // حالت سگمنتی (Sections) - هر چانک = یک سگمنت
          <div style={{ display: "flex", gap: 4 }}>
            {bounds.slice(0, -1).map((s0, i) => {
              const s1 = bounds[i + 1];
              const segFrac = clamp((shown - s0) / Math.max(0.001, s1 - s0), 0, 1);
              const s0Pct = (s0 / p.duration) * 100;
              const bufferedSeg = clamp((buffered - s0Pct) / Math.max(0.001, ((s1 - s0) / p.duration) * 100), 0, 1);
              const segSkeleton = bufferedSeg < 0.18 && bufferedSeg > 0;
              return (
                <div
                  key={i}
                  style={{
                    flex: Math.max(0.5, s1 - s0),
                    height: trackH,
                    borderRadius: 999,
                    background: trackBg,
                    overflow: "hidden",
                    position: "relative",
                    transition: `height 180ms cubic-bezier(0.2,0,0,1)`,
                  }}
                >
                  {/* skeleton per segment */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "40%",
                      borderRadius: 999,
                      background: skeletonBg,
                      opacity: segSkeleton ? 1 : 0,
                      animation: segSkeleton ? "skeletonSlide 1.2s ease-in-out infinite" : "none",
                      willChange: "transform",
                      transition: "opacity 300ms ease",
                      pointerEvents: "none",
                    }}
                  />
                  {/* buffered */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: `${bufferedSeg * 100}%`,
                      borderRadius: 999,
                      background: bufferedBg,
                      opacity: segSkeleton ? 0 : 1,
                      animation: p.playing && !segSkeleton && bufferedSeg < 1 && bufferedSeg > 0 ? "bufferedPulse 1.5s ease-in-out infinite" : "none",
                      transition: dragging ? "none" : "width 400ms ease, opacity 300ms ease",
                    }}
                  />
                  {/* played */}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: `${segFrac * 100}%`,
                      borderRadius: 999,
                      background: playedBg,
                      transition: dragging ? "none" : `width 200ms ${motion.easing.lux}`,
                    }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          // حالت تک نوار - پالس → چانک‌های دانلود → پیشرفت
          <div
            className="group relative w-full select-none touch-none"
            style={{ height: 28, display: "flex", alignItems: "center", position: "relative" }}
          >
            <div
              className="absolute left-0 right-0 rounded-full overflow-hidden"
              style={{
                height: trackH,
                background: trackBg,
                transition: "height 180ms cubic-bezier(0.2,0,0,1), background 200ms ease",
              }}
            >
              {/* skeleton 40% - فقط در فاز اول */}
              <div
                className="absolute left-0 top-0 bottom-0 rounded-full"
                style={{
                  width: "40%",
                  background: skeletonBg,
                  opacity: isSkeleton ? 1 : 0,
                  animation: isSkeleton ? "skeletonSlide 1.2s ease-in-out infinite" : "none",
                  willChange: "transform",
                  transition: "opacity 300ms ease",
                  pointerEvents: "none",
                }}
              />
              {/* buffered - چانک‌ها */}
              <div
                className="absolute left-0 top-0 bottom-0 rounded-full"
                style={{
                  width: `${Math.max(buffered, 0)}%`,
                  background: bufferedBg,
                  transition: dragging ? "none" : "width 400ms ease, background 200ms ease, opacity 300ms ease",
                  animation: p.playing && !isSkeleton && buffered < 100 ? "bufferedPulse 1.5s ease-in-out infinite" : "none",
                  opacity: isSkeleton ? 0 : 1,
                }}
              />
              {/* played */}
              <div
                className="absolute left-0 top-0 bottom-0 rounded-full"
                style={{
                  width: `${frac * 100}%`,
                  background: playedBg,
                  transition: dragging ? "none" : "width 100ms linear, background 200ms ease, box-shadow 200ms ease",
                  boxShadow: glow,
                  zIndex: 2,
                }}
              />
            </div>
            {/* thumb - فقط hover/drag */}
            <div
              className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                left: `calc(${frac * 100}% - 6px)`,
                opacity: dragging || hover ? 1 : 0,
                transform: `translateY(-50%) scale(${dragging ? 1.12 : hover ? 1 : 0.8})`,
                transition: dragging
                  ? "transform 120ms cubic-bezier(0.2,0,0,1), opacity 120ms ease"
                  : `left 100ms linear, transform 220ms cubic-bezier(0.2,0,0,1), opacity 220ms ease`,
              }}
            >
              <div
                className="h-3 w-3 rounded-full bg-white"
                style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.06)" }}
              />
            </div>
            <div className="absolute inset-0" aria-hidden />
          </div>
        )}
      </div>

      {/* زمان‌ها */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: tk.textMuted, fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>
        <span>{fmtTime(shown)}</span>
        <span>-{fmtTime(Math.max(0, p.duration - shown))}</span>
      </div>

      {/* ترنسپورت */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 4px" }}>
        {transportBtn(p.onMetronome, "Smart Metronome", <MetronomeIcon off={!p.metroOn} />, p.metroOn ? { text: String(p.metroBpm), active: p.metroChanged } : undefined)}
        {transportBtn(() => p.onSeek(clamp(p.time - 5, 0, p.duration)), "Back 5 seconds", <RwIcon />)}
        {transportBtn(
          p.onTogglePlay,
          p.counting !== null ? "Cancel count-in" : p.playing ? "Pause" : "Play",
          p.counting !== null ? (
            <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "ui-monospace, monospace", width: 28, textAlign: "center" }}>{p.counting}</span>
          ) : p.playing ? (
            <PauseIcon size={30} />
          ) : (
            <PlayIcon size={30} />
          )
        )}
        {transportBtn(() => p.onSeek(clamp(p.time + 5, 0, p.duration)), "Forward 5 seconds", <FfIcon />)}
        {transportBtn(p.onKey, "Song Key", <KeySigIcon />, p.keyLabel ? { text: p.keyLabel, active: p.keyChanged } : undefined)}
      </div>
    </div>
  );
};
