import { cn } from "@/lib/utils";
import { TL_H, HEAD_X, BEAT_W, shiftChord, parseChordDisplay } from "@/lib/player-utils";

interface ChordTimelineProps {
  timelineRef: React.RefObject<HTMLDivElement | null>;
  totalW: number;
  totalBeats: number;
  beatToChord: string[];
  semitones: number;
  currentBeat: number;
  beatGrid: any[];
  timeSignature: { numerator: number; denominator: number };
}

function RestIcon() {
  return (
    <svg
      viewBox="0 0 40 80"
      width="28"
      height="56"
      fill="currentColor"
    >
      <path d="M24 4
               C28 10 30 18 30 24
               C30 30 24 34 20 40
               C16 46 14 50 14 56
               C14 64 20 70 28 74
               L24 78
               C14 74 8 66 8 56
               C8 48 12 42 16 36
               C20 30 24 26 24 20
               C24 14 22 10 18 4
               Z"/>
    </svg>
  );
}

export function ChordTimeline({
  timelineRef, 
  totalW, 
  totalBeats, 
  beatToChord, 
  semitones, 
  currentBeat,
  beatGrid,
  timeSignature
}: ChordTimelineProps) {
  return (
    <div className="flex-shrink-0 relative border-b border-border/40" style={{ height: TL_H }}>

      <div
        ref={timelineRef}
        className="overflow-x-auto overflow-y-hidden h-full"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <div style={{ width: totalW, height: TL_H, display: "flex", flexDirection: "row" }}>
          {Array.from({ length: totalBeats }, (_, bi) => {
            const beatData = beatGrid[bi];
            const isDownbeat = beatGrid[bi]?.isDownbeat ?? false;
            const chord = beatToChord[bi] ?? "";
            const isActive = bi === currentBeat;
            
            // بررسی برای نمایش فقط وقتی آکورد تغییر کرده
            const showLabel = bi === 0 || beatToChord[bi] !== beatToChord[bi - 1];

            const { root, accidental, suffix, isRest } = parseChordDisplay(chord);

            // استثنا: فقط وقتی suffix خودش طولانیه (مثل maj7, sus4) سایز رو کوچیک‌تر کن
            const isExtraLong = suffix.length >= 3;

            const rootSize   = isExtraLong ? "text-[19px]" : "text-[24px]";
            const accSize    = isExtraLong ? "text-[13px]" : "text-[17px]";
            const suffixSize = isExtraLong ? "text-[13px]" : "text-[17px]";

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
                {/* Separator line */}
                <div
                  className="absolute left-0 top-0 bottom-0"
                  style={{
                    width: isDownbeat ? "1.5px" : "0.5px",
                    background: isDownbeat
                      ? "hsl(var(--foreground) / 0.35)"
                      : "hsl(var(--foreground) / 0.15)",
                  }}
                />
                
                {/* Chord label */}
                {showLabel && chord && (
                  <span
                    className={cn(
                      "font-semibold select-none tracking-tight leading-none truncate px-0.5 flex items-center",
                      rootSize,
                      isActive ? "text-primary" : "text-foreground/65",
                    )}
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    dir="ltr"
                  >
                    {isRest ? (
                      <RestIcon className="w-4 h-4" />
                    ) : (
                      <span className="flex items-baseline">
                        {root}
                        {accidental && (
                          <span className={cn(accSize, "leading-none -ml-0.5 -translate-y-0.5")}>{accidental}</span>
                        )}
                        {suffix && (
                          <span className={cn(suffixSize, "leading-none ml-0.5")}>{suffix}</span>
                        )}
                      </span>
                    )}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fade effects */}
      <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
      <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
    </div>
  );
}
