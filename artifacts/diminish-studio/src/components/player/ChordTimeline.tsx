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
            const isDownbeat = beatGrid[bi]?.isDownbeat ?? false;
            const chord = beatToChord[bi] ?? "";
            const isActive = bi === currentBeat;
            const showLabel = bi === 0 || beatToChord[bi] !== beatToChord[bi - 1];

            const { root, accidental, suffix, isRest } = parseChordDisplay(chord);

            // جداسازی m از بقیه افزونه‌ها (مثل تبدیل m7 به m پایین و 7 بالا)
            let inlineSuffix = "";
            let supSuffix = "";
            if (suffix) {
              if (suffix === "m") {
                inlineSuffix = "m";
              } else if (suffix.startsWith("m") && !suffix.startsWith("maj")) {
                inlineSuffix = "m";
                supSuffix = suffix.substring(1);
              } else {
                supSuffix = suffix;
              }
            }

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
                      // از items-baseline استفاده شد تا همه روی خط کرسی تراز شوند
                      "select-none leading-none px-0.5 flex items-baseline justify-center",
                      isActive ? "text-primary" : "text-foreground/65",
                    )}
                    dir="ltr"
                  >
                    {isRest ? (
                      <span
                        style={{ fontFamily: "'Noto Music', sans-serif" }}
                        className="text-[26px]"
                      >
                        𝄽
                      </span>
                    ) : (
                      <>
                        {/* نت پایه */}
                        <span
                          className="text-[26px] font-bold leading-none"
                          style={{ fontFamily: "'Nunito', sans-serif" }}
                        >
                          {root}
                        </span>

                        {/* دیز یا بمل */}
                        {accidental && (
                          <span
                            className="text-[18px] font-bold leading-none"
                            style={{
                              fontFamily: "'Nunito', sans-serif",
                              verticalAlign: "baseline",
                            }}
                          >
                            {accidental}
                          </span>
                        )}

                        {/* حرف m هم‌راستا با نت پایه */}
                        {inlineSuffix && (
                          <span
                            className="text-[20px] font-semibold leading-none"
                            style={{
                              fontFamily: "'Nunito', sans-serif",
                              marginLeft: "1px",
                            }}
                          >
                            {inlineSuffix}
                          </span>
                        )}

                        {/* افزونه‌های بالانویس مثل 7 یا maj7 */}
                        {supSuffix && (
                          <sup
                            className="text-[16px] font-semibold"
                            style={{
                              fontFamily: "'Nunito', sans-serif",
                              marginLeft: "1px",
                              verticalAlign: "super",
                            }}
                          >
                            {supSuffix}
                          </sup>
                        )}
                      </>
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
