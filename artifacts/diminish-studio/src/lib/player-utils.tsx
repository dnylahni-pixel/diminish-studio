import React from "react";
import { Guitar, Piano, Mic2, Music2, Drum, Waves, AudioLines } from "lucide-react";

export const CHROMATIC = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
export const ENHARMONIC: Record<string,string> = {
  Db:"C#",Eb:"D#",Gb:"F#",Ab:"G#",Bb:"A#","E#":"F","B#":"C",Cb:"B",Fb:"E",
};

export function shiftNote(note: string, n: number) {
  const k = ENHARMONIC[note] ?? note;
  const i = CHROMATIC.indexOf(k);
  return i === -1 ? note : CHROMATIC[((i + n) % 12 + 12) % 12];
}

// Maps RunPod/ChordMini "root:quality" notation to standard chord notation
const QUALITY_MAP: Record<string, string> = {
  maj: "",
  min: "m",
  dim: "dim",
  aug: "aug",
  sus2: "sus2",
  sus4: "sus4",
  "7": "7",
  maj7: "maj7",
  min7: "m7",
  dim7: "dim7",
  "9": "9",
  min9: "m9",
  maj9: "maj9",
  add9: "add9",
  "6": "6",
  min6: "m6",
};

// "No chord" markers some models emit during silence/instrumental gaps
const NO_CHORD_TOKENS = new Set(["N", "N.C.", "NC", "X"]);
export const REST_SYMBOL = "𝄽"; // musical rest glyph

export function normalizeChord(chord: string): string {
  if (!chord) return chord;
  if (NO_CHORD_TOKENS.has(chord.trim().toUpperCase())) return REST_SYMBOL;

  const ci = chord.indexOf(":");
  if (ci === -1) return chord; // already in plain format, leave as-is
  const root = chord.slice(0, ci);
  const quality = chord.slice(ci + 1);
  const mapped = QUALITY_MAP[quality] ?? quality; // fallback: show raw quality if unmapped
  return `${root}${mapped}`;
}

// ─── Chord difficulty levels ───────────────────────────────────────────────
export type ChordLevel = "simple" | "medium" | "pro";

// Suffix patterns ordered from most-specific to least. Each entry maps a
// normalized suffix to its simplified forms at "simple" and "medium" levels.
// Quality (m/dim/aug) is always preserved; only extensions/alterations are stripped.
interface SuffixRule {
  match: RegExp;
  simple: string;   // what survives at "simple" level
  medium: string;   // what survives at "medium" level
}

const SUFFIX_RULES: SuffixRule[] = [
  // dim7, m7b5 (half-diminished) — keep quality, drop extension at simple
  { match: /^dim7$/,        simple: "dim",  medium: "dim7" },
  { match: /^m7b5$/,        simple: "m",    medium: "m7b5" },
  { match: /^aug$/,         simple: "aug",  medium: "aug" },
  { match: /^dim$/,         simple: "dim",  medium: "dim" },

  // sus chords — treat as their own quality, kept at medium, dropped to "" (major-ish) at simple
  { match: /^sus2$/,        simple: "",     medium: "sus2" },
  { match: /^sus4$/,        simple: "",     medium: "sus4" },

  // 7th family — kept at medium, dropped at simple
  { match: /^7$/,           simple: "",     medium: "7" },
  { match: /^maj7$/,        simple: "",     medium: "maj7" },
  { match: /^m7$/,          simple: "m",    medium: "m7" },

  // 6th — kept at medium, dropped at simple
  { match: /^6$/,           simple: "",     medium: "6" },
  { match: /^m6$/,          simple: "m",    medium: "m6" },

  // extensions (9/11/13/add9) — always dropped to base triad, even at medium
  { match: /^9$/,           simple: "",     medium: "" },
  { match: /^maj9$/,        simple: "",     medium: "" },
  { match: /^m9$/,          simple: "m",    medium: "m" },
  { match: /^add9$/,        simple: "",     medium: "" },
  { match: /^11$/,          simple: "",     medium: "" },
  { match: /^13$/,          simple: "",     medium: "" },

  // bare minor/major (no extension at all)
  { match: /^m$/,           simple: "m",    medium: "m" },
  { match: /^$/,            simple: "",     medium: "" },
];

