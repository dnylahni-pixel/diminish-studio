import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward,
  ChevronsLeft, ChevronsRight, SlidersHorizontal,
  Volume2, VolumeX, X, RefreshCw,
  Guitar, Piano, Mic2, Music2, Drum, Waves, AudioLines,
} from "lucide-react";
import { useGetSong, getGetSongQueryKey } from "@workspace/api-client-react";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Transposition ────────────────────────────────────────────────────────────
const CHROMATIC = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const ENHARMONIC: Record<string,string> = {
  Db:"C#",Eb:"D#",Gb:"F#",Ab:"G#",Bb:"A#","E#":"F","B#":"C",Cb:"B",Fb:"E",
};
function shiftNote(note: string, n: number) {
  const k = ENHARMONIC[note] ?? note;
  const i = CHROMATIC.indexOf(k);
  return i === -1 ? note : CHROMATIC[((i + n) % 12 + 12) % 12];
}
function shiftChord(chord: string, n: number) {
  if (n === 0) return chord;
  const m = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!m) return chord;
  const [, root, sfx] = m;
  if (sfx.includes("/")) {
    const si = sfx.lastIndexOf("/");
    return `${shiftNote(root, n)}${sfx.slice(0, si)}/${shiftNote(sfx.slice(si+1), n)}`;
  }
  return `${shiftNote(root, n)}${sfx}`;
}
function shiftKey(key: string, n: number) {
  const k = ENHARMONIC[key] ?? key;
  const i = CHROMATIC.indexOf(k);
  return i === -1 ? key : CHROMATIC[((i + n) % 12 + 12) % 12];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BEAT_W  = 56;
const HEAD_X  = 160;
const TL_H    = 56;

// ─── Types ────────────────────────────────────────────────────────────────────
interface LyricLine  { time: number; text: string; chords: string[] }
interface ChordBeat  { measure: number; beat: number; chord: string; time: number }
interface AudioTrack { id: number; instrument: string; label: string; volume: number; muted: boolean }

function getActiveIdx<T extends { time: number }>(arr: T[], t: number) {
  let i = -1;
  for (let j = 0; j < arr.length; j++) { if (arr[j].time <= t) i = j; else break; }
  return i;
}
function fmt(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2,"0")}`;
}

// ─── Instrument icon map ──────────────────────────────────────────────────────
function InstrumentIcon({ name, className }: { name: string; className?: string }) {
  const n = name.toLowerCase();
  if (n.includes("guitar") || n.includes("gitar"))  return <Guitar    className={className} />;
  if (n.includes("piano") || n.includes("keys"))     return <Piano     className={className} />;
  if (n.includes("vocal") || n.includes("voice") || n.includes("sing")) return <Mic2 className={className} />;
  if (n.includes("drum") || n.includes("perc"))      return <Drum      className={className} />;
  if (n.includes("bass"))                            return <AudioLines className={className} />;
  if (n.includes("string") || n.includes("violin"))  return <Waves     className={className} />;
  return <Music2 className={className} />;
}

// ─── Drag-to-change hook ──────────────────────────────────────────────────────
function useDragChange(
  value: number,
  onChange: (v: number) => void,
  pxPerStep: number,
  step: number,
  min: number,
  max: number,
) {
  const startY   = useRef(0);
  const startVal = useRef(0);
  const dragging = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startY.current   = e.clientY;
    startVal.current = value;
    dragging.current = true;
  }, [value]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dy    = startY.current - e.clientY;
    const steps = Math.round(dy / pxPerStep);
    const next  = Math.min(max, Math.max(min, startVal.current + steps * step));
    onChange(+next.toFixed(2));
  }, [onChange, pxPerStep, step, min, max]);

  const onPointerUp = useCallback(() => { dragging.current = false; }, []);

  return { onPointerDown, onPointerMove, onPointerUp };
}

// ─────────────────────────────────────────────────────────────────────────────
export function PlayerPage() {
  const { id } = useParams();
  const { data: song, isLoading } = useGetSong(Number(id), {
    query: { enabled: !!id, queryKey: getGetSongQueryKey(Number(id)) },
  });

  const [playing,   setPlaying]   = useState(false);
  const [time,      setTime]      = useState(0);
  const [tempo,     setTempo]     = useState(1.0);
  const [semitones, setSemitones] = useState(0);
  const [mixerOpen, setMixerOpen] = useState(false);
  const [volumes,   setVolumes]   = useState<Record<number,number>>({});
  const [muted,     setMuted]     = useState<Record<number,boolean>>({});
  const [uiVisible, setUiVisible] = useState(true);

  const timelineRef = useRef<HTMLDivElement>(null);
  const lyricsRef   = useRef<HTMLDivElement>(null);
  const rafRef      = useRef(0);
  const lastRef     = useRef(0);
  const idleTimer   = useRef<ReturnType<typeof setTimeout>>();
  const prevBeat    = useRef(-1);

  useEffect(() => {
    if (!song?.tracks) return;
    const v: Record<number,number> = {}, m: Record<number,boolean> = {};
    (song.tracks as AudioTrack[]).forEach(t => { v[t.id]=t.volume; m[t.id]=t.muted; });
    setVolumes(v); setMuted(m);
  }, [song]);

  useEffect(() => {
    if (!playing || !song) return;
    const tick = (now: number) => {
      if (!lastRef.current) lastRef.current = now;
      const dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      setTime(p => {
        const n = p + dt * tempo;
        if (n >= song.duration) { setPlaying(false); return 0; }
        return n;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    lastRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, song, tempo]);

  // Snap scroll per beat
  useEffect(() => {
    if (!timelineRef.current || !song) return;
    const bps  = (song.bpm * tempo) / 60;
    const beat = Math.floor(time * bps);
    if (beat === prevBeat.current) return;
    prevBeat.current = beat;
    timelineRef.current.scrollLeft = Math.max(0, beat * BEAT_W - HEAD_X);
  }, [time, song, tempo]);

  useEffect(() => {
    if (!lyricsRef.current || !song?.lyrics?.length) return;
    const ai = getActiveIdx(song.lyrics as LyricLine[], time);
    if (ai < 0) return;
    lyricsRef.current.querySelector(`[data-li="${ai}"]`)
      ?.scrollIntoView({ behavior:"smooth", block:"center" });
  }, [time, song]);

  const resetIdle = useCallback(() => {
    setUiVisible(true);
    clearTimeout(idleTimer.current);
    if (playing) {
      idleTimer.current = setTimeout(() => setUiVisible(false), 3500);
    }
  }, [playing]);

  useEffect(() => { resetIdle(); }, [playing, resetIdle]);
  useEffect(() => () => clearTimeout(idleTimer.current), []);

  const tempoDrag = useDragChange(tempo, setTempo, 6, 0.05, 0.3, 2.0);
  const keyDrag   = useDragChange(semitones, setSemitones, 14, 1, -12, 12);

  if (isLoading || !song) {
    return (
      <div className="p-6 h-full flex flex-col gap-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="flex-1 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  const lyrics   = (song.lyrics        ?? []) as LyricLine[];
  const timeline = (song.chordTimeline ?? []) as ChordBeat[];
  const tracks   = (song.tracks        ?? []) as AudioTrack[];

  const activeCi = getActiveIdx(timeline, time);
  const activeLi = getActiveIdx(lyrics, time);
  const bpmDisplay = Math.round(song.bpm * tempo);
  const keyDisplay = shiftKey(song.key, semitones);

  const totalBeats = timeline.length > 0
    ? (timeline[timeline.length - 1].measure - 1) * 4 + timeline[timeline.length - 1].beat
    : 0;

  const beatToChord: string[] = [];
  let ci = 0;
  for (let b = 0; b < totalBeats; b++) {
    const bMeasure = Math.floor(b / 4) + 1;
    const bBeat    = (b % 4) + 1;
    while (
      ci + 1 < timeline.length &&
      (timeline[ci + 1].measure < bMeasure ||
        (timeline[ci + 1].measure === bMeasure && timeline[ci + 1].beat <= bBeat))
    ) ci++;
    beatToChord.push(ci >= 0 ? timeline[ci]?.chord ?? "" : "");
  }

  const bps         = (song.bpm * tempo) / 60;
  const currentBeat = Math.floor(time * bps);
  const totalW      = Math.max(totalBeats * BEAT_W + HEAD_X * 2, 800);

  return (
    <div
      className="h-full flex flex-col bg-background overflow-hidden"
      onPointerMove={resetIdle}
      onPointerDown={resetIdle}
      data-testid="player-page"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        animate={{ opacity: uiVisible ? 1 : 0, y: uiVisible ? 0 : -4 }}
        transition={{ duration: 0.35 }}
        className="flex-shrink-0 flex items-center gap-3 px-4 h-14 border-b border-border/40"
        style={{ pointerEvents: uiVisible ? "auto" : "none" }}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-muted/70 border border-border/40 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate leading-tight">{song.title}</p>
            <p className="text-xs text-muted-foreground/60 truncate">{song.artist}</p>
          </div>
        </div>
        <button
          onClick={() => { setMixerOpen(p => !p); resetIdle(); }}
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

      {/* ── Chord Timeline ──────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 relative border-b border-border/40"
        style={{ height: TL_H }}
        data-testid="chord-timeline"
      >
        {/* Playhead dot only */}
        <div
          className="absolute z-20 pointer-events-none"
          style={{ left: HEAD_X, bottom: 3, transform: "translateX(-50%)" }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>

        {/* Scroll container */}
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
                  {/* Left border — downbeat slightly thicker, beat very thin */}
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

        {/* Edge fades */}
        <div className="absolute left-0 inset-y-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 inset-y-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      </div>

      {/* ── Lyrics ─────────────────────────────────────────────────────── */}
      <div
        ref={lyricsRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(var(--border)) transparent" }}
        data-testid="lyrics-panel"
      >
        <div className="max-w-xl mx-auto py-8 px-6">
          {lyrics.length === 0 ? (
            <p className="text-muted-foreground/40 text-sm text-center pt-16">No lyrics available</p>
          ) : lyrics.map((line, i) => {
            const isActive = i === activeLi;
            const isPast   = i < activeLi;
            return (
              <div key={i} data-li={i} data-testid={`lyric-${i}`} className="py-2.5">
                {line.chords?.length > 0 && (
                  <div className="flex gap-1.5 mb-1">
                    {line.chords.map((c, j) => (
                      <span
                        key={j}
                        className={cn(
                          "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-all duration-300",
                          isActive
                            ? "text-primary bg-primary/10 border border-primary/20"
                            : "text-muted-foreground/40 bg-transparent border border-border/20"
                        )}
                      >
                        {shiftChord(c, semitones)}
                      </span>
                    ))}
                  </div>
                )}
                <p
                  className={cn(
                    "leading-snug font-medium transition-all duration-500",
                    isActive ? "text-foreground text-[1.35rem]" :
                    isPast   ? "text-muted-foreground/30 text-xl" :
                               "text-muted-foreground/50 text-xl"
                  )}
                  dir="auto"
                >
                  {line.text}
                </p>
                {isActive && (
                  <motion.div
                    className="mt-1.5 h-px bg-primary/40 rounded-full origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    key={`ul-${i}`}
                    transition={{
                      duration: lyrics[i+1] ? lyrics[i+1].time - line.time : 4,
                      ease: "linear",
                    }}
                  />
                )}
              </div>
            );
          })}
          <div className="h-32" />
        </div>
      </div>

      {/* ── Mixer Overlay ───────────────────────────────────────────────── */}
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
                  {tracks.map(track => {
                    const isMuted = muted[track.id] ?? false;
                    const vol     = volumes[track.id] ?? track.volume;
                    return (
                      <div key={track.id} className="flex flex-col gap-3" data-testid={`track-${track.id}`}>
                        {/* Icon + mute toggle */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setMuted(p => ({ ...p, [track.id]: !p[track.id] }))}
                            className={cn(
                              "transition-colors p-1.5 rounded-md",
                              isMuted
                                ? "text-muted-foreground/30"
                                : "text-primary hover:text-primary/70"
                            )}
                            title={isMuted ? "Unmute" : "Mute"}
                            data-testid={`btn-mute-${track.id}`}
                          >
                            {isMuted
                              ? <VolumeX className="w-5 h-5" />
                              : <Volume2 className="w-5 h-5" />
                            }
                          </button>
                          <InstrumentIcon
                            name={track.instrument}
                            className={cn(
                              "w-4 h-4 flex-shrink-0",
                              isMuted ? "text-muted-foreground/25" : "text-muted-foreground/60"
                            )}
                          />
                        </div>
                        {/* Volume slider */}
                        <Slider
                          value={[vol]}
                          max={100}
                          step={1}
                          onValueChange={([v]) => setVolumes(p => ({ ...p, [track.id]: v }))}
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

      {/* ── Transport ───────────────────────────────────────────────────── */}
      <motion.div
        animate={{ opacity: uiVisible ? 1 : 0, y: uiVisible ? 0 : 6 }}
        transition={{ duration: 0.35 }}
        className="flex-shrink-0 border-t border-border/40 bg-card/20 px-4 pt-2.5 pb-3 flex flex-col gap-2.5"
        style={{ pointerEvents: uiVisible ? "auto" : "none" }}
        data-testid="transport"
      >
        {/* Progress — thin custom bar */}
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-muted-foreground/50 w-7 text-right tabular-nums">{fmt(time)}</span>
          <div className="flex-1 relative h-[3px] rounded-full bg-border/40 overflow-hidden">
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

        {/* Controls */}
        <div className="flex items-center justify-between">

          {/* BPM drag */}
          <div
            className="flex flex-col items-center w-14 cursor-ns-resize select-none touch-none"
            {...tempoDrag}
            data-testid="drag-tempo"
          >
            <span className="text-base font-bold tabular-nums leading-none">{bpmDisplay}</span>
            <span className="text-[9px] text-muted-foreground/45 tracking-widest uppercase mt-0.5">BPM</span>
            {tempo !== 1 && (
              <button
                className="mt-0.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                onPointerDown={e => e.stopPropagation()}
                onClick={() => setTempo(1)}
                data-testid="btn-tempo-reset"
              >
                <RefreshCw className="w-2.5 h-2.5" />
              </button>
            )}
          </div>

          {/* Playback */}
          <div className="flex items-center gap-4">
            <button onClick={() => { setTime(t => Math.max(0, t - 10)); resetIdle(); }} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="btn-rw">
              <ChevronsLeft className="w-5 h-5" />
            </button>
            <button onClick={() => { setTime(0); resetIdle(); }} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="btn-skip-back">
              <SkipBack className="w-5 h-5" />
            </button>
            <motion.button
              whileTap={{ scale: 0.91 }}
              onClick={() => { setPlaying(p => !p); resetIdle(); }}
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
            <button onClick={() => { setTime(t => Math.min(song.duration, t + 10)); resetIdle(); }} className="text-muted-foreground hover:text-foreground transition-colors" data-testid="btn-ff">
              <ChevronsRight className="w-5 h-5" />
            </button>
          </div>

          {/* KEY drag */}
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
    </div>
  );
}
