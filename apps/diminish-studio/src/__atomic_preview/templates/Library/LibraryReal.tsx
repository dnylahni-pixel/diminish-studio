/**
 * TEMPLATE: LibraryReal — atomic library with REAL backend wiring
 * Uses GET /library (useGetUserLibrary) + signed data, atomic tokens style
 * Fires onSelect(songId) to open PlayerReal overlay in lab page
 */
import * as React from "react";
import { Theme, ThemeTokens, motion, typography } from "../../tokens";
import { useGetUserLibrary } from "@workspace/api-client-react";
import { MoreIcon, SongsTabIcon, SearchIcon, PlusIcon } from "../Player/parts/icons";
import { clamp } from "../Player/parts/ui";

const GRADIENTS = [
  "linear-gradient(135deg,#3f3f46 0%,#18181b 55%,#09090b 100%)",
  "linear-gradient(135deg,#be123c 0%,#881337 55%,#4c0519 100%)",
  "linear-gradient(135deg,#991b1b 0%,#7c2d12 100%)",
  "linear-gradient(135deg,#065f46 0%,#022c22 50%,#111111 100%)",
  "linear-gradient(135deg,#166534 0%,#052e16 100%)",
  "linear-gradient(135deg,#27272a 0%,#000000 100%)",
  "linear-gradient(135deg,#78716c 0%,#1c1917 100%)",
  "linear-gradient(135deg,#1e293b 0%,#0f172a 100%)",
];

type Props = {
  theme: Theme;
  tokens: ThemeTokens;
  onSelect: (songId: number) => void;
  selectedId?: number | null;
};

export const LibraryReal: React.FC<Props> = ({ theme, tokens: tk, onSelect, selectedId }) => {
  const { data, isLoading, isError } = useGetUserLibrary();
  const [query, setQuery] = React.useState("");
  const [searchOpen, setSearchOpen] = React.useState(false);

  const songs: any[] = React.useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data as any[];
    const d: any = data as any;
    if (Array.isArray(d.songs)) return d.songs;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.data)) return d.data;
    return [];
  }, [data]);

  const filtered = React.useMemo(() => {
    if (!query.trim()) return songs;
    const q = query.toLowerCase();
    return songs.filter((s) => s.title?.toLowerCase().includes(q) || s.artist?.toLowerCase().includes(q));
  }, [songs, query]);

  if (isLoading) {
    return (
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", padding: "32px 24px" }}>
        <div style={{ fontFamily: typography.fontAccent, fontSize: 32, fontWeight: 400, letterSpacing: "-0.03em", color: tk.textPrimary, marginBottom: 16 }}>
          Library
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              style={{
                height: 180,
                borderRadius: 16,
                background: tk.hoverBg,
                animation: "eq1 1.2s ease-in-out infinite",
                opacity: 0.6,
              }}
            />
          ))}
        </div>
        <div style={{ marginTop: 16, fontSize: 12, color: tk.textMuted, textAlign: "center" }}>Loading library…</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 32 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: tk.textPrimary, marginBottom: 6 }}>Failed to load library</div>
          <div style={{ fontSize: 13, color: tk.textMuted }}>Check authentication or network.</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", padding: "32px 24px", maxWidth: 940, width: "100%", margin: "0 auto" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
        <div style={{ fontFamily: typography.fontAccent, fontSize: 40, fontWeight: 400, letterSpacing: "-0.03em", color: tk.textPrimary, lineHeight: 1.05 }}>
          Songs
        </div>
        <button
          onClick={() => setSearchOpen((s) => !s)}
          aria-label="Search"
          style={{
            width: 46,
            height: 46,
            borderRadius: 999,
            border: `1px solid ${tk.borderColor}`,
            background: tk.sidebar,
            color: tk.textPrimary,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            transition: `all 300ms ${motion.easing.lux}`,
          }}
        >
          <SearchIcon size={18} />
        </button>
      </div>

      {searchOpen && (
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists…"
          onBlur={() => !query && setSearchOpen(false)}
          style={{
            width: "100%",
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 14,
            border: `1px solid ${tk.borderColor}`,
            background: tk.sidebar,
            color: tk.textPrimary,
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
            animation: "fadeUp 0.3s cubic-bezier(0.32,0.72,0,1)",
          }}
        />
      )}

      {/* stats bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "4px 2px 14px", fontSize: 13, color: tk.textMuted }}>
        <span style={{ fontWeight: 600, color: tk.textPrimary }}>{filtered.length} songs</span>
        <span>{songs.length} total</span>
      </div>

      {/* list */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, paddingBottom: 40 }}>
        {filtered.map((song: any, i: number) => {
          const isActive = selectedId === song.id;
          const grad = GRADIENTS[song.id % GRADIENTS.length];
          const letter = (song.title?.trim()[0]?.toUpperCase() ?? "♪") as string;
          const dur = song.duration ?? 0;
          const durLabel = dur ? `${Math.floor(dur / 60)}:${String(dur % 60).padStart(2, "0")}` : "—";
          return (
            <div
              key={song.id}
              onClick={() => onSelect(song.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSelect(song.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "8px 12px",
                borderRadius: 14,
                cursor: "pointer",
                background: isActive ? tk.activeBg : "transparent",
                border: `1px solid ${isActive ? tk.borderColor : "transparent"}`,
                transition: `background 300ms ${motion.easing.lux}, border-color 300ms ${motion.easing.lux}`,
              }}
              onMouseEnter={(e) => {
                if (!isActive) (e.currentTarget as HTMLDivElement).style.background = tk.hoverBg;
              }}
              onMouseLeave={(e) => {
                if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent";
              }}
            >
              <div
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 10,
                  overflow: "hidden",
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  background: grad,
                  color: "#fff",
                  fontWeight: 650,
                  fontSize: 17,
                  position: "relative",
                }}
              >
                {song.coverUrl ? (
                  <img src={song.coverUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  letter
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15.5, fontWeight: 600, color: tk.textPrimary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {song.title}
                </div>
                <div style={{ fontSize: 12.5, color: tk.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2 }}>
                  {song.artist ?? "Unknown"} • {durLabel} • {song.key ?? "—"} {song.bpm ? `• ${song.bpm} BPM` : ""}
                </div>
              </div>
              <span
                style={{
                  display: "grid",
                  placeItems: "center",
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: isActive ? tk.textPrimary : "transparent",
                  color: isActive ? tk.app : tk.textMuted,
                  flexShrink: 0,
                }}
              >
                ▶
              </span>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: "40px 0", textAlign: "center", fontSize: 13, color: tk.textMuted }}>
            {query ? `No songs match "${query}"` : "No songs yet. Upload to get started."}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryReal;
