import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlayerHeaderProps {
  song: {
    title: string;
    artist: string;
  };
  uiVisible: boolean;
  mixerOpen: boolean;
  setMixerOpen: (value: boolean | ((prev: boolean) => boolean)) => void;
  resetIdle: () => void;
}

export function PlayerHeader({ song, uiVisible, mixerOpen, setMixerOpen, resetIdle }: PlayerHeaderProps) {
  return (
    <motion.div
      animate={{ opacity: uiVisible ? 1 : 0, y: uiVisible ? 0 : -4 }}
      transition={{ duration: 0.35 }}
      className="flex-shrink-0 flex items-center gap-3 px-4 h-14 border-b border-border/40"
      style={{ pointerEvents: uiVisible ? "auto" : "none" }}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate leading-tight">{song.title}</p>
          <p className="text-xs text-muted-foreground/60 truncate">{song.artist}</p>
        </div>
      </div>
      <button
        onClick={() => { setMixerOpen((p: boolean) => !p); resetIdle(); }}
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors",
          mixerOpen ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        )}
        data-testid="btn-mixer-toggle"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Mixer</span>
      </button>
    </motion.div>
  );
}
