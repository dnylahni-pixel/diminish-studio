import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./src/index.css";
import { TempoControl } from "./src/components/player/TempoControl";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";

function Preview() {
  const [tempo, setTempo] = useState(1);
  const [dark, setDark] = useState(true);
  const [playing, setPlaying] = useState(false);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <div className="h-screen-safe flex flex-col bg-background p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold text-foreground">TempoControl Preview</h1>
        <button
          onClick={() => setDark((d) => !d)}
          className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          {dark ? "Light" : "Dark"} mode
        </button>
      </div>

      <div className="mt-auto">
        {/* شبیه‌سازی نوار ترنسپورت پلیر */}
        <div className="relative flex flex-col gap-2.5 rounded-2xl border-t border-border/40 bg-card/20 px-4 pt-2.5 pb-4">
          <div className="flex items-center justify-between">
            <TempoControl tempo={tempo} setTempo={setTempo} resetIdle={() => {}} />

            <div className="flex items-center gap-4">
              <button className="text-muted-foreground"><SkipBack className="h-5 w-5" /></button>
              <button
                onClick={() => setPlaying((p) => !p)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background shadow-md"
              >
                {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
              </button>
              <button className="text-muted-foreground"><SkipForward className="h-5 w-5" /></button>
            </div>

            <div className="flex w-[58px] flex-col items-center">
              <span className="text-base font-bold leading-none text-primary">Am</span>
              <span className="mt-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/45">KEY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Preview />);
