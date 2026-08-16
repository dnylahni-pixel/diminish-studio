import { create } from "zustand";

interface Track {
  id: number;
  instrument: string;
  label: string;
  streamUrl: string;
  volume: number;
  muted: boolean;
  soloable: boolean;
  pan: number;
  offset: number;
  normalizationGain: number;
  peaks: string | null;
}

interface PlayerState {
  // Playback state
  isPlaying: boolean;
  duration: number;
  
  // Tracks
  tracks: Track[];
  volumes: Record<number, number>;
  mutes: Record<number, boolean>;
  
  // Loading state
  loadingProgress: { loaded: number; total: number };
  failedTracks: string[];
  
  // UI state
  activeLyricLineIndex: number;
  mixerOpen: boolean;
  
  // Actions
  setIsPlaying: (playing: boolean) => void;
  setDuration: (duration: number) => void;
  setTracks: (tracks: Track[]) => void;
  setVolume: (trackId: number, volume: number) => void;
  setMuted: (trackId: number, muted: boolean) => void;
  setLoadingProgress: (progress: { loaded: number; total: number }) => void;
  setFailedTracks: (tracks: string[]) => void;
  setActiveLyricLineIndex: (index: number) => void;
  setMixerOpen: (open: boolean) => void;
  reset: () => void;
}

const initialState = {
  isPlaying: false,
  duration: 0,
  tracks: [],
  volumes: {},
  mutes: {},
  loadingProgress: { loaded: 0, total: 0 },
  failedTracks: [],
  activeLyricLineIndex: -1,
  mixerOpen: false,
};

export const usePlayerStore = create<PlayerState>((set) => ({
  ...initialState,

  setIsPlaying: (playing) => set({ isPlaying: playing }),
  
  setDuration: (duration) => set({ duration }),
  
  setTracks: (tracks) => {
    const volumes: Record<number, number> = {};
    const mutes: Record<number, boolean> = {};
    tracks.forEach((t) => {
      volumes[t.id] = t.volume;
      mutes[t.id] = t.muted;
    });
    set({ tracks, volumes, mutes });
  },
  
  setVolume: (trackId, volume) =>
    set((state) => ({
      volumes: { ...state.volumes, [trackId]: volume },
    })),
  
  setMuted: (trackId, muted) =>
    set((state) => ({
      mutes: { ...state.mutes, [trackId]: muted },
    })),
  
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  
  setFailedTracks: (tracks) => set({ failedTracks: tracks }),
  
  setActiveLyricLineIndex: (index) => set({ activeLyricLineIndex: index }),
  
  setMixerOpen: (open) => set({ mixerOpen: open }),
  
  reset: () => set(initialState),
}));
