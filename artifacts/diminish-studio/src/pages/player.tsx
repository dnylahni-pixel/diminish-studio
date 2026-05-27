import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Settings2 } from "lucide-react";
import { useGetSong, getGetSongQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";

export function PlayerPage() {
  const { id } = useParams();
  const { data: song, isLoading } = useGetSong(Number(id), { query: { enabled: !!id, queryKey: getGetSongQueryKey(Number(id)) } });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  // Mock playback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && song) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= song.duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, song]);

  if (isLoading || !song) {
    return (
      <div className="p-6 md:p-10 h-full flex flex-col gap-6">
        <Skeleton className="h-32 w-full" />
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-full" />
          <Skeleton className="h-full" />
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden p-4 md:p-6 gap-4">
      {/* Top Bar - Song Info */}
      <div className="flex items-center justify-between bg-card border border-card-border p-4 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-md bg-muted overflow-hidden flex-shrink-0">
            {song.coverUrl && <img src={song.coverUrl} alt={song.title} className="w-full h-full object-cover" />}
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">{song.title}</h1>
            <p className="text-muted-foreground text-sm">{song.artist}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-mono text-muted-foreground">
          <div className="flex flex-col items-end">
            <span className="text-xs uppercase tracking-wider opacity-50">BPM</span>
            <span className="text-foreground">{song.bpm}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs uppercase tracking-wider opacity-50">KEY</span>
            <span className="text-foreground">{song.key}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        
        {/* Lyrics Panel */}
        <div className="flex-1 bg-card border border-card-border rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-card-border bg-card/50 flex justify-between items-center">
            <h3 className="font-bold text-sm tracking-wide uppercase">Lyrics & Chords</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {song.lyrics?.map((line, i) => {
              const isActive = currentTime >= line.time && (!song.lyrics[i+1] || currentTime < song.lyrics[i+1].time);
              return (
                <div key={i} className={`transition-all duration-300 ${isActive ? 'opacity-100 scale-105 transform origin-left' : 'opacity-40'}`}>
                  <div className="flex gap-4 mb-1 text-primary font-mono text-sm font-bold">
                    {line.chords.map((c, j) => <span key={j}>{c}</span>)}
                  </div>
                  <div className="text-2xl font-medium" dir="auto">{line.text}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mixer Panel */}
        <div className="w-full lg:w-80 bg-card border border-card-border rounded-xl flex flex-col">
          <div className="p-4 border-b border-card-border bg-card/50 flex justify-between items-center">
            <h3 className="font-bold text-sm tracking-wide uppercase">Mixer</h3>
            <Settings2 className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {song.tracks?.map((track) => (
              <div key={track.id} className="p-3 bg-background border border-border rounded-lg flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm capitalize">{track.label}</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" className={`h-6 w-6 text-[10px] font-bold ${track.muted ? 'bg-destructive/20 text-destructive border-destructive/50' : 'text-muted-foreground'}`}>M</Button>
                    <Button variant="outline" size="icon" className="h-6 w-6 text-[10px] font-bold text-muted-foreground">S</Button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <VolumeX className="w-3 h-3 text-muted-foreground" />
                  <Slider defaultValue={[track.volume]} max={100} step={1} className="flex-1" />
                  <Volume2 className="w-3 h-3 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transport Controls */}
      <div className="bg-card border border-card-border p-4 rounded-xl flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono w-10 text-right">{formatTime(currentTime)}</span>
          <Slider value={[currentTime]} max={song.duration} step={0.1} className="flex-1" onValueChange={([v]) => setCurrentTime(v)} />
          <span className="text-xs font-mono w-10">{formatTime(song.duration)}</span>
        </div>
        <div className="flex justify-center items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => setCurrentTime(0)}>
            <SkipBack className="w-5 h-5" />
          </Button>
          <Button size="icon" className="h-14 w-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
          </Button>
          <Button variant="ghost" size="icon">
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
