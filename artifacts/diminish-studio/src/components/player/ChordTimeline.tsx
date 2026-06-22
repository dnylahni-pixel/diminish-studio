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

const rootSize   = isExtraLong ? "text-[22px]" : "text-[30px]";
const accSize    = isExtraLong ? "text-[15px]" : "text-[20px]";
const suffixSize = isExtraLong ? "text-[15px]" : "text-[20px]";


            return (
              <div
                key={bi}
                className={cn(
  "flex-shrink-0 flex items-center justify-center relative rounded-[2px]",
  isActive
    ? "bg-primary/25 dark:bg-primary/35"
    : "bg-muted/15 hover:bg-muted/25"
)}


                style={{ width: BEAT_W, height: TL_H }}
                data-testid={`beat-${bi}`}
              >
                {/* Separator line */}
<div
  className="absolute left-0 top-0 bottom-0"
  style={{
    width: isDownbeat ? "2.5px" : "1px",
    background: isDownbeat
      ? "hsl(var(--foreground) / 0.5)"
      : "hsl(var(--foreground) / 0.2)",
  }}
/>

                
                {/* Chord label */}
                {showLabel && chord && (
                  <span
                    className={cn(
                      "font-bold select-none tracking-tight leading-none truncate px-0.5 flex items-baseline",

                      rootSize,
                      isActive ? "text-primary" : "text-foreground/65",
                    )}
                    style={{ fontFamily: "'Nunito', sans-serif" }}

                    dir="ltr"
                  >
                    {isRest ? (
  <span style={{ fontFamily: "'Noto Music', sans-serif" }} className="text-[40px] leading-none text-foreground/40">𝄽</span>
) : (

                      <span className="flex items-baseline">
                        {root}
                     {accidental && (
  <span className={cn(accSize, "leading-none -ml-0.5 -translate-y-0.5")}>{accidental}</span>
)}


                        {suffix && (
<span className={cn(suffixSize, "leading-none ml-px translate-y-1")}>{suffix}</span>

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
