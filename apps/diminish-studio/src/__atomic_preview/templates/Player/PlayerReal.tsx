/**
 * TEMPLATE: PlayerReal - P0 REAL PLAYER (atomic style + backend wiring)
 * Uses GET /song-details/:id (useGetSongDetails) + POST /songs/:id/analyze + AudioEngine
 * Visual: atomic tokens + ChordStrip/TransportBar/MetronomeSheet/KeySheet etc. from sidebar-atomic parts
 * Data: real bpm/key/duration/beatGrid/chordTimeline/lyrics/tracks/masterTrackUrl (no mock trackAnalysis)
 * Audio: real AudioEngine.getCurrentTime(), load/ play/ pause/ seek/ volume/ mute
 */
import * as React from "react";
import { Theme, ThemeTokens, motion } from "../../tokens";
import { useGetSongDetails, useAnalyzeSong, getGetSongDetailsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { audioEngine } from "../../lib/AudioEngine";
import { useAnimationFrame } from "../../hooks/useAnimationFrame";
import { useRuntimeConfig } from "@/lib/runtime-config";
import {
  getActiveIdx,
  shiftKey,
  shiftChord,
  CHROMATIC,
  ENHARMONIC,
  type ChordLevel,
} from "../../lib/player-utils";

import { ChordStrip } from "./parts/ChordStrip";
import { LyricsView } from "./parts/LyricsView";
import { SectionsView, SectionChips, type SongSection } from "./parts/SectionsView";
import { TransportBar } from "./parts/TransportBar";
import { PlayerActions } from "./parts/PlayerActions";
import { MetronomeSheet } from "./parts/MetronomeSheet";
import { KeySheet } from "./parts/KeySheet";
import { LRSheet } from "./parts/LRSheet";
import { TrackMenuSheet } from "./parts/TrackMenuSheet";
import { Marquee, NOTES, clamp, keyNameOf } from "./parts/ui";
import { ChevronDownIcon, CastIcon, MoreIcon, SparkIcon, CheckIcon } from "./parts/icons";
import { Slider } from "../../molecules/Slider/Slider";
import { MicIcon, DrumsIcon, GuitarIcon, BassIcon, PianoIcon, StringsIcon } from "./parts/icons";

type PlayerRealProps = {
  theme: Theme;
  tokens: ThemeTokens;
  songId: number | null;
  open: boolean;
  onClose: () => void;
  /** optional external action (toast etc) */
  onAction?: (action: string) => void;
};

// helper: map instrument string -> icon component
function iconForInstrument(instrument: string): React.FC<{ size?: number }> {
  const n = instrument.toLowerCase();
  if (n.includes("vocal") || n.includes("voice") || n.includes("sing")) return MicIcon as any;
  if (n.includes("drum") || n.includes("perc")) return DrumsIcon as any;
  if (n.includes("guitar") || n.includes("gitar")) return GuitarIcon as any;
  if (n.includes("bass")) return BassIcon as any;
  if (n.includes("piano") || n.includes("keys")) return PianoIcon as any;
  if (n.includes("string") || n.includes("violin")) return StringsIcon as any;
  return MicIcon as any;
}

// helper: parse song.key like "C", "C#", "Db" to root index 0-11
function parseKeyRoot(key: string | null | undefined): number {
  if (!key) return 0;
  // take first note token before maybe minor suffix? e.g., "Am", "C#m"
  const m = key.match(/^([A-G][#b]?)/);
  const note = m ? m[1] : key;
  const enh = (ENHARMONIC as Record<string, string>)[note] ?? note;
  const idx = CHROMATIC.indexOf(enh);
  return idx === -1 ? 0 : idx;
}
function isMinorMode(mode: string | null | undefined, key: string | null | undefined): boolean {
  if (mode) return mode.toLowerCase().includes("minor");
  if (!key) return false;
  // heuristic: key string ending with m e.g., "Am"
  return /m$/i.test(key.trim());
}

function keyRootToName(root: number, minor: boolean): string {
  const note = CHROMATIC[((root % 12) + 12) % 12] ?? "C";
  // simple: keep # notation
  return note + (minor ? "m" : "");
}

export const PlayerReal: React.FC<PlayerRealProps> = ({ theme, tokens: tk, songId, open, onClose, onAction }) => {
  const runtimeConfig = useRuntimeConfig();
  const queryClient = useQueryClient();

  // fetch song details (enabled only when open & songId)
  const { data: song, isLoading, isError, error } = useGetSongDetails(songId ?? 0, {
    query: { enabled: !!songId && open },
  } as any);

  const analyzeMutation = useAnalyzeSong({
    mutation: {
      onSuccess: () => {
        if (songId) queryClient.invalidateQueries({ queryKey: getGetSongDetailsQueryKey(songId) });
      },
    },
  } as any);
  const analyzing = (analyzeMutation as any).isPending ?? false;

  // ---- state ----
  const timeRef = React.useRef(0);
  const [displayTime, setDisplayTime] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [tempo, setTempo] = React.useState(1.0);
  const [semitones, setSemitones] = React.useState(0);
  const [chordLevel, setChordLevel] = React.useState<ChordLevel>("pro");

  const [view, setView] = React.useState<"mixer" | "lyrics" | "sections">("mixer");
  const [volumes, setVolumes] = React.useState<Record<number, number>>({});
  const [muted, setMuted] = React.useState<Record<number, boolean>>({});
  const [loadProgress, setLoadProgress] = React.useState<{ loaded: number; total: number }>({ loaded: 0, total: 0 });
  const [tracksReady, setTracksReady] = React.useState(false);

  // atomic sheets / toggles (mirror mock)
  const [metroOn, setMetroOn] = React.useState(true);
  const [metroOpen, setMetroOpen] = React.useState(false);
  const [metroVol, setMetroVol] = React.useState(70);
  const [metroBal, setMetroBal] = React.useState(0);
  const [subdiv, setSubdiv] = React.useState<0.5 | 1 | 2>(1);
  const [keyOpen, setKeyOpen] = React.useState(false);
  const [stemLr, setStemLr] = React.useState<number | null>(null); // track id for L/R
  const [menuOpen, setMenuOpen] = React.useState(false);

  const [loopOn, setLoopOn] = React.useState(false);
  const [loopA, setLoopA] = React.useState<number | null>(null);
  const [loopB, setLoopB] = React.useState<number | null>(null);
  const [countIn, setCountIn] = React.useState(0);
  const [counting, setCounting] = React.useState<number | null>(null);
  const [beatIdx, setBeatIdx] = React.useState(1);

  // drag helpers fallback (old player used useDragChange for tempo/key vertical drag)
  // For atomic we keep simple: tempo drag still via sheet, but keep tempoDrag/keyDrag dummy for compat if needed
  const tempoDrag = {} as any;
  const keyDrag = {} as any;

  // derived real data
  const lyrics = (song?.lyrics ?? []) as any[];
  const chordTimeline = (song?.chordTimeline ?? []) as any[];
  const beatGrid = (song?.beatGrid as any[]) ?? [];
  const rawTracks = (song?.tracks ?? []) as any[];
  const timeSignature = (song?.timeSignature as any) ?? { numerator: 4, denominator: 4 };
  const beatsPerBar = timeSignature?.numerator ?? 4;
  const duration = song?.duration ?? 0;
  const bpm = song?.bpm ?? 120;
  const rawKey = song?.key ?? "C";
  const mode = (song as any)?.mode ?? null;
  const minor = isMinorMode(mode, rawKey);
  const baseKeyRoot = parseKeyRoot(rawKey);
  const keyRoot = (((baseKeyRoot + semitones) % 12) + 12) % 12;
  const keyDisplay = shiftKey(rawKey, semitones);
  const keyLabel = semitones !== 0 ? keyDisplay : null;
  const bpmDisplay = Math.round(bpm * tempo);
  const totalBeats = beatGrid.length;
  // total bars approx
  const barCount = totalBeats > 0 ? Math.max(1, Math.ceil(totalBeats / beatsPerBar)) : 0;

  // build chord lookup per measure-beat for quick access
  const chordLookup = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const c of chordTimeline) {
      map.set(`${c.measure}-${c.beat}`, c.chord);
    }
    return map;
  }, [chordTimeline]);

  // beatToChord like old player (per beat, with hold)
  const beatToChord: string[] = React.useMemo(() => {
    if (!totalBeats) return [];
    const arr: string[] = Array(totalBeats).fill("");
    let lastChord = "";
    for (let bi = 0; bi < totalBeats; bi++) {
      const b = beatGrid[bi];
      if (!b) continue;
      const cur = chordLookup.get(`${b.measure}-${b.beat}`);
      if (cur !== undefined) lastChord = cur;
      arr[bi] = shiftChord(lastChord, semitones, chordLevel);
    }
    return arr;
  }, [totalBeats, beatGrid, chordLookup, semitones, chordLevel]);

  // barChords for ChordStrip / Sections
  const barChords: (string | null)[] = React.useMemo(() => {
    if (barCount === 0) return [];
    const arr: (string | null)[] = [];
    let last: string | null = null;
    for (let bar = 0; bar < barCount; bar++) {
      const measure = bar + 1;
      const chordForBar = chordLookup.get(`${measure}-1`);
      if (chordForBar !== undefined) last = chordForBar;
      const display = last ? shiftChord(last, semitones, chordLevel) : null;
      arr.push(display);
    }
    return arr;
  }, [barCount, chordLookup, semitones, chordLevel]);

  const chordAt = React.useCallback((bar: number) => barChords[bar] ?? null, [barChords]);

  // active beat/bar/lyric
  const currentBeat = React.useMemo(() => getActiveIdx(beatGrid as any, displayTime), [beatGrid, displayTime]);
  const activeBar = currentBeat >= 0 ? Math.floor(currentBeat / beatsPerBar) : 0;
  const activeLi = React.useMemo(() => getActiveIdx(lyrics as any, displayTime), [lyrics, displayTime]);

  // sections derived (synthetic if real sections empty)
  const SECTIONS: SongSection[] = React.useMemo(() => {
    // if real sections has meaningful data, try to map; but schema is generic unknown, so fallback to synthetic with barChords
    // Use same template as mock: Intro 4, Verse 8, Verse 8, Chorus 8, Outro 8 limited to barCount
    // Adjust to ensure total bars matches real barCount
    if (!barCount) return [];
    const defs: { label: string; bars: number; locked?: boolean }[] = [
      { label: "Intro", bars: 4 },
      { label: "Verse", bars: 8 },
      { label: "Verse", bars: 8 },
      { label: "Chorus", bars: 8 },
      { label: "Outro", bars: 8, locked: true },
    ];
    let bar = 0;
    const result: SongSection[] = [];
    for (const d of defs) {
      if (bar >= barCount) break;
      const remaining = barCount - bar;
      const bars = Math.min(d.bars, remaining);
      const chord = d.locked ? null : (barChords[bar] ?? null);
      // lyric per section: pick from real lyrics if available, else mock filler?
      const lyricIdx = result.length % Math.max(1, lyrics.length);
      const lyric = lyrics[lyricIdx]?.text as string | undefined;
      result.push({ label: d.label, bars, chord, lyric, locked: d.locked } as SongSection);
      bar += bars;
    }
    // if still remaining bars, add as extra
    if (bar < barCount) {
      const rem = barCount - bar;
      result.push({ label: "Extra", bars: rem, chord: barChords[bar] ?? null } as SongSection);
    }
    return result;
  }, [barCount, barChords, lyrics]);

  const sectionStarts = React.useMemo(() => {
    let t = 0;
    const starts: number[] = [];
    // estimate time per bar: 60/bpm * beatsPerBar (but with tempo factor)
    const secPerBar = (60 / Math.max(1, bpm)) * beatsPerBar;
    let acc = 0;
    for (const s of SECTIONS) {
      starts.push(acc);
      acc += s.bars * secPerBar;
    }
    // also compute alternative from beatGrid times: use beatGrid times for bar start beat
    if (totalBeats) {
      const startsFromGrid: number[] = [];
      let barCursor = 0;
      for (const s of SECTIONS) {
        const beatIdxForBar = barCursor * beatsPerBar;
        const time = beatGrid[beatIdxForBar]?.time ?? barCursor * secPerBar;
        startsFromGrid.push(time);
        barCursor += s.bars;
      }
      // prefer grid times if they seem valid
      if (startsFromGrid.length === SECTIONS.length) return startsFromGrid;
    }
    return starts;
  }, [SECTIONS, bpm, beatsPerBar, totalBeats, beatGrid]);

  const activeSection = React.useMemo(() => {
    if (!SECTIONS.length) return 0;
    let idx = 0;
    for (let i = 0; i < sectionStarts.length; i++) {
      const s = sectionStarts[i];
      const next = sectionStarts[i + 1] ?? Infinity;
      if (displayTime >= s && displayTime < next) {
        idx = i;
        break;
      }
      if (displayTime >= s) idx = i;
    }
    return Math.max(0, Math.min(idx, SECTIONS.length - 1));
  }, [SECTIONS, sectionStarts, displayTime]);

  // tracks handling: fallback to master if no tracks
  const effectiveTracks: any[] = React.useMemo(() => {
    if (rawTracks && rawTracks.length > 0) return rawTracks;
    if (song?.masterTrackUrl) {
      return [
        {
          id: 0,
          instrument: "master",
          label: "Master",
          volume: 85,
          muted: false,
          streamUrl: song.masterTrackUrl,
          soloable: false,
          pan: 0,
        },
      ];
    }
    return [];
  }, [rawTracks, song?.masterTrackUrl]);

  const trackList = effectiveTracks;

  // memo for metro bpm real
  const metroBpm = React.useMemo(() => bpmDisplay, [bpmDisplay]);
  const baseBpm = bpm;

  // ---- effects: init volumes ----
  React.useEffect(() => {
    if (!effectiveTracks.length) return;
    const v: Record<number, number> = {};
    const m: Record<number, boolean> = {};
    effectiveTracks.forEach((t: any) => {
      v[t.id] = t.volume ?? 80;
      m[t.id] = !!t.muted;
    });
    setVolumes(v);
    setMuted(m);
  }, [song?.id, effectiveTracks]);

  // ---- load stems into AudioEngine ----
  React.useEffect(() => {
    if (!open) return;
    if (!effectiveTracks.length) {
      setLoadProgress({ loaded: 0, total: 0 });
      setTracksReady(false);
      return;
    }
    setTracksReady(false);
    setLoadProgress({ loaded: 0, total: effectiveTracks.length });

    audioEngine.onLoadProgress(() => {
      const p = audioEngine.getLoadingProgress();
      setLoadProgress(p);
      if (p.total > 0 && p.loaded === p.total) setTracksReady(true);
    });

    effectiveTracks.forEach((track: any) => {
      if (track.streamUrl) audioEngine.loadTrack(String(track.id), track.streamUrl);
    });
  }, [song?.id, effectiveTracks, open]);

  // sync volumes
  React.useEffect(() => {
    Object.entries(volumes).forEach(([id, v]) => {
      audioEngine.setVolume(id, (v as number) / 100);
    });
  }, [volumes]);

  React.useEffect(() => {
    Object.entries(muted).forEach(([id, m]) => {
      audioEngine.setMuted(id, m as boolean);
    });
  }, [muted]);

  // time sync via animation frame — real engine
  useAnimationFrame(
    () => {
      if (!song) return;
      const t = audioEngine.getCurrentTime();
      timeRef.current = t;
      setDisplayTime(t);
      if (!audioEngine.getIsPlaying() && playing) {
        setPlaying(false);
        return;
      }
      if (t >= duration && duration > 0) {
        audioEngine.pause();
        setPlaying(false);
      }
    },
    !!playing && !!open
  );

  // metronome clicks (WebAudio) - same as mock
  const audioCtxRef = React.useRef<AudioContext | null>(null);
  const click = React.useCallback(
    (accent: boolean) => {
      try {
        if (!audioCtxRef.current) {
          const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
          audioCtxRef.current = new Ctor();
        }
        const ctx = audioCtxRef.current;
        if (!ctx) return;
        if (ctx.state === "suspended") void ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        let node: AudioNode = gain;
        if ("createStereoPanner" in ctx) {
          const pan = (ctx as any).createStereoPanner();
          pan.pan.value = clamp(metroBal / 100, -1, 1);
          gain.connect(pan);
          node = pan as unknown as AudioNode;
        }
        (node as GainNode).connect(ctx.destination);
        osc.type = "square";
        osc.frequency.value = accent ? 1400 : 900;
        const v = (metroVol / 100) * 0.22;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(Math.max(0.001, v), ctx.currentTime + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.09);
        osc.connect(gain);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } catch {}
    },
    [metroVol, metroBal]
  );

  const beatMs = 60000 / Math.max(1, metroBpm);

  React.useEffect(() => {
    if (!open || !playing || !metroOn || counting !== null) return;
    const iv = window.setInterval(() => {
      setBeatIdx((b) => {
        const next = (b % 4) + 1;
        click(next === 1);
        return next;
      });
    }, beatMs / subdiv);
    return () => window.clearInterval(iv);
  }, [open, playing, metroOn, counting, beatMs, subdiv, click]);

  React.useEffect(() => {
    if (counting === null) return;
    if (counting === 0) {
      setCounting(null);
      if (!playing) handlePlayPause();
      return;
    }
    click(counting === countIn);
    const t = window.setTimeout(() => setCounting((c) => (c === null ? null : c - 1)), beatMs / subdiv);
    return () => window.clearTimeout(t);
  }, [counting]); // eslint-disable-line

  const handlePrimary = () => {
    if (counting !== null) {
      setCounting(null);
      return;
    }
    if (!playing && countIn > 0) {
      setCounting(countIn);
      return;
    }
    handlePlayPause();
  };

  // cleanup on close/unmount
  React.useEffect(() => {
    if (!open) {
      audioEngine.pause();
      setPlaying(false);
      timeRef.current = 0;
      setDisplayTime(0);
    }
    return () => {
      // pause not dispose - keep context alive
    };
  }, [open]);

  React.useEffect(() => {
    return () => {
      audioEngine.pause();
    };
  }, []);

  // handlers
  const handlePlayPause = React.useCallback(() => {
    const actuallyPlaying = audioEngine.getIsPlaying();
    if (actuallyPlaying) {
      audioEngine.pause();
      setPlaying(false);
    } else {
      const ok = audioEngine.play(timeRef.current);
      setPlaying(ok);
    }
  }, []);

  const handleSeek = React.useCallback((newTime: number) => {
    const clamped = clamp(newTime, 0, duration || 0);
    audioEngine.seek(clamped);
    timeRef.current = clamped;
    setDisplayTime(clamped);
  }, [duration]);

  const handleAnalyze = React.useCallback(async () => {
    if (!songId) return;
    try {
      await (analyzeMutation as any).mutateAsync({ id: songId });
    } catch (e) {
      console.error("Analyze failed", e);
    }
  }, [songId, analyzeMutation]);

  // reset when song changes
  React.useEffect(() => {
    setDisplayTime(0);
    timeRef.current = 0;
    setPlaying(false);
    setView("mixer");
    setSemitones(0);
    setTempo(1);
    setChordLevel("pro");
    audioEngine.pause();
  }, [songId]);

  // loop handling
  React.useEffect(() => {
    if (open && loopOn && loopA !== null && loopB !== null && displayTime >= loopB) handleSeek(loopA);
  }, [displayTime, loopOn, loopA, loopB, open, handleSeek]);

  const toggleLoop = () => {
    if (loopOn) {
      setLoopOn(false);
      setLoopA(null);
      setLoopB(null);
      return;
    }
    const a = sectionStarts[Math.min(activeSection, sectionStarts.length - 1)] ?? 0;
    const b = sectionStarts[Math.min(activeSection + 1, sectionStarts.length)] ?? duration;
    setLoopA(a);
    setLoopB(b);
    setLoopOn(true);
  };

  // reset idle not needed atomic; keep playing state

  if (!open) return null;

  // loading / error states
  if (isLoading) {
    return (
      <div
        role="dialog"
        aria-label="Player loading"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 45,
          background: tk.app,
          color: tk.textPrimary,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            border: `3px solid ${tk.borderColor}`,
            borderTopColor: tk.accent,
            animation: "spinSlow 0.9s linear infinite",
          }}
        />
        <div style={{ fontSize: 13, color: tk.textMuted, fontWeight: 500 }}>Loading song…</div>
      </div>
    );
  }

  if (isError || !song) {
    return (
      <div
        role="dialog"
        aria-label="Player error"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 45,
          background: tk.app,
          color: tk.textPrimary,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", flexShrink: 0 }}>
          <button
            onClick={onClose}
            aria-label="Close player"
            style={{
              width: 38,
              height: 38,
              borderRadius: 999,
              border: "none",
              background: "transparent",
              color: tk.textPrimary,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <ChevronDownIcon />
          </button>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Player</span>
        </div>
        <div style={{ flex: 1, display: "grid", placeItems: "center", padding: 24, textAlign: "center" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 650, marginBottom: 6 }}>Failed to load song</div>
            <div style={{ fontSize: 13, color: tk.textMuted, marginBottom: 14 }}>
              {(error as any)?.message ?? "Could not fetch song details."}
            </div>
            <button
              onClick={onClose}
              style={{
                height: 40,
                padding: "0 18px",
                borderRadius: 999,
                border: `1px solid ${tk.borderColor}`,
                background: tk.activeBg,
                color: tk.textPrimary,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // derived for header
  const title = song.title ?? "Untitled";
  const artist = song.artist ?? "";
  const letter = title.trim()[0]?.toUpperCase() ?? "♪";
  const gradient = `linear-gradient(135deg, ${tk.textMuted} 0%, ${tk.textPrimary} 100%)`;

  const stemsReady = tracksReady || (trackList.length === 0 && !!song.masterTrackUrl);
  const hasAnalysis = beatGrid.length > 0;

  // for TransportBar segments (sections)
  const segments = view !== "lyrics" ? sectionStarts : undefined;

  // key label for transport
  const displayKeyLabel = keyLabel ?? (semitones === 0 ? keyNameOf(baseKeyRoot, minor) : keyDisplay);

  return (
    <div
      role="dialog"
      aria-label={`Player - ${title}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 45,
        background: tk.app,
        color: tk.textPrimary,
        animation: "playerIn 0.5s cubic-bezier(0.32,0.72,0,1)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* halo */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: -140,
          left: "50%",
          width: 680,
          height: 420,
          transform: "translateX(-50%)",
          background: gradient,
          filter: "blur(120px)",
          opacity: theme === "dark" ? 0.22 : 0.14,
          pointerEvents: "none",
        }}
      />

      {/* handle */}
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, flexShrink: 0 }} aria-hidden>
        <span style={{ width: 40, height: 4.5, borderRadius: 999, background: tk.textMuted, opacity: 0.7 }} />
      </div>

      {/* top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px 8px", flexShrink: 0 }}>
        <button
          onClick={() => {
            audioEngine.pause();
            setPlaying(false);
            onClose();
          }}
          aria-label="Close player"
          style={{
            width: 38,
            height: 38,
            borderRadius: 999,
            border: "none",
            background: "transparent",
            color: tk.textPrimary,
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: `background 250ms ${motion.easing.lux}`,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = tk.hoverBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <ChevronDownIcon />
        </button>
        <Marquee text={`${title} - ${artist}`} tokens={tk} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            flexShrink: 0,
            padding: "4px 6px",
            borderRadius: 999,
            border: `1.5px solid ${tk.borderColor}`,
            background: "rgba(120,120,128,0.14)",
          }}
        >
          <button
            aria-label="Connect to a device"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: "none",
              background: "transparent",
              color: tk.textPrimary,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <CastIcon size={17} />
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="More options"
            aria-haspopup="dialog"
            style={{
              width: 34,
              height: 34,
              borderRadius: 999,
              border: "none",
              background: "transparent",
              color: tk.textPrimary,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <MoreIcon size={17} />
          </button>
        </div>
      </div>

      {/* chord strip: real data or empty */}
      {hasAnalysis ? (
        <ChordStrip tokens={tk} theme={theme} count={barCount} activeBar={activeBar} chordAt={chordAt} lockedAt={barCount > 28 ? 24 : null} />
      ) : (
        <div
          style={{
            flexShrink: 0,
            height: 56,
            display: "grid",
            placeItems: "center",
            margin: "2px 16px 4px",
            borderRadius: 10,
            background: "rgba(120,120,128,0.12)",
            border: `1px dashed ${tk.borderColor}`,
            color: tk.textMuted,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          No chord analysis yet
        </div>
      )}

      {/* analyze button when no beatGrid */}
      {!hasAnalysis && (
        <div className="flex-shrink-0 flex items-center justify-center px-4 py-2" style={{ display: "flex", justifyContent: "center", padding: "6px 16px" }}>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              height: 38,
              padding: "0 16px",
              borderRadius: 999,
              border: `1px solid ${tk.borderColor}`,
              background: "rgba(251,191,36,0.12)",
              color: "#D97706",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: analyzing ? "wait" : "pointer",
              opacity: analyzing ? 0.7 : 1,
            }}
            data-testid="btn-analyze"
          >
            {analyzing ? (
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  border: "2px solid #D97706",
                  borderTopColor: "transparent",
                  display: "inline-block",
                  animation: "spinSlow 0.7s linear infinite",
                }}
              />
            ) : (
              <SparkIcon size={14} />
            )}
            {analyzing ? "Analyzing..." : "Analyze Song"}
          </button>
        </div>
      )}

      {/* chord level toggle */}
      {hasAnalysis && (
        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "2px 16px 4px" }}>
          {(runtimeConfig.player.chordLevels as ChordLevel[]).map((lvl) => (
            <button
              key={lvl}
              onClick={() => setChordLevel(lvl)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "0 12px",
                height: 28,
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background: chordLevel === lvl ? "rgba(245,158,11,0.18)" : tk.hoverBg,
                color: chordLevel === lvl ? "#D97706" : tk.textMuted,
                transition: `all 200ms ${motion.easing.lux}`,
              }}
              data-testid={`btn-chord-level-${lvl}`}
            >
              {lvl === "simple" ? "ساده" : lvl === "medium" ? "متوسط" : "حرفه‌ای"}
            </button>
          ))}
        </div>
      )}

      {/* content views */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {view === "mixer" && (
          <div
            key="mixer"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              scrollbarWidth: "none",
              display: "flex",
              flexDirection: "column",
              animation: "fadeUp 0.4s cubic-bezier(0.32,0.72,0,1)",
            }}
          >
            {trackList.length === 0 ? (
              <div
                style={{
                  margin: "auto",
                  textAlign: "center",
                  padding: "24px 20px",
                  color: tk.textMuted,
                  fontSize: 13,
                }}
              >
                No stems available for this song.
                {song.masterTrackUrl ? " Master track will be used." : ""}
              </div>
            ) : !stemsReady ? (
              <div
                style={{
                  margin: "auto",
                  width: "min(420px, 86%)",
                  textAlign: "center",
                  padding: "30px 22px",
                  borderRadius: 22,
                  background: tk.sidebar,
                  border: `1px solid ${tk.borderColor}`,
                }}
              >
                <span style={{ color: tk.accent, animation: "spinSlow 1.6s linear infinite", display: "inline-flex", marginBottom: 12 }}>
                  <SparkIcon size={22} />
                </span>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Loading stems…</div>
                <div style={{ fontSize: 12, color: tk.textMuted, marginBottom: 16 }}>{trackList.map((t: any) => t.label ?? t.instrument).join(" • ")}</div>
                <div style={{ height: 5, borderRadius: 999, background: tk.hoverBg, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, Math.round((loadProgress.loaded / Math.max(1, loadProgress.total)) * 100))}%`, borderRadius: 999, background: tk.textPrimary, transition: "width 200ms linear" }} />
                </div>
                <div style={{ fontSize: 11.5, fontFamily: "ui-monospace, monospace", color: tk.accent, marginTop: 8 }}>
                  {loadProgress.loaded}/{loadProgress.total} • {Math.round((loadProgress.loaded / Math.max(1, loadProgress.total)) * 100)}%
                </div>
              </div>
            ) : (
              <>
                {/* real stem list */}
                <div style={{ display: "flex", flexDirection: "column", padding: "6px 0" }}>
                  {trackList.map((track: any) => {
                    const vol = volumes[track.id] ?? track.volume ?? 80;
                    const isMuted = muted[track.id] ?? false;
                    const dimmed = isMuted || vol === 0;
                    const Icon = iconForInstrument(track.instrument ?? track.label ?? "other");
                    return (
                      <div
                        key={track.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 14,
                          padding: "7px 18px",
                        }}
                      >
                        <button
                          onClick={() => setMuted((p) => ({ ...p, [track.id]: !p[track.id] }))}
                          aria-label={isMuted ? `Unmute ${track.label}` : `Mute ${track.label}`}
                          aria-pressed={isMuted}
                          style={{
                            position: "relative",
                            width: 40,
                            height: 40,
                            flexShrink: 0,
                            borderRadius: 12,
                            border: "none",
                            background: "transparent",
                            color: dimmed ? tk.textMuted : tk.textPrimary,
                            opacity: dimmed ? 0.55 : 1,
                            cursor: "pointer",
                            display: "grid",
                            placeItems: "center",
                            transition: `color 300ms ${motion.easing.lux}, opacity 300ms ${motion.easing.lux}`,
                          }}
                        >
                          <Icon size={18} />
                          {isMuted && <span aria-hidden style={{ position: "absolute", width: 26, height: 1.6, background: tk.textMuted, transform: "rotate(-45deg)", borderRadius: 2 }} />}
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11.5, color: tk.textMuted, fontWeight: 500, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {track.label ?? track.instrument} {isMuted ? "• muted" : ""}
                          </div>
                          <Slider
                            tokens={tk}
                            bare
                            ariaLabel={`${track.label} volume`}
                            value={vol}
                            min={0}
                            max={100}
                            onChange={(v) => setVolumes((p) => ({ ...p, [track.id]: v }))}
                            formatValue={(v) => `${Math.round(v)}%`}
                          />
                        </div>
                        <button
                          onClick={() => setStemLr(track.id)}
                          aria-label={`${track.label} L&R`}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 999,
                            border: "none",
                            background: "transparent",
                            color: tk.textMuted,
                            display: "grid",
                            placeItems: "center",
                            cursor: "pointer",
                          }}
                        >
                          <MoreIcon size={17} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: tk.textMuted, fontSize: 12, padding: "2px 0 8px" }}>
                  <span style={{ color: tk.accent, display: "flex" }}>
                    <CheckIcon size={14} />
                  </span>
                  Stems ready • {trackList.length} {trackList.length === 1 ? "track" : "stems"} loaded
                </div>
              </>
            )}
          </div>
        )}

        {view === "lyrics" && (
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", minWidth: 0 }}>
            {lyrics.length === 0 ? (
              <div style={{ margin: "auto", color: tk.textMuted, fontSize: 13 }}>No lyrics available</div>
            ) : (
              <LyricsView
                tokens={tk}
                lines={lyrics.map((l: any) => l.text)}
                currentLine={Math.max(0, activeLi)}
              />
            )}
          </div>
        )}

        {view === "sections" && (
          <SectionsView
            key="sections"
            tokens={tk}
            theme={theme}
            sections={SECTIONS}
            activeSection={activeSection}
            activeBar={activeBar}
            onSeekSection={(i) => handleSeek(sectionStarts[i] ?? 0)}
          />
        )}
      </div>

      {/* section chips */}
      {view !== "lyrics" && SECTIONS.length > 0 && (
        <SectionChips
          tokens={tk}
          sections={SECTIONS}
          activeSection={activeSection}
          onSeekSection={(i) => handleSeek(sectionStarts[i] ?? 0)}
          onLocked={() => onAction?.("locked")}
        />
      )}

      {/* transport */}
      <TransportBar
        tokens={tk}
        theme={theme}
        playing={playing}
        time={displayTime}
        duration={duration}
        segments={segments}
        counting={counting}
        metroOn={metroOn}
        metroBpm={metroBpm}
        metroChanged={metroBpm !== baseBpm}
        keyLabel={displayKeyLabel}
        keyChanged={semitones !== 0}
        onTogglePlay={handlePrimary}
        onSeek={(t) => {
          handleSeek(t);
          if (loopOn && (t < (loopA ?? 0) || t > (loopB ?? duration))) {
            setLoopOn(false);
            setLoopA(null);
            setLoopB(null);
          }
        }}
        onMetronome={() => setMetroOpen(true)}
        onKey={() => setKeyOpen(true)}
      />
      <PlayerActions
        tokens={tk}
        lyricsActive={view === "lyrics"}
        sectionsActive={view === "sections"}
        loopActive={loopOn}
        onLyrics={() => setView(view === "lyrics" ? "mixer" : "lyrics")}
        onSections={() => setView(view === "sections" ? "mixer" : "sections")}
        onLoop={toggleLoop}
      />

      {/* sheets */}
      <MetronomeSheet
        tokens={tk}
        theme={theme}
        open={metroOpen}
        onOpenChange={setMetroOpen}
        metroOn={metroOn}
        onMetroOn={setMetroOn}
        metroVol={metroVol}
        onMetroVol={setMetroVol}
        metroBal={metroBal}
        onMetroBal={setMetroBal}
        subdiv={subdiv}
        onSubdiv={setSubdiv}
        bpm={metroBpm}
        baseBpm={baseBpm}
        onBpm={(v) => {
          // tempo is derived from bpm, so adjust tempo to match v
          const nextTempo = clamp(v / Math.max(1, baseBpm), runtimeConfig.player.speedMin, runtimeConfig.player.speedMax);
          setTempo(nextTempo);
        }}
      />
      <KeySheet
        tokens={tk}
        theme={theme}
        open={keyOpen}
        onOpenChange={setKeyOpen}
        minor={minor}
        keyRoot={keyRoot}
        baseKeyRoot={baseKeyRoot}
        onPitch={(v) => setSemitones(clamp(v, runtimeConfig.player.semitonesMin, runtimeConfig.player.semitonesMax))}
      />
      {stemLr !== null && (
        <LRSheet
          tokens={tk}
          theme={theme}
          open
          onOpenChange={(v) => !v && setStemLr(null)}
          label={String(trackList.find((t: any) => t.id === stemLr)?.label ?? `Track ${stemLr}`)}
          pan={0}
          onPan={() => {}}
        />
      )}
      <TrackMenuSheet
        tokens={tk}
        theme={theme}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title={`${title} - ${artist}`}
        onAction={(a) => {
          setMenuOpen(false);
          if (a === "delete") onClose();
          onAction?.(`track:${a}`);
        }}
      />

      {/* debug hidden */}
      <span aria-hidden style={{ display: "none" }}>
        {beatIdx}
      </span>
    </div>
  );
};

export default PlayerReal;
