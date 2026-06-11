import { cn } from "@/lib/utils";
import { TL_H, HEAD_X, BEAT_W, shiftChord } from "@/lib/player-utils";

interface ChordTimelineProps {
  timelineRef: React.RefObject<HTMLDivElement | null>;
  totalW: number;
  totalBeats: number;
  beatToChord: string[];
  semitones: number;
  currentBeat: number;
}

export function ChordTimeline({ 
  timelineRef, 
  totalW, 
  totalBeats, 
  beatToChord, 
  semitones, 
  currentBeat 
}: ChordTimelineProps) {
  return (
    <div
      className="flex-shrink-0 relative border-b border-border/40"
      style={{ height: TL_H }}
      data-testid="chord-timeline"
    >
      <div
        className="absolute z-20 pointer-events-none"
        style={{ left: HEAD_X, bottom: 3, transform: "translateX(-50%)" }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
      </div>

      <div
        ref={timelineRef}
        className="overflow-x-auto overflow-y-hidden h-full"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div style={{ width: totalW, height: TL_H, display: "flex", flexDirection: "row" }}>
          {Array.from({ length: totalBeats }, (_, bi) => {
            const isDownbeat = bi % 4 === 0;
            const chord      = beatToChord[bi] ?? "";
            const prevChord  = bi > 0 ? (beatToChord[bi - 1] ?? "") : null;
            const showLabel  = chord !== prevChord || bi === 0;
            const isActive   = bi === currentBeat;
            const label      = showLabel ? shiftChord(chord, semitones) : "";

            return (
              <div
                key={bi}
                className={cn(
                  "flex-shrink-0 flex items-center justify-center relative",
                  isActive
                    ? "bg-primary/10 dark:bg-primary/15"
                    : "bg-muted/15 hover:bg-muted/25"
                )}
                style={{ width: BEAT_W, height: TL_H }}
                data-testid={`beat-${bi}`}
              >
                <div
                  className="absolute left-0 top-0 bottom-0"
                  style={{
                    width: isDownbeat ? "1.5px" : "0.5px",
                    background: isDownbeat
                      ? "hsl(var(--foreground) / 0.22)"
                      : "hsl(var(--foreground) / 0.10)",
                  }}
                />
                {label && (
                  <span
                    className={cn(
                      "font-mono font-semibold select-none tracking-tight leading-none truncate px-1 text-[13px]",
                      isActive ? "text-primary" : "text-foreground/55",
                    )}
                  >
                    {label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
    </div>
  );
}
