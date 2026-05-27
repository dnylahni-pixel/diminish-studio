import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Gauge, Music2, ChevronUp, ChevronDown, Minus, Plus,
  Mic2, Layers, Settings2, RefreshCw, ChevronsLeft, ChevronsRight
} from "lucide-react";
import { useGetSong, getGetSongQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Chord transposition ──────────────────────────────────────────────────────
const CHROMATIC = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const ENHARMONIC: Record<string, string> = {
  "Db":"C#","Eb":"D#","Gb":"F#","Ab":"G#","Bb":"A#",
  "E#":"F","B#":"C","Cb":"B","Fb":"E",
};

function transposeNote(note: string, semitones: number): string {
  const normalized = ENHARMONIC[note] ?? note;
  const idx = CHROMATIC.indexOf(normalized);
  if (idx === -1) return note;
  return CHROMATIC[((idx + semitones) % 12 + 12) % 12];
}

function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;
  // Match root note (e.g. C#, Bb, G) then the rest (m, maj7, sus4, etc.)
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;
  const [, root, suffix] = match;
  // Handle slash chords like Am/E
  if (suffix.includes("/")) {
    const slashIdx = suffix.lastIndexOf("/");
    const rest = suffix.slice(0, slashIdx);
    const bassNote = suffix.slice(slashIdx + 1);
    return `${transposeNote(root, semitones)}${rest}/${transposeNote(bassNote, semitones)}`;
  }
  return `${transposeNote(root, semitones)}${suffix}`;
}

// ─── Key names for display ────────────────────────────────────────────────────
const KEY_NAMES = CHROMATIC;

function shiftKey(originalKey: string, semitones: number): string {
  const normalized = ENHARMONIC[originalKey] ?? originalKey;
  const idx = CHROMATIC.indexOf(normalized);
  if (idx === -1) return originalKey;
  return CHROMATIC[((idx + semitones) % 12 + 12) % 12];
}

// ─── Instrument icon colour map ───────────────────────────────────────────────
const TRACK_COLORS: Record<string, string> = {
  guitar: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/30",
  piano:  "from-violet-500/20 to-violet-500/5 border-violet-500/30",
  bass:   "from-amber-500/20 to-amber-500/5 border-amber-500/30",
  drums:  "from-rose-500/20 to-rose-500/5 border-rose-500/30",
  vocal:  "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30",
  synth:  "from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-500/30",
};
const TRACK_ACCENT: Record<string, string> = {
  guitar: "bg-cyan-500",
  piano:  "bg-violet-500",
  bass:   "bg-amber-500",
  drums:  "bg-rose-500",
  vocal:  "bg-emerald-500",
  synth:  "bg-fuchsia-500",
};

