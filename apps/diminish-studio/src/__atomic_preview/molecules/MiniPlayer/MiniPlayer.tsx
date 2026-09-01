/**
 * MOLECULE: MiniPlayer - نوار قرصی پلیر مینی بالای تب‌بار (سبک Moises)
 * کاور کوچک + عنوان/آرتیست + دکمه Play و Fast-Forward - کلیک روی نوار = پلیر کامل
 */
import { Theme, ThemeTokens, motion } from "../../tokens";

export type MiniPlayerProps = {
  tokens: ThemeTokens;
  theme: Theme;
  track: { title: string; artist: string; letter: string; gradient: string };
  playing: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onOpen: () => void;
};

const PlayIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.5 5.5V18.5L19 12L8.5 5.5Z" />
  </svg>
);
const PauseIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <rect x="7" y="5.5" width="3.4" height="13" rx="1.4" />
    <rect x="13.6" y="5.5" width="3.4" height="13" rx="1.4" />
  </svg>
);
const FfIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 6.5v11l7.5-5.5L13 6.5z" />
    <path d="M3.5 6.5v11L11 12 3.5 6.5z" />
  </svg>
);

export const MiniPlayer = ({ tokens: tk, track, playing, onTogglePlay, onNext, onOpen }: MiniPlayerProps) => (
  <div
    onClick={onOpen}
    title="Open player"
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "8px 12px 8px 8px",
      borderRadius: 18,
      background: tk.sidebar,
      border: `1px solid ${tk.borderColor}`,
      cursor: "pointer",
      animation: "fadeUp 0.5s cubic-bezier(0.32,0.72,0,1)",
      transition: `border-color 300ms ${motion.easing.lux}, transform 250ms ${motion.easing.lux}`,
    }}
    onMouseEnter={(e) => (e.currentTarget.style.borderColor = tk.textMuted)}
    onMouseLeave={(e) => (e.currentTarget.style.borderColor = tk.borderColor)}
  >
    {/* کاور کوچک */}
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 10,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        background: track.gradient,
        color: "#fff",
        fontWeight: 650,
        fontSize: 15,
      }}
    >
      {track.letter}
    </div>

    {/* عنوان‌ها */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: tk.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {track.title}
      </div>
      <div style={{ fontSize: 12, color: tk.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
        {track.artist}
      </div>
    </div>

    {/* کنترل‌ها */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onTogglePlay();
      }}
      aria-label={playing ? "Pause" : "Play"}
      style={{ width: 42, height: 42, borderRadius: 999, border: "none", background: "transparent", color: tk.textPrimary, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}
    >
      {playing ? <PauseIcon /> : <PlayIcon />}
    </button>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onNext();
      }}
      aria-label="Next track"
      style={{ width: 42, height: 42, borderRadius: 999, border: "none", background: "transparent", color: tk.textPrimary, display: "grid", placeItems: "center", cursor: "pointer", flexShrink: 0 }}
    >
      <FfIcon />
    </button>
  </div>
);
