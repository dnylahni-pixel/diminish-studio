import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetSongDetailsQueryKey,
  useAnalyzeSong,
  useGetSongDetails,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { audioEngine } from "@/lib/AudioEngine";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";
import { useRuntimeConfig } from "@/lib/runtime-config";
import { Sparkles, Loader2 } from "lucide-react";

import {
  getActiveIdx,
  shiftKey,
  shiftChord,
  BEAT_W,
  HEAD_X,
  LyricLine,
  ChordBeat,
  AudioTrack,
  ChordLevel
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
  const songId = Number(id);
  const { data: song, isLoading } = useGetSongDetails(songId);

  const [playing,     setPlaying]     = useState(false);
  const timeRef = useRef(0);
  const [displayTime, setDisplayTime] = useState(0);
  const [tempo,       setTempo]       = useState(1.0);
  const [semitones,   setSemitones]   = useState(0);
  const [mixerOpen,   setMixerOpen]   = useState(false);
  const [volumes,     setVolumes]     = useState<Record<number, number>>({});
  const [muted,       setMuted]       = useState<Record<number, boolean>>({});
  const [uiVisible,   setUiVisible]   = useState(true);
  const [loadProgress, setLoadProgress] = useState<{ loaded: number; total: number }>({ loaded: 0, total: 0 });
  const [tracksReady,  setTracksReady]  = useState(false);

  const [chordLevel,  setChordLevel]  = useState<ChordLevel>("pro");

  const queryClient = useQueryClient();
  const analyzeMutation = useAnalyzeSong({
    mutation: {
      onSuccess: () =>
        queryClient.invalidateQueries({
          queryKey: getGetSongDetailsQueryKey(songId),
        }),
    },
  });
  const analyzing = analyzeMutation.isPending;
  const timelineRef = useRef<HTMLDivElement>(null);
  const lyricsRef   = useRef<HTMLDivElement>(null);
  const idleTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevBeat    = useRef(-1);
  const prevWindowStart = useRef(0);


  // ── init volumes/muted from song ─────────────────────────────────────────
  useEffect(() => {
    if (!song?.tracks) return;
    const v: Record<number, number> = {}, m: Record<number, boolean> = {};
    (song.tracks as AudioTrack[]).forEach(t => { v[t.id] = t.volume; m[t.id] = t.muted; });
    setVolumes(v); setMuted(m);
  }, [song]);

  // ── load stems into AudioEngine ──────────────────────────────────────────
useEffect(() => {
  if (!song?.tracks) return;

  setTracksReady(false);
  setLoadProgress({ loaded: 0, total: (song.tracks as AudioTrack[]).length });

  audioEngine.onLoadProgress(() => {
    const progress = audioEngine.getLoadingProgress();
    setLoadProgress(progress);
    if (progress.total > 0 && progress.loaded === progress.total) {
      setTracksReady(true);
    }
  });

  (song.tracks as AudioTrack[]).forEach(track => {
    audioEngine.loadTrack(String(track.id), track.streamUrl);
  });
}, [song]);

  // ── sync volumes/mute state -> AudioEngine ───────────────────────────────
  useEffect(() => {
    Object.entries(volumes).forEach(([id, v]) => {
      audioEngine.setVolume(id, v / 100);
    });
  }, [volumes]);

  useEffect(() => {
    Object.entries(muted).forEach(([id, m]) => {
      audioEngine.setMuted(id, m);
    });
  }, [muted]);

  // ── master clock: read from AudioEngine every frame ──────────────────────
  useAnimationFrame(() => {
  if (!song) return;
  const t = audioEngine.getCurrentTime();
  timeRef.current = t;
  setDisplayTime(t);

  // اگه engine خودش دیگه پلی نیست (مثلاً به‌خاطر پایان طبیعی آهنگ)، React state رو sync کن
  if (!audioEngine.getIsPlaying() && playing) {
    setPlaying(false);
    return;
  }

  if (t >= song.duration) {
    audioEngine.pause();
    setPlaying(false);
  }
}, playing);

// ── timeline auto-scroll (SMART PAGE TURN, measure-aware, half-window slide) ──────────────
  useEffect(() => {
    if (!timelineRef.current || !song?.beatGrid) return;

    const beatIdx = getActiveIdx(song.beatGrid, displayTime);
    if (beatIdx < 0) return;

    const container = timelineRef.current;
    const grid = song.beatGrid;
    const containerWidth = container.clientWidth || 800;
    const visibleBeats = Math.max(4, Math.floor(containerWidth / BEAT_W) - 1); // -1 برای حاشیهی نیم‌بیتی هر طرف

    const windowStart = prevWindowStart.current;
    const halfWindow = Math.floor(visibleBeats / 2);
    const windowEnd = windowStart + visibleBeats;

    // اگه نشانگر کاملاً بیرون از پنجره‌ی فعلیه (seek دستی به جلو یا عقب)، فوراً ریست کن
    const isOutsideWindow = beatIdx < windowStart || beatIdx >= windowEnd;

    if (isOutsideWindow) {
      let resetStart = Math.max(0, beatIdx - halfWindow);
      while (resetStart > 0 && grid[resetStart]?.beat !== 1) {
        resetStart--;
      }
      prevWindowStart.current = resetStart;
      const resetScroll = Math.max(0, (resetStart - 0.5) * BEAT_W);
      container.scrollTo({ left: resetScroll, behavior: "smooth" });
      return;
    }

    const triggerRatio = 0.8; // درصدی از پنجره که نشانگر باید طی کنه قبل از جهش (۰.۵ = وسط، ۰.۶ = کمی جلوتر از وسط)
    const triggerPoint = windowStart + Math.floor(visibleBeats * triggerRatio);

    if (beatIdx < triggerPoint) return;

    // باید جهش کنیم: نقطه‌ی شروع جدید = windowStart + halfWindow، اما اسنپ‌شده به نزدیک‌ترین شروع میزان
    let newStart = windowStart + halfWindow;
    while (newStart < grid.length && grid[newStart]?.beat !== 1) {
      newStart++;
    }
    if (newStart >= grid.length || newStart <= windowStart) newStart = beatIdx; // fallback ایمن

    prevWindowStart.current = newStart;

    const targetScroll = Math.max(0, (newStart - 0.5) * BEAT_W);
    container.scrollTo({ left: targetScroll, behavior: "smooth" });
  }, [displayTime, song]);


  
  // ── lyrics auto-scroll ────────────────────────────────────────────────────
  useEffect(() => {
    if (!lyricsRef.current || !song?.lyrics?.length) return;
    const ai = getActiveIdx(song.lyrics as LyricLine[], displayTime);
    if (ai < 0) return;
    lyricsRef.current.querySelector(`[data-li="${ai}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [displayTime, song]);

  // ── idle UI ───────────────────────────────────────────────────────────────
  const resetIdle = useCallback(() => {
    setUiVisible(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (playing) {
      idleTimer.current = setTimeout(() => setUiVisible(false), 3500);
    }
  }, [playing]);

  useEffect(() => { resetIdle(); }, [playing, resetIdle]);
  useEffect(() => () => { if (idleTimer.current) clearTimeout(idleTimer.current); }, []);

  // ── cleanup audio on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      audioEngine.pause();
      setPlaying(false);
      timeRef.current = 0;
      setDisplayTime(0);
    };
  }, []);

  const runtimeConfig = useRuntimeConfig();
  const tempoDrag = useDragChange(tempo, setTempo, 6, 0.05, runtimeConfig.player.speedMin, runtimeConfig.player.speedMax);
  const keyDrag   = useDragChange(semitones, setSemitones, 14, 1, runtimeConfig.player.semitonesMin, runtimeConfig.player.semitonesMax);

  // ── analyze handler ──────────────────────────────────────────────────────
  const handleAnalyze = useCallback(async () => {
    try {
      await analyzeMutation.mutateAsync({ id: songId });
    } catch (e: any) {
      console.error("Analyze failed:", e);
    }
  }, [analyzeMutation, songId]);

  // ── transport handlers (wired to AudioEngine) ────────────────────────────
  const handlePlayPause = useCallback(() => {
  // همیشه از وضعیت واقعی engine بپرس، نه از React state که ممکنه stale باشه
  const actuallyPlaying = audioEngine.getIsPlaying();
  if (actuallyPlaying) {
    audioEngine.pause();
    setPlaying(false);
  } else {
    const ok = audioEngine.play(timeRef.current);
    setPlaying(ok);
  }
}, []);

  const handleSeek = useCallback((newTime: number) => {
    audioEngine.seek(newTime);
    timeRef.current = newTime;
    setDisplayTime(newTime);
  }, []);

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
  const beatGrid = song?.beatGrid || [];
  const tracks   = (song.tracks        ?? []) as AudioTrack[];

  const activeLi   = getActiveIdx(lyrics, displayTime);
  const bpmDisplay = Math.round(song.bpm * tempo);
  const keyDisplay = shiftKey(song.key, semitones);

  const totalBeats = song?.beatGrid?.length || 0;

  const beatToChord: string[] = Array(totalBeats).fill("");

if (song?.beatGrid && timeline.length > 0) {
    const chordLookup = new Map();
    timeline.forEach((c: any) => chordLookup.set(`${c.measure}-${c.beat}`, c.chord));

    let lastChord = "";
    for (let beatIndex = 0; beatIndex < totalBeats; beatIndex++) {
      const b = song.beatGrid[beatIndex];
      const currentChord = chordLookup.get(`${b.measure}-${b.beat}`);
      
      if (currentChord !== undefined) {
        lastChord = currentChord;
      }
      
      beatToChord[beatIndex] = shiftChord(lastChord, semitones, chordLevel);
    }
  }

  const currentBeat = getActiveIdx(beatGrid, displayTime);

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

      {/* Analyze button — only shown when no beatGrid/chordTimeline exists */}
      {(!song.beatGrid || song.beatGrid.length === 0) && (
        <div className="flex-shrink-0 flex items-center justify-center px-4 py-2">
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 transition-colors disabled:opacity-60"
            data-testid="btn-analyze"
          >
            {analyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {analyzing ? "Analyzing..." : "Analyze Song"}
          </button>
        </div>
      )}

      {/* Chord complexity level toggle */}
      {song.beatGrid && song.beatGrid.length > 0 && (
        <div className="flex-shrink-0 flex items-center justify-center gap-1 px-4 py-1">
          {(runtimeConfig.player.chordLevels as ChordLevel[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setChordLevel(lvl)}
              className={`text-xs font-medium px-3 py-1 rounded-md transition-colors ${
                chordLevel === lvl
                  ? "bg-amber-500/20 text-amber-600"
                  : "text-muted-foreground hover:bg-muted"
              }`}
              data-testid={`btn-chord-level-${lvl}`}
            >
              {lvl === "simple" ? "ساده" : lvl === "medium" ? "متوسط" : "حرفه‌ای"}
            </button>
          ))}
        </div>
      )}

      <ChordTimeline
        timelineRef={timelineRef}
        totalW={totalW}
        totalBeats={totalBeats}
        beatToChord={beatToChord}
        semitones={semitones}
        currentBeat={currentBeat}
        beatGrid={beatGrid}
        timeSignature={song.timeSignature}
      />

      <LyricsPanel
        lyricsRef={lyricsRef}
        lyrics={lyrics}
        activeLi={activeLi}
        time={displayTime}
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
  time={displayTime}
  setTime={handleSeek}
  song={song}
  resetIdle={resetIdle}
  tempoDrag={tempoDrag}
  bpmDisplay={bpmDisplay}
  tempo={tempo}
  setTempo={setTempo}
  playing={playing}
  setPlaying={handlePlayPause}
  keyDrag={keyDrag}
  keyDisplay={keyDisplay}
  semitones={semitones}
  setSemitones={setSemitones}
  tracksReady={tracksReady}
  loadProgress={loadProgress}
/>
    </div>
  );
}