// ─── Chord block colour (Chordify style) ─────────────────────────────────────
const CHORD_PALETTE = [
  "#06b6d4","#8b5cf6","#f59e0b","#10b981","#f43f5e","#a855f7",
  "#3b82f6","#ec4899","#14b8a6","#f97316","#6366f1","#84cc16",
];
const chordColorCache = new Map<string, string>();
let colorIdx = 0;
function chordColor(chord: string): string {
  const root = chord.match(/^[A-G][#b]?/)?.[0] ?? chord;
  if (!chordColorCache.has(root)) {
    chordColorCache.set(root, CHORD_PALETTE[colorIdx % CHORD_PALETTE.length]);
    colorIdx++;
  }
  return chordColorCache.get(root)!;
}

// ─── Beat width constants ─────────────────────────────────────────────────────
const BEAT_WIDTH = 88;   // px per beat
const PLAYHEAD_X = 220;  // px from left where playhead sits

// ─── Component ───────────────────────────────────────────────────────────────
export function PlayerPage() {
  const { id } = useParams();
  const { data: song, isLoading } = useGetSong(Number(id), {
    query: { enabled: !!id, queryKey: getGetSongQueryKey(Number(id)) },
  });

  const [isPlaying, setIsPlaying]       = useState(false);
  const [currentTime, setCurrentTime]   = useState(0);
  const [tempoScale, setTempoScale]     = useState(1.0);   // multiplier
  const [transpose, setTranspose]       = useState(0);     // semitones
  const [trackVolumes, setTrackVolumes] = useState<Record<number, number>>({});
  const [trackMuted, setTrackMuted]     = useState<Record<number, boolean>>({});
  const [trackSolo, setTrackSolo]       = useState<Record<number, boolean>>({});

  const timelineRef   = useRef<HTMLDivElement>(null);
  const lyricsRef     = useRef<HTMLDivElement>(null);
  const animFrameRef  = useRef<number>(0);
  const lastTick      = useRef<number>(0);

  // ── Init track state from song ──────────────────────────────────────────
  useEffect(() => {
    if (!song?.tracks) return;
    const vols: Record<number, number> = {};
    const muted: Record<number, boolean> = {};
    const solo: Record<number, boolean> = {};
    song.tracks.forEach((t) => {
      vols[t.id]  = t.volume;
      muted[t.id] = t.muted;
      solo[t.id]  = false;
    });
    setTrackVolumes(vols);
    setTrackMuted(muted);
    setTrackSolo(solo);
  }, [song]);

  // ── Playback loop ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isPlaying || !song) return;

    const tick = (now: number) => {
      if (lastTick.current === 0) lastTick.current = now;
      const delta = (now - lastTick.current) / 1000;
      lastTick.current = now;
      setCurrentTime((prev) => {
        const next = prev + delta * tempoScale;
        if (next >= song.duration) { setIsPlaying(false); return 0; }
        return next;
      });
      animFrameRef.current = requestAnimationFrame(tick);
    };

    lastTick.current = 0;
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, song, tempoScale]);

  // ── Timeline auto-scroll ────────────────────────────────────────────────
  useEffect(() => {
    if (!timelineRef.current || !song) return;
    const bps = (song.bpm * tempoScale) / 60;
    const pxPos = currentTime * bps * BEAT_WIDTH;
    const targetScroll = Math.max(0, pxPos - PLAYHEAD_X);
    timelineRef.current.scrollLeft = targetScroll;
  }, [currentTime, song, tempoScale]);

  // ── Lyrics auto-scroll ──────────────────────────────────────────────────
  useEffect(() => {
    if (!lyricsRef.current || !song?.lyrics?.length) return;
    const activeIdx = getActiveLyricIndex(song.lyrics as LyricLine[], currentTime);
    if (activeIdx < 0) return;
    const el = lyricsRef.current.querySelector(`[data-lyric="${activeIdx}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentTime, song]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const bpmDisplay = Math.round((song?.bpm ?? 120) * tempoScale);

  // ─────────────────────────────────────────────────────────────────────────
  if (isLoading || !song) {
    return (
      <div className="p-6 h-full flex flex-col gap-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="flex-1 grid grid-cols-3 gap-4">
          <Skeleton className="col-span-2 h-full rounded-xl" />
          <Skeleton className="h-full rounded-xl" />
        </div>
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  const lyrics    = (song.lyrics    ?? []) as LyricLine[];
  const timeline  = (song.chordTimeline ?? []) as ChordMeasure[];
  const tracks    = (song.tracks    ?? []) as AudioTrack[];

  const activeChordIdx = getActiveChordIndex(timeline, currentTime);
  const activeLyricIdx = getActiveLyricIndex(lyrics, currentTime);

  // Group timeline by measure
  const measures = groupByMeasure(timeline);
  const totalBeats = timeline.length > 0
    ? Math.max(...timeline.map((c) => (c.measure - 1) * 4 + c.beat))
    : 0;
  const timelineWidth = (totalBeats + 4) * BEAT_WIDTH;

  const hasSolo = Object.values(trackSolo).some(Boolean);

  return (
    <div
      className="h-full flex flex-col bg-background overflow-hidden select-none"
      data-testid="player-page"
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4 px-5 py-3 border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-4 min-w-0">
          {/* Cover */}
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center ring-1 ring-border">
            {song.coverUrl
              ? <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />
              : <Music2 className="w-5 h-5 text-muted-foreground" />
            }
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-base leading-tight truncate">{song.title}</h1>
            <p className="text-muted-foreground text-sm truncate">{song.artist}</p>
          </div>
        </div>

        {/* Tempo + Transpose controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Tempo */}
          <div
            className="flex items-center gap-2 bg-muted/60 border border-border rounded-lg px-3 py-1.5"
            data-testid="tempo-control"
          >
            <Gauge className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-xs text-muted-foreground font-medium w-5 text-center">BPM</span>
            <span className="font-mono text-sm font-bold text-foreground w-8 text-center">{bpmDisplay}</span>
            <div className="flex flex-col gap-0.5">
              <button
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setTempoScale((p) => Math.min(2, +(p + 0.05).toFixed(2)))}
                data-testid="button-tempo-up"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
              <button
                className="text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setTempoScale((p) => Math.max(0.3, +(p - 0.05).toFixed(2)))}
                data-testid="button-tempo-down"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
            <button
              className="text-muted-foreground hover:text-primary transition-colors ml-0.5"
              onClick={() => setTempoScale(1)}
              data-testid="button-tempo-reset"
              title="Reset tempo"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Transpose */}
          <div
            className="flex items-center gap-2 bg-muted/60 border border-border rounded-lg px-3 py-1.5"
            data-testid="transpose-control"
          >
            <Music2 className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            <span className="text-xs text-muted-foreground font-medium">KEY</span>
            <span className="font-mono text-sm font-bold text-accent w-8 text-center">
              {shiftKey(song.key, transpose)}
            </span>
            <button
              className="text-muted-foreground hover:text-accent transition-colors"
              onClick={() => setTranspose((p) => p - 1)}
              data-testid="button-transpose-down"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              className="text-muted-foreground hover:text-accent transition-colors"
              onClick={() => setTranspose((p) => p + 1)}
              data-testid="button-transpose-up"
            >
              <Plus className="w-3 h-3" />
            </button>
            {transpose !== 0 && (
              <button
                className="text-muted-foreground hover:text-accent transition-colors"
                onClick={() => setTranspose(0)}
                data-testid="button-transpose-reset"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Chord Timeline (Chordify-style) ─────────────────────────────── */}
      <div
        className="flex-shrink-0 relative bg-[#0a0e1a] border-b border-border"
        style={{ height: 100 }}
        data-testid="chord-timeline"
      >
        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 z-20 pointer-events-none"
          style={{ left: PLAYHEAD_X }}
        >
          <div className="w-px h-full bg-primary/80 shadow-[0_0_8px_hsl(190_90%_50%/0.8)]" />
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0"
            style={{
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "7px solid hsl(190 90% 50%)",
            }}
          />
        </div>

        {/* Scrolling area */}
        <div
          ref={timelineRef}
          className="h-full overflow-x-auto overflow-y-hidden scrollbar-none"
          style={{ scrollbarWidth: "none" }}
          data-testid="chord-timeline-scroll"
        >
          <div
            className="h-full relative flex flex-col"
            style={{ width: timelineWidth, minWidth: "100%" }}
          >
            {/* Measure / beat row */}
            <div className="h-7 flex items-end border-b border-border/40 relative">
              {measures.map(([measureNum, beats]) => {
                const firstBeat = beats[0];
                const measureBeatOffset = (firstBeat.measure - 1) * 4 + (firstBeat.beat - 1);
                return (
                  <div
                    key={measureNum}
                    className="absolute flex items-end"
                    style={{ left: measureBeatOffset * BEAT_WIDTH }}
                  >
                    {/* Measure number label */}
                    <div className="absolute top-1 left-1 text-[9px] font-mono text-muted-foreground/50 tracking-widest uppercase select-none">
                      M{measureNum}
                    </div>
                    {/* Beat tick marks */}
                    {beats.map((beat) => {
                      const beatOffset = (beat.measure - 1) * 4 + (beat.beat - 1);
                      return (
                        <div
                          key={beat.beat}
                          className={cn(
                            "absolute bottom-0 w-px",
                            beat.beat === 1 ? "h-4 bg-border/60" : "h-2 bg-border/25"
                          )}
                          style={{ left: beatOffset * BEAT_WIDTH - measureBeatOffset * BEAT_WIDTH }}
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Chord blocks row */}
            <div className="flex-1 relative">
              {timeline.map((item, idx) => {
                const beatOffset = (item.measure - 1) * 4 + (item.beat - 1);
                const isActive = idx === activeChordIdx;
                const color = chordColor(item.chord);
                const transposedChord = transposeChord(item.chord, transpose);

                // Width: distance to next block or default
                const nextItem = timeline[idx + 1];
                const nextOffset = nextItem
                  ? (nextItem.measure - 1) * 4 + (nextItem.beat - 1)
                  : beatOffset + 1;
                const blockWidth = (nextOffset - beatOffset) * BEAT_WIDTH - 3;

                return (
                  <motion.div
                    key={idx}
                    className="absolute top-1.5 rounded-md cursor-pointer overflow-hidden"
                    style={{
                      left: beatOffset * BEAT_WIDTH + 1.5,
                      width: blockWidth,
                      bottom: 6,
                      backgroundColor: isActive ? color : `${color}22`,
                      borderWidth: 1,
                      borderColor: isActive ? color : `${color}55`,
                      boxShadow: isActive ? `0 0 12px ${color}80, 0 0 4px ${color}60` : "none",
                    }}
                    animate={{
                      scale: isActive ? 1.04 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    data-testid={`chord-block-${idx}`}
                  >
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        background: `linear-gradient(160deg, ${color}55 0%, transparent 60%)`,
                      }}
                    />
                    <span
                      className={cn(
                        "relative z-10 flex items-center justify-center h-full font-bold font-mono tracking-tight",
                        isActive ? "text-white" : "text-white/60",
                        blockWidth < 64 ? "text-xs" : "text-sm"
                      )}
                    >
                      {transposedChord}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0a0e1a] to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0e1a] to-transparent pointer-events-none z-10" />
      </div>

      {/* ── Main Content: Lyrics + Mixer ────────────────────────────────── */}
      <div className="flex-1 flex gap-0 min-h-0 overflow-hidden">

        {/* Lyrics Panel */}
        <div
          className="flex-1 flex flex-col min-h-0 border-r border-border"
          data-testid="lyrics-panel"
        >
          <div className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border-b border-border/50 bg-card/30">
            <Mic2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Lyrics</span>
          </div>

          <div
            ref={lyricsRef}
            className="flex-1 overflow-y-auto overflow-x-hidden py-6 px-6 space-y-1"
            style={{ scrollbarWidth: "thin", scrollbarColor: "hsl(230 35% 20%) transparent" }}
          >
            {lyrics.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No lyrics available
              </div>
            ) : (
              lyrics.map((line, i) => {
                const isActive = i === activeLyricIdx;
                const isPast   = i < activeLyricIdx;

                return (
                  <motion.div
                    key={i}
                    data-lyric={i}
                    data-testid={`lyric-line-${i}`}
                    className="py-2 px-3 rounded-lg transition-all duration-500 cursor-default"
                    animate={{
                      opacity: isActive ? 1 : isPast ? 0.3 : 0.55,
                      scale: isActive ? 1.02 : 1,
                      x: isActive ? 4 : 0,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    {/* Chord tags above line */}
                    {line.chords && line.chords.length > 0 && (
                      <div className="flex gap-2 mb-1">
                        {line.chords.map((c, j) => (
                          <span
                            key={j}
                            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: `${chordColor(c)}22`,
                              color: chordColor(c),
                              border: `1px solid ${chordColor(c)}44`,
                            }}
                          >
                            {transposeChord(c, transpose)}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Lyric text */}
                    <div
                      className={cn(
                        "font-medium leading-snug transition-all duration-300",
                        isActive
                          ? "text-foreground text-xl"
                          : "text-muted-foreground text-lg"
                      )}
                      dir="auto"
                    >
                      {isActive ? (
                        <span
                          className="relative"
                          style={{
                            textShadow: "0 0 20px hsl(190 90% 50% / 0.4)",
                          }}
                        >
                          {line.text}
                          <motion.div
                            className="absolute -bottom-0.5 left-0 h-0.5 bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{
                              duration:
                                lyrics[i + 1]
                                  ? lyrics[i + 1].time - line.time
                                  : 4,
                              ease: "linear",
                            }}
                          />
                        </span>
                      ) : (
                        line.text
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
            <div className="h-20" />
          </div>
        </div>

        {/* Mixer Panel */}
        <div
          className="w-72 flex-shrink-0 flex flex-col min-h-0 bg-card/20"
          data-testid="mixer-panel"
        >
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-card/30">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">Mixer</span>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {tracks.map((track) => {
              const color   = TRACK_ACCENT[track.instrument] ?? "bg-primary";
              const grad    = TRACK_COLORS[track.instrument] ?? "from-primary/20 to-primary/5 border-primary/30";
              const isMuted = trackMuted[track.id] ?? false;
              const isSolo  = trackSolo[track.id] ?? false;
              const isAudible = isSolo || (!hasSolo && !isMuted);
              const vol     = trackVolumes[track.id] ?? track.volume;

              return (
                <div
                  key={track.id}
                  className={cn(
                    "rounded-xl border bg-gradient-to-br p-3 transition-all duration-300",
                    grad,
                    !isAudible && "opacity-40"
                  )}
                  data-testid={`track-${track.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Activity dot */}
                      <motion.div
                        className={cn("w-2 h-2 rounded-full flex-shrink-0", color)}
                        animate={isAudible && isPlaying
                          ? { opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }
                          : { opacity: 0.4, scale: 1 }
                        }
                        transition={{ repeat: Infinity, duration: 0.8 + Math.random() * 0.4 }}
                      />
                      <span className="text-xs font-semibold truncate text-foreground/90">
                        {track.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        className={cn(
                          "w-6 h-6 text-[9px] font-black rounded flex items-center justify-center transition-colors border",
                          isSolo
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                            : "border-border text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setTrackSolo((p) => ({ ...p, [track.id]: !p[track.id] }))}
                        data-testid={`button-solo-${track.id}`}
                      >
                        S
                      </button>
                      <button
                        className={cn(
                          "w-6 h-6 text-[9px] font-black rounded flex items-center justify-center transition-colors border",
                          isMuted
                            ? "bg-destructive/20 text-destructive border-destructive/50"
                            : "border-border text-muted-foreground hover:text-foreground"
                        )}
                        onClick={() => setTrackMuted((p) => ({ ...p, [track.id]: !p[track.id] }))}
                        data-testid={`button-mute-${track.id}`}
                      >
                        M
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isMuted
                      ? <VolumeX className="w-3 h-3 text-muted-foreground/50 flex-shrink-0" />
                      : <Volume2 className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    }
                    <Slider
                      value={[vol]}
                      max={100}
                      step={1}
                      className="flex-1"
                      onValueChange={([v]) =>
                        setTrackVolumes((p) => ({ ...p, [track.id]: v }))
                      }
                      data-testid={`slider-volume-${track.id}`}
                    />
                    <span className="text-[9px] font-mono text-muted-foreground w-5 text-right">
                      {vol}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Transport Bar ────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 border-t border-border bg-card/70 backdrop-blur-sm px-5 py-3 flex flex-col gap-3"
        data-testid="transport-bar"
      >
        {/* Progress */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground w-10 text-right tabular-nums">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 relative">
            <Slider
              value={[currentTime]}
              max={song.duration}
              step={0.1}
              className="flex-1"
              onValueChange={([v]) => setCurrentTime(v)}
              data-testid="slider-progress"
            />
          </div>
          <span className="text-xs font-mono text-muted-foreground w-10 tabular-nums">
            {formatTime(song.duration)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          {/* Left: meta */}
          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground w-40">
            {activeChordIdx >= 0 && (
              <motion.span
                key={activeChordIdx}
                className="px-2 py-1 rounded font-bold text-sm"
                style={{
                  backgroundColor: `${chordColor(timeline[activeChordIdx]?.chord ?? "")}22`,
                  color: chordColor(timeline[activeChordIdx]?.chord ?? ""),
                  border: `1px solid ${chordColor(timeline[activeChordIdx]?.chord ?? "")}55`,
                }}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {transposeChord(timeline[activeChordIdx]?.chord ?? "", transpose)}
              </motion.span>
            )}
          </div>

          {/* Center: transport buttons */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-rewind"
            >
              <ChevronsLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentTime(0)}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-skip-back"
            >
              <SkipBack className="w-5 h-5" />
            </Button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
              onClick={() => setIsPlaying((p) => !p)}
              data-testid="button-play-pause"
            >
              <AnimatePresence mode="wait" initial={false}>
                {isPlaying ? (
                  <motion.div key="pause" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
                    <Pause className="w-6 h-6 fill-current" />
                  </motion.div>
                ) : (
                  <motion.div key="play" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
                    <Play className="w-6 h-6 fill-current ml-1" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-skip-forward"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentTime(Math.min(song.duration, currentTime + 10))}
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-fast-forward"
            >
              <ChevronsRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Right: tempo percent display */}
          <div className="flex items-center justify-end gap-2 w-40 text-xs font-mono text-muted-foreground">
            {tempoScale !== 1 && (
              <span className="px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30">
                {Math.round(tempoScale * 100)}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface LyricLine  { time: number; text: string; chords: string[] }
interface ChordMeasure { measure: number; beat: number; chord: string; time: number }
interface AudioTrack { id: number; instrument: string; label: string; volume: number; muted: boolean }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getActiveChordIndex(timeline: ChordMeasure[], currentTime: number): number {
  let idx = -1;
  for (let i = 0; i < timeline.length; i++) {
    if (timeline[i].time <= currentTime) idx = i;
    else break;
  }
  return idx;
}

function getActiveLyricIndex(lyrics: LyricLine[], currentTime: number): number {
  let idx = -1;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].time <= currentTime) idx = i;
    else break;
  }
  return idx;
}

function groupByMeasure(timeline: ChordMeasure[]): [number, ChordMeasure[]][] {
  const map = new Map<number, ChordMeasure[]>();
  for (const item of timeline) {
    if (!map.has(item.measure)) map.set(item.measure, []);
    map.get(item.measure)!.push(item);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a - b);
}
