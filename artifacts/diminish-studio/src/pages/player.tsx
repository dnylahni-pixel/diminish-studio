import { useState, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward,
  ChevronsLeft, ChevronsRight, SlidersHorizontal,
  ChevronUp, ChevronDown, Minus, Plus, RefreshCw,
  Volume2, VolumeX, X,
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

// ─── Layout constants ─────────────────────────────────────────────────────────
const BEAT_W   = 90;   // px per beat
const HEAD_X   = 200;  // playhead offset from left edge

// ─── Types ────────────────────────────────────────────────────────────────────
interface LyricLine   { time: number; text: string; chords: string[] }
interface ChordBeat   { measure: number; beat: number; chord: string; time: number }
interface AudioTrack  { id: number; instrument: string; label: string; volume: number; muted: boolean }

function activeIdx<T extends { time: number }>(arr: T[], t: number) {
  let i = -1;
  for (let j = 0; j < arr.length; j++) { if (arr[j].time <= t) i = j; else break; }
  return i;
}

function fmt(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2,"0")}`;
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

  const timelineRef = useRef<HTMLDivElement>(null);
  const lyricsRef   = useRef<HTMLDivElement>(null);
  const rafRef      = useRef(0);
  const lastRef     = useRef(0);

  // init track state
  useEffect(() => {
    if (!song?.tracks) return;
    const v: Record<number,number> = {}, m: Record<number,boolean> = {};
    (song.tracks as AudioTrack[]).forEach(t => { v[t.id]=t.volume; m[t.id]=t.muted; });
    setVolumes(v); setMuted(m);
  }, [song]);

  // playback
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

  // timeline scroll
  useEffect(() => {
    if (!timelineRef.current || !song) return;
    const bps = (song.bpm * tempo) / 60;
    timelineRef.current.scrollLeft = Math.max(0, time * bps * BEAT_W - HEAD_X);
  }, [time, song, tempo]);

  // lyrics scroll
  useEffect(() => {
    if (!lyricsRef.current || !song?.lyrics?.length) return;
    const ai = activeIdx(song.lyrics as LyricLine[], time);
    if (ai < 0) return;
    lyricsRef.current.querySelector(`[data-li="${ai}"]`)
      ?.scrollIntoView({ behavior:"smooth", block:"center" });
  }, [time, song]);

  // ─────────────────────────────────────────────────────────────────────
  if (isLoading || !song) {
    return (
      <div className="p-6 h-full flex flex-col gap-4">
        {[32,100,1,24].map((h,i) => (
          <Skeleton key={i} className={`rounded-xl w-full ${i===2?"flex-1":"h-"+h}`} style={{height:i===2?undefined:h}} />
        ))}
      </div>
    );
  }

  const lyrics   = (song.lyrics        ?? []) as LyricLine[];
  const timeline = (song.chordTimeline ?? []) as ChordBeat[];
  const tracks   = (song.tracks        ?? []) as AudioTrack[];

  const activeCi = activeIdx(timeline, time);
  const activeLi = activeIdx(lyrics,   time);

  // group measures
  const measures = new Map<number, ChordBeat[]>();
  timeline.forEach(b => {
    if (!measures.has(b.measure)) measures.set(b.measure, []);
    measures.get(b.measure)!.push(b);
  });

  const bpmDisplay = Math.round(song.bpm * tempo);

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden" data-testid="player-page">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-4 px-5 h-16 border-b border-border/40">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-muted/60 border border-border/40 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate leading-tight">{song.title}</p>
            <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center gap-2">
          {/* Tempo */}
          <div className="flex items-center gap-1.5 text-xs tabular-nums">
            <span className="text-muted-foreground/60 font-medium">BPM</span>
            <span className="font-semibold w-8 text-center">{bpmDisplay}</span>
            <div className="flex flex-col">
              <button onClick={() => setTempo(p=>Math.min(2,+(p+0.05).toFixed(2)))}
                className="text-muted-foreground hover:text-foreground transition-colors leading-none" data-testid="btn-tempo-up">
                <ChevronUp className="w-3 h-3" />
              </button>
              <button onClick={() => setTempo(p=>Math.max(0.3,+(p-0.05).toFixed(2)))}
                className="text-muted-foreground hover:text-foreground transition-colors leading-none" data-testid="btn-tempo-dn">
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            {tempo!==1 && (
              <button onClick={()=>setTempo(1)} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors" data-testid="btn-tempo-reset">
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="w-px h-5 bg-border/50" />

          {/* Transpose */}
          <div className="flex items-center gap-1.5 text-xs tabular-nums">
            <span className="text-muted-foreground/60 font-medium">KEY</span>
            <span className="font-semibold w-8 text-center text-primary">{shiftKey(song.key, semitones)}</span>
            <button onClick={()=>setSemitones(p=>p-1)}
              className="text-muted-foreground hover:text-foreground transition-colors" data-testid="btn-transpose-dn">
              <Minus className="w-3 h-3" />
            </button>
            <button onClick={()=>setSemitones(p=>p+1)}
              className="text-muted-foreground hover:text-foreground transition-colors" data-testid="btn-transpose-up">
              <Plus className="w-3 h-3" />
            </button>
            {semitones!==0 && (
              <button onClick={()=>setSemitones(0)} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors" data-testid="btn-transpose-reset">
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="w-px h-5 bg-border/50" />

          {/* Mixer toggle */}
          <button
            onClick={()=>setMixerOpen(p=>!p)}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors",
              mixerOpen
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
            data-testid="btn-mixer-toggle"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Mixer</span>
          </button>
        </div>
      </div>

      {/* ── Chord Timeline ──────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 relative border-b border-border/40"
        style={{ height: 88 }}
        data-testid="chord-timeline"
      >
        {/* Playhead line */}
        <div
          className="absolute inset-y-0 z-20 pointer-events-none flex flex-col items-center"
          style={{ left: HEAD_X }}
        >
          <div className="w-px flex-1 bg-primary/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary mb-1" />
        </div>

        {/* Scroll container */}
        <div
          ref={timelineRef}
          className="h-full overflow-x-auto overflow-y-hidden"
          style={{ scrollbarWidth:"none" }}
        >
          {/* Inner */}
          <div
            className="h-full relative"
            style={{ width: Math.max((timeline.length + 4) * BEAT_W, 800) }}
          >
            {/* Measure labels row */}
            <div className="absolute top-0 left-0 right-0 h-6 flex items-end">
              {Array.from(measures.entries()).map(([mNum, beats]) => {
                const firstBeat = beats[0];
                const xOffset = ((firstBeat.measure - 1) * 4 + (firstBeat.beat - 1)) * BEAT_W;
                return (
                  <div key={mNum} className="absolute" style={{ left: xOffset }}>
                    {/* Measure bar */}
                    <div className="absolute bottom-0 left-0 w-px h-4 bg-border/50" />
                    <span className="absolute bottom-1 left-1.5 text-[9px] font-mono text-muted-foreground/40 uppercase tracking-widest select-none">
                      {mNum}
                    </span>
                    {/* Beat ticks */}
                    {beats.slice(1).map(b => {
                      const bx = (b.beat - firstBeat.beat) * BEAT_W;
                      return (
                        <div key={b.beat} className="absolute bottom-0 w-px h-2 bg-border/25" style={{ left: bx }} />
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Chord blocks */}
            <div className="absolute bottom-0 left-0 right-0" style={{ top: 24 }}>
              {timeline.map((item, idx) => {
                const beat0 = (item.measure - 1) * 4 + (item.beat - 1);
                const next  = timeline[idx + 1];
                const beat1 = next ? (next.measure - 1) * 4 + (next.beat - 1) : beat0 + 1;
                const w = (beat1 - beat0) * BEAT_W - 2;
                const isActive = idx === activeCi;
                const label = shiftChord(item.chord, semitones);

                return (
                  <div
                    key={idx}
                    className={cn(
                      "absolute inset-y-2 rounded-lg flex items-center justify-center transition-all duration-150",
                      isActive
                        ? "bg-primary/15 border border-primary/50"
                        : "bg-muted/30 border border-border/40 hover:bg-muted/50"
                    )}
                    style={{ left: beat0 * BEAT_W + 1, width: w }}
                    data-testid={`chord-${idx}`}
                  >
                    <span
                      className={cn(
                        "font-semibold font-mono tracking-tight transition-colors duration-150 select-none",
                        w < 70 ? "text-xs" : "text-sm",
                        isActive ? "text-primary" : "text-foreground/60"
                      )}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Edge fade */}
        <div className="absolute left-0 inset-y-0 w-10 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 inset-y-0 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      </div>

      {/* ── Lyrics ─────────────────────────────────────────────────────── */}
      <div
        ref={lyricsRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth:"none" }}
        data-testid="lyrics-panel"
      >
        <div className="max-w-2xl mx-auto py-8 px-8 space-y-0">
          {lyrics.length === 0 ? (
            <p className="text-muted-foreground/50 text-sm text-center pt-12">No lyrics available</p>
          ) : lyrics.map((line, i) => {
            const isActive = i === activeLi;
            const isPast   = i < activeLi;
            return (
              <div
                key={i}
                data-li={i}
                data-testid={`lyric-${i}`}
                className="py-3"
              >
                {/* Chord tags */}
                {line.chords?.length > 0 && (
                  <div className="flex gap-2 mb-1.5">
                    {line.chords.map((c,j) => (
                      <span
                        key={j}
                        className={cn(
                          "text-[10px] font-mono font-bold px-1.5 py-0.5 rounded transition-colors duration-300",
                          isActive
                            ? "text-primary bg-primary/10 border border-primary/25"
                            : "text-muted-foreground/50 bg-muted/20 border border-border/30"
                        )}
                      >
                        {shiftChord(c, semitones)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Lyric text */}
                <p
                  className={cn(
                    "leading-tight transition-all duration-500 font-medium",
                    isActive
                      ? "text-foreground text-2xl"
                      : isPast
                        ? "text-muted-foreground/30 text-xl"
                        : "text-muted-foreground/50 text-xl"
                  )}
                  dir="auto"
                >
                  {line.text}
                </p>

                {/* Active underline progress */}
                {isActive && (
                  <motion.div
                    className="mt-1.5 h-px bg-primary/50 rounded-full origin-left"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: lyrics[i+1] ? lyrics[i+1].time - line.time : 4,
                      ease: "linear",
                    }}
                  />
                )}
              </div>
            );
          })}
          <div className="h-24" />
        </div>
      </div>

      {/* ── Mixer Drawer ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mixerOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type:"spring", stiffness:400, damping:40 }}
            className="flex-shrink-0 overflow-hidden border-t border-border/40 bg-card/40"
            data-testid="mixer-drawer"
          >
            <div className="px-5 pt-3 pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">Mixer</span>
                <button
                  onClick={()=>setMixerOpen(false)}
                  className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  data-testid="btn-mixer-close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {tracks.map(track => {
                  const isMuted = muted[track.id] ?? false;
                  const vol     = volumes[track.id] ?? track.volume;
                  return (
                    <div key={track.id} className="flex flex-col gap-2" data-testid={`track-${track.id}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground font-medium truncate flex-1">
                          {track.instrument.charAt(0).toUpperCase() + track.instrument.slice(1)}
                        </span>
                        <button
                          onClick={()=>setMuted(p=>({...p,[track.id]:!p[track.id]}))}
                          className={cn(
                            "w-5 h-5 rounded text-[8px] font-black flex items-center justify-center border transition-colors ml-1 flex-shrink-0",
                            isMuted
                              ? "bg-foreground/10 text-foreground/40 border-border/50"
                              : "border-border/30 text-muted-foreground hover:text-foreground"
                          )}
                          data-testid={`btn-mute-${track.id}`}
                        >
                          M
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isMuted
                          ? <VolumeX className="w-3 h-3 text-muted-foreground/30 flex-shrink-0" />
                          : <Volume2 className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                        }
                        <Slider
                          value={[vol]}
                          max={100}
                          step={1}
                          className="flex-1"
                          onValueChange={([v])=>setVolumes(p=>({...p,[track.id]:v}))}
                          disabled={isMuted}
                          data-testid={`slider-${track.id}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Transport ───────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 border-t border-border/40 bg-card/30 px-5 py-3 flex flex-col gap-3"
        data-testid="transport"
      >
        {/* Seek */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-muted-foreground/60 w-8 text-right tabular-nums">
            {fmt(time)}
          </span>
          <Slider
            value={[time]}
            max={song.duration}
            step={0.1}
            className="flex-1"
            onValueChange={([v])=>setTime(v)}
            data-testid="slider-progress"
          />
          <span className="text-[11px] font-mono text-muted-foreground/40 w-8 tabular-nums">
            {fmt(song.duration)}
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-5">
          <button
            onClick={()=>setTime(t=>Math.max(0,t-10))}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="btn-rw"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>
          <button
            onClick={()=>setTime(0)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="btn-skip-back"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <motion.button
            whileTap={{ scale: 0.93 }}
            onClick={()=>setPlaying(p=>!p)}
            className="w-12 h-12 rounded-full bg-foreground text-background flex items-center justify-center shadow-lg"
            data-testid="btn-play-pause"
          >
            <AnimatePresence mode="wait" initial={false}>
              {playing ? (
                <motion.span key="pause" initial={{scale:0.6}} animate={{scale:1}} exit={{scale:0.6}}>
                  <Pause className="w-5 h-5 fill-current" />
                </motion.span>
              ) : (
                <motion.span key="play" initial={{scale:0.6}} animate={{scale:1}} exit={{scale:0.6}}>
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <button className="text-muted-foreground hover:text-foreground transition-colors" data-testid="btn-skip-fwd">
            <SkipForward className="w-5 h-5" />
          </button>
          <button
            onClick={()=>setTime(t=>Math.min(song.duration,t+10))}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="btn-ff"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
