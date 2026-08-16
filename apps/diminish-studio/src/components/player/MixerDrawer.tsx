import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { InstrumentIcon } from "@/lib/player-utils";

export function MixerDrawer({ mixerOpen, setMixerOpen, tracks, muted, setMuted, volumes, setVolumes }: any) {
  return (
    <AnimatePresence>
      {mixerOpen && (
        <>
          <motion.div
            key="bd"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm md:hidden"
            onClick={() => setMixerOpen(false)}
          />
          <motion.div
            key="mx"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 40 }}
            className={cn(
              "z-40 bg-card border-t border-border",
              "fixed inset-x-0 bottom-0 top-14 md:relative md:inset-auto md:top-auto md:flex-shrink-0"
            )}
            data-testid="mixer-drawer"
          >
            <div className="h-full overflow-y-auto px-5 pt-4 pb-6">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">Mixer</span>
                <button
                  onClick={() => setMixerOpen(false)}
                  className="text-muted-foreground/50 hover:text-muted-foreground transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                {tracks.map((track: any) => {
                  const isMuted = muted[track.id] ?? false;
                  const vol     = volumes[track.id] ?? track.volume;
                  return (
                    <div key={track.id} className="flex flex-col gap-3" data-testid={`track-${track.id}`}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setMuted((p: any) => ({ ...p, [track.id]: !p[track.id] }))}
                          className={cn(
                            "transition-colors p-1.5 rounded-md",
                            isMuted
                              ? "text-muted-foreground/30"
                              : "text-primary hover:text-primary/70"
                          )}
                          title={isMuted ? "Unmute" : "Mute"}
                          data-testid={`btn-mute-${track.id}`}
                        >
                          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <InstrumentIcon
                          name={track.instrument}
                          className={cn(
                            "w-4 h-4 flex-shrink-0",
                            isMuted ? "text-muted-foreground/25" : "text-muted-foreground/60"
                          )}
                        />
                      </div>
                      <Slider
                        value={[vol]}
                        max={100}
                        step={1}
                        onValueChange={([v]) => setVolumes((p: any) => ({ ...p, [track.id]: v }))}
                        disabled={isMuted}
                        data-testid={`slider-${track.id}`}
                      />
                      <span className="text-[10px] font-mono text-muted-foreground/40 tabular-nums">
                        {vol}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
