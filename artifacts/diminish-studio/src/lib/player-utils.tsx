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

export function normalizeChord(chord: string): string {
  if (!chord) return chord;
  const ci = chord.indexOf(":");
  if (ci === -1) return chord; // already in plain format, leave as-is
  const root = chord.slice(0, ci);
  const quality = chord.slice(ci + 1);
  const mapped = QUALITY_MAP[quality] ?? quality; // fallback: show raw quality if unmapped
  return `${root}${mapped}`;
}

export function shiftChord(chord: string, n: number) {
  const normalized = normalizeChord(chord);
  if (n === 0) return normalized;
  const m = normalized.match(/^([A-G][#b]?)(.*)$/);
  if (!m) return normalized;
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
