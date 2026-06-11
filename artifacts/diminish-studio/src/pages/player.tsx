import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "wouter";
import { useGetSong, getGetSongQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

// Imports from our new split files
import { 
  getActiveIdx, 
  shiftKey, 
  shiftChord,
  BEAT_W, 
  HEAD_X,
  LyricLine,
  ChordBeat,
  AudioTrack
} from "@/lib/player-utils";

import { PlayerHeader } from "@/components/player/PlayerHeader";
import { ChordTimeline } from "@/components/player/ChordTimeline";
import { LyricsPanel } from "@/components/player/LyricsPanel";
import { MixerDrawer } from "@/components/player/MixerDrawer";
import { TransportControls } from "@/components/player/TransportControls";
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
  const rafRef      = useRef<number>(0);
  const lastRef     = useRef<number>(0);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (playing) {
      idleTimer.current = setTimeout(() => setUiVisible(false), 3500);
    }
  }, [playing]);

  useEffect(() => { resetIdle(); }, [playing, resetIdle]);
  useEffect(() => () => { if (idleTimer.current) clearTimeout(idleTimer.current); }, []);

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
      <PlayerHeader 
        song={song} 
        uiVisible={uiVisible} 
        mixerOpen={mixerOpen} 
        setMixerOpen={setMixerOpen} 
        resetIdle={resetIdle} 
      />

      <ChordTimeline 
        timelineRef={timelineRef} 
        totalW={totalW} 
        totalBeats={totalBeats} 
        beatToChord={beatToChord} 
        semitones={semitones} 
        currentBeat={currentBeat} 
      />

      <LyricsPanel 
        lyricsRef={lyricsRef} 
        lyrics={lyrics} 
        activeLi={activeLi} 
        time={time} 
      />

      <MixerDrawer 
        mixerOpen={mixerOpen} 
        setMixerOpen={setMixerOpen} 
        tracks={tracks} 
        muted={muted} 
        setMuted={setMuted} 
        volumes={volumes} 
        setVolumes={setVolumes} 
      />

      <TransportControls 
        uiVisible={uiVisible} 
        time={time} 
        setTime={setTime} 
        song={song} 
        resetIdle={resetIdle} 
        tempoDrag={tempoDrag} 
        bpmDisplay={bpmDisplay} 
        tempo={tempo} 
        setTempo={setTempo} 
        playing={playing} 
        setPlaying={setPlaying} 
        keyDrag={keyDrag} 
        keyDisplay={keyDisplay} 
        semitones={semitones} 
        setSemitones={setSemitones} 
      />
    </div>
  );
}
