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
export function shiftChord(chord: string, n: number) {
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
export function shiftKey(key: string, n: number) {
  const k = ENHARMONIC[key] ?? key;
  const i = CHROMATIC.indexOf(k);
  return i === -1 ? key : CHROMATIC[((i + n) % 12 + 12) % 12];
}

export const BEAT_W  = 56;
export const HEAD_X  = 160;
export const TL_H    = 56;

export interface LyricLine  { time: number; text: string; chords: string[] }
export interface ChordBeat  { measure: number; beat: number; chord: string; time: number }
export interface AudioTrack {
  id: number;
  instrument: string;
  label: string;
  volume: number;
  muted: boolean;
  streamUrl: string;
}

export function getActiveIdx<T extends { time: number }>(arr: T[], t: number) {
  let i = -1;
  for (let j = 0; j < arr.length; j++) { if (arr[j].time <= t) i = j; else break; }
  return i;
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
