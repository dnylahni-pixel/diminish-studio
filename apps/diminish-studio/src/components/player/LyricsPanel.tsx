import { cn } from "@/lib/utils";

export function LyricsPanel({ lyricsRef, lyrics, activeLi, time }: any) {
  return (
    <div
      ref={lyricsRef}
      className="flex-1 overflow-y-auto overflow-x-hidden"
      style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--border)) transparent" }}
      data-testid="lyrics-panel"
    >
      <div className="max-w-xl mx-auto py-8 px-6">
        {lyrics.length === 0 ? (
          <p className="text-muted-foreground/40 text-sm text-center pt-16">No lyrics available</p>
        ) : lyrics.map((line: any, i: number) => {
          const isActive = i === activeLi;
          const isPast   = i < activeLi;

          const lineDuration = lyrics[i + 1] ? lyrics[i + 1].time - line.time : 4;
          const lineProgress = isActive
            ? Math.min(1, Math.max(0, (time - line.time) / lineDuration))
            : 0;
          const words = line.text.split(/(\s+)/);
          const wordTokens = words.filter((w: string) => w.trim());
          const totalWords = wordTokens.length;

          const activeWordIdx = Math.floor(lineProgress * totalWords);

          let wordSlot = 0;

          return (
            <div key={i} data-li={i} data-testid={`lyric-${i}`} className="py-3">
              <p
                className={cn(
                  "leading-snug font-medium transition-all duration-500",
                  isActive ? "text-[1.35rem]" :
                  isPast   ? "text-muted-foreground/30 text-xl" :
                             "text-muted-foreground/50 text-xl"
                )}
                dir="auto"
              >
                {isActive ? (
                  words.map((token: string, ti: number) => {
                    if (!token.trim()) {
                      return <span key={ti}>{token}</span>;
                    }
                    const slot = wordSlot++;
                    const isPastWord    = slot < activeWordIdx;
                    const isCurrentWord = slot === activeWordIdx;
                    return (
                      <span
                        key={ti}
                        className={cn(
                          "transition-colors duration-150",
                          isPastWord    ? "text-foreground" :
                          isCurrentWord ? "text-primary font-semibold" :
                                          "text-foreground/25"
                        )}
                      >
                        {token}
                      </span>
                    );
                  })
                ) : (
                  line.text
                )}
              </p>
            </div>
          );
        })}
        <div className="h-32" />
      </div>
    </div>
  );
}
