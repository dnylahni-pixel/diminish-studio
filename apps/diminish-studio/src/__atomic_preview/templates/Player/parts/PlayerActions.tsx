/**
 * PART: PlayerActions - ردیف سه آیکون پایین: Lyrics / Sections / Loop
 * فعال: فیروزه‌ای با پس‌زمینه نرم
 */
import { ThemeTokens, motion } from "../../../tokens";
import { LyricsIcon, GridIcon, LoopIcon } from "./icons";

export type PlayerActionsProps = {
  tokens: ThemeTokens;
  lyricsActive: boolean;
  sectionsActive: boolean;
  loopActive: boolean;
  onLyrics: () => void;
  onSections: () => void;
  onLoop: () => void;
};

const ActionBtn = ({ tokens: tk, active, label, onClick, children }: { tokens: ThemeTokens; active: boolean; label: string; onClick: () => void; children: React.ReactNode }) => (
  <button
    onClick={onClick}
    aria-label={label}
    aria-pressed={active}
    style={{
      width: 52,
      height: 46,
      borderRadius: 14,
      border: "none",
      cursor: "pointer",
      display: "grid",
      placeItems: "center",
      background: active ? "rgba(94,234,212,0.12)" : "transparent",
      color: active ? tk.accent : tk.textPrimary,
      transition: `all 300ms ${motion.easing.lux}`,
    }}
  >
    {children}
  </button>
);

export const PlayerActions = (p: PlayerActionsProps) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "2px 34px 10px", flexShrink: 0 }}>
    <ActionBtn tokens={p.tokens} active={p.lyricsActive} label="Lyrics" onClick={p.onLyrics}>
      <LyricsIcon />
    </ActionBtn>
    <ActionBtn tokens={p.tokens} active={p.sectionsActive} label="Sections" onClick={p.onSections}>
      <GridIcon />
    </ActionBtn>
    <ActionBtn tokens={p.tokens} active={p.loopActive} label="Loop" onClick={p.onLoop}>
      <LoopIcon />
    </ActionBtn>
  </div>
);