function splitChordSuffix(chord: string): { root: string; suffix: string; bass: string | null } {
  // Handle slash chords (e.g. "C/E") — bass note is simplified separately
  let bass: string | null = null;
  let main = chord;
  const si = chord.lastIndexOf("/");
  if (si !== -1) {
    bass = chord.slice(si + 1);
    main = chord.slice(0, si);
  }
  const m = main.match(/^([A-G][#b]?)(.*)$/);
  if (!m) return { root: main, suffix: "", bass };
  const [, root, suffix] = m;
  return { root, suffix, bass };
}

export function simplifyChord(chord: string, level: ChordLevel): string {
  if (!chord || chord === REST_SYMBOL) return chord;
  if (level === "pro") return chord;

  const { root, suffix, bass } = splitChordSuffix(chord);
  const rule = SUFFIX_RULES.find((r) => r.match.test(suffix));
  const simplifiedSuffix = rule ? (level === "simple" ? rule.simple : rule.medium) : suffix; // unknown suffix: leave as-is

  const simplifiedBass = bass ? bass : null; // bass note itself isn't a quality, keep as-is
  return simplifiedBass ? `${root}${simplifiedSuffix}/${simplifiedBass}` : `${root}${simplifiedSuffix}`;
}

export function shiftChord(chord: string, n: number, level: ChordLevel = "pro") {
  const normalized = normalizeChord(chord);
  const leveled = simplifyChord(normalized, level);
  if (n === 0) return leveled;
  if (leveled === REST_SYMBOL) return leveled; // nothing to transpose
  const m = leveled.match(/^([A-G][#b]?)(.*)$/);
  if (!m) return leveled;
  const [, root, sfx] = m;
  if (sfx.includes("/")) {
    const si = sfx.lastIndexOf("/");
    return `${shiftNote(root, n)}${sfx.slice(0, si)}/${shiftNote(sfx.slice(si+1), n)}`;
  }
  return `${shiftNote(root, n)}${sfx}`;
}
export function shiftKey(key: string, n: number) {
  const k = ENHARMONIC[key] ?? key;
  const i = CHROMATIC.indexOf(k);
  return i === -1 ? key : CHROMATIC[((i + n) % 12 + 12) % 12];
}

export const BEAT_W  = 56;
export const HEAD_X  = 160;
export const TL_H    = 56;

export interface LyricWord {
  time: number;
  end?: number;
  text: string;
}

export interface LyricLine {
  time: number;
  end?: number;
  text: string;
  chords: string[];
  words?: LyricWord[];
}

export interface ChordBeat  { measure: number; beat: number; chord: string; time: number }
export interface AudioTrack {
  id: number;
  instrument: string;
  label: string;
  volume: number;
  muted: boolean;
  streamUrl: string;
}

export function getActiveIdx<T extends { time: number; end?: number }>(
  arr: T[],
  t: number,
  options?: { exactMatch?: boolean }
): number {
  // Check for exact match (crucial for chord timeline)
  if (options?.exactMatch) {
    for (let j = 0; j < arr.length; j++) {
      if (arr[j].time === t) {
        return j;
      }
    }
    return -1;
  }

  // Default behavior (for lyrics)
  for (let j = 0; j < arr.length; j++) {
    const start = arr[j].time;
    const end: number = arr[j].end ?? arr[j + 1]?.time ?? Infinity;

    if (t >= start && t < end) {
      return j;
    }
  }

  return -1;
}


export function fmt(s: number) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2,"0")}`;
}

export function InstrumentIcon({ name, className }: { name: string; className?: string }) {
  const n = name.toLowerCase();
  if (n.includes("guitar") || n.includes("gitar"))  return <Guitar className={className} />;
  if (n.includes("piano") || n.includes("keys"))     return <Piano className={className} />;
  if (n.includes("vocal") || n.includes("voice") || n.includes("sing")) return <Mic2 className={className} />;
  if (n.includes("drum") || n.includes("perc"))      return <Drum className={className} />;
  if (n.includes("bass"))                            return <AudioLines className={className} />;
  if (n.includes("string") || n.includes("violin"))  return <Waves className={className} />;
  return <Music2 className={className} />;
}
