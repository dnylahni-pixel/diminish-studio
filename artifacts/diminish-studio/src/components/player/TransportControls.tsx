import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, ChevronsLeft, ChevronsRight, RefreshCw } from "lucide-react";
import { fmt } from "@/lib/player-utils";
import { TempoControl } from "./TempoControl";

export function TransportControls({
  uiVisible, time, setTime, song, resetIdle,
  tempo, setTempo, playing, setPlaying, keyDrag, keyDisplay, semitones, setSemitones,
  tracksReady, loadProgress
}: any) {

  return (
    <motion.div
      animate={{ opacity: uiVisible ? 1 : 0, y: uiVisible ? 0 : 6 }}
      transition={{ duration: 0.35 }}
      className="flex-shrink-0 border-t border-border/40 bg-card/20 px-4 pt-2.5 flex flex-col gap-2.5"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))", pointerEvents: uiVisible ? "auto" : "none" }}
      data-testid="transport"
    >
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-mono text-muted-foreground/50 w-7 text-right tabular-nums">{fmt(time)}</span>
       <div className="flex-1 relative h-[3px] rounded-full bg-border/40 overflow-hidden">
  {loadProgress && (
    <div
      className="absolute left-0 top-0 bottom-0 rounded-full bg-foreground/10 transition-all duration-500"
      style={{ width: `${loadProgress.total > 0 ? (loadProgress.loaded / loadProgress.total) * 100 : 0}%` }}
      data-testid="buffer-progress"
    />
  )}
  <div
    className="absolute left-0 top-0 bottom-0 rounded-full bg-primary/60 transition-none"
    style={{ width: `${(time / (song.duration || 1)) * 100}%` }}
  />
  <input
    type="range"
    min={0}
    max={song.duration}
    step={0.1}
    value={time}
    onChange={e => { setTime(+e.target.value); resetIdle(); }}
    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
    data-testid="slider-progress"
  />
</div>

        <span className="text-[10px] font-mono text-muted-foreground/35 w-7 tabular-nums">{fmt(song.duration)}</span>
      </div>

      <div className="flex items-center justify-between">
        <TempoControl
          tempo={tempo}
          setTempo={setTempo}
          resetIdle={resetIdle}
        />

        <div className="flex items-center gap-4">
          <button onClick={() => { setTime((t: number) => Math.max(0, t - 10)); resetIdle(); }} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="btn-rw">
            <ChevronsLeft className="w-5 h-5" />
          </button>
          <button onClick={() => { setTime(0); resetIdle(); }} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="btn-skip-back">
            <SkipBack className="w-5 h-5" />
          </button>
          <motion.button
            whileTap={{ scale: 0.91 }}
            onClick={() => { setPlaying((p: boolean) => !p); resetIdle(); }}
            className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-md"
            data-testid="btn-play-pause"
          >
            <AnimatePresence mode="wait" initial={false}>
              {playing
                ? <motion.span key="p" initial={{scale:.6}} animate={{scale:1}} exit={{scale:.6}}><Pause className="w-5 h-5 fill-current" /></motion.span>
                : <motion.span key="pl" initial={{scale:.6}} animate={{scale:1}} exit={{scale:.6}}><Play className="w-5 h-5 fill-current ml-0.5" /></motion.span>
              }
            </AnimatePresence>
          </motion.button>
          <button className="text-muted-foreground hover:text-foreground transition-colors" data-testid="btn-skip-fwd">
            <SkipForward className="w-5 h-5" />
          </button>
          <button onClick={() => { setTime((t: number) => Math.min(song.duration, t + 10)); resetIdle(); }} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="btn-ff">
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>

        <div
          className="flex flex-col items-center w-14 cursor-ns-resize select-none touch-none"
          {...keyDrag}
          data-testid="drag-key"
        >
          <span className="text-base font-bold text-primary leading-none">{keyDisplay}</span>
          <span className="text-[9px] text-muted-foreground/45 tracking-widest uppercase mt-0.5">KEY</span>
          {semitones !== 0 && (
            <button
              className="mt-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
              onPointerDown={e => e.stopPropagation()}
              onClick={() => setSemitones(0)}
              data-testid="btn-key-reset"
            >
              <RefreshCw className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
