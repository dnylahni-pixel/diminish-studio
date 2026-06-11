# AudioEngine Integration Guide

این راهنما نحوه اتصال `AudioEngine` به `player.tsx` را توضیح می‌دهد.

## مراحل اتصال:

### 1. Import ها
```tsx
import { audioEngine } from "@/lib/AudioEngine";
import { usePlayerStore } from "@/stores/playerStore";
import { useAnimationFrame } from "@/hooks/useAnimationFrame";
```

### 2. در component:
```tsx
// Refs for DOM manipulation (not state!)
const currentTimeRef = useRef(0);
const playheadRef = useRef<HTMLDivElement>(null);
const timeDisplayRef = useRef<HTMLSpanElement>(null);

// Store state
const { 
  isPlaying, setIsPlaying, 
  volumes, mutes, 
  setVolume, setMuted,
  setTracks, setLoadingProgress,
  activeLyricLineIndex, setActiveLyricLineIndex 
} = usePlayerStore();
```

### 3. Load tracks on mount:
```tsx
useEffect(() => {
  if (!songData?.tracks) return;
  
  // Set tracks in store
  setTracks(songData.tracks);
  
  // Setup loading callback
  audioEngine.onLoadProgress((id, status) => {
    const progress = audioEngine.getLoadingProgress();
    setLoadingProgress(progress);
  });
  
  // Load all tracks
  songData.tracks.forEach((track) => {
    audioEngine.loadTrack(String(track.id), track.streamUrl);
  });
  
  // Cleanup on unmount
  return () => {
    audioEngine.dispose();
  };
}, [songData]);
```

### 4. rAF Loop (critical!):
```tsx
useAnimationFrame(() => {
  // Read current time from engine
  const currentTime = audioEngine.getCurrentTime();
  currentTimeRef.current = currentTime;
  
  // Update playhead position directly (no setState!)
  if (playheadRef.current) {
    const percent = (currentTime / duration) * 100;
    playheadRef.current.style.left = `${percent}%`;
  }
  
  // Update time display directly
  if (timeDisplayRef.current) {
    timeDisplayRef.current.textContent = formatTime(currentTime);
  }
  
  // Update active lyric line (only when changed!)
  if (lyrics.length > 0) {
    const newIndex = getActiveIdx(lyrics, currentTime);
    if (newIndex !== activeLyricLineIndex) {
      setActiveLyricLineIndex(newIndex);
    }
  }
  
  // Update chord timeline scroll
  if (timelineRef.current) {
    const beat = Math.floor((currentTime * bpm) / 60);
    timelineRef.current.scrollLeft = Math.max(0, beat * BEAT_W - HEAD_X);
  }
}, true); // Always active
```

### 5. Play/Pause handlers:
```tsx
const handlePlayPause = () => {
  if (isPlaying) {
    audioEngine.pause();
    setIsPlaying(false);
  } else {
    const success = audioEngine.play(currentTimeRef.current);
    if (success) {
      setIsPlaying(true);
    }
  }
};
```

### 6. Seek handler:
```tsx
const handleSeek = (time: number) => {
  audioEngine.seek(time);
  currentTimeRef.current = time;
};
```

### 7. Volume/Mute handlers:
```tsx
const handleVolumeChange = (trackId: number, volume: number) => {
  audioEngine.setVolume(String(trackId), volume / 100); // 0-1 range
  setVolume(trackId, volume);
};

const handleMuteToggle = (trackId: number) => {
  const newMuted = !mutes[trackId];
  audioEngine.setMuted(String(trackId), newMuted);
  setMuted(trackId, newMuted);
};
```

### 8. Sync volumes/mutes to engine:
```tsx
useEffect(() => {
  Object.entries(volumes).forEach(([id, vol]) => {
    audioEngine.setVolume(id, vol / 100);
  });
}, [volumes]);

useEffect(() => {
  Object.entries(mutes).forEach(([id, muted]) => {
    audioEngine.setMuted(id, muted);
  });
}, [mutes]);
```

## نکات مهم:

1. **هیچ‌وقت currentTime در state نریز** - فقط در ref نگهدار و با rAF آپدیت کن
2. **DOM manipulation مستقیم** برای playhead و time display
3. **فقط activeLyricLineIndex** می‌تونه در state باشه (با چک تغییر)
4. **volumes در store هستن 0-100** ولی engine 0-1 می‌خواد
5. **همیشه dispose() رو در cleanup صدا بزن**
6. **track IDs رو به string تبدیل کن** برای audioEngine

## فایل‌های مورد نیاز:
- ✅ `/src/lib/AudioEngine.ts` - موتور اصلی
- ✅ `/src/stores/playerStore.ts` - state management
- ✅ `/src/hooks/useAnimationFrame.ts` - rAF hook
- ⏳ `/src/pages/player.tsx` - باید آپدیت بشه
