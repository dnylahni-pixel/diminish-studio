import { Link } from "wouter";
import { Play, Music } from "lucide-react";

interface SongCardProps {
  song: any;
}

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: "bg-green-500/15 text-green-600 dark:text-green-400",
  intermediate: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400",
  advanced: "bg-red-500/15 text-red-600 dark:text-red-400",
};

export function SongCard({ song }: SongCardProps) {
  const title = song.title || "Untitled";
  const artist = song.artist || "Unknown Artist";
  const bpm = song.bpm ?? "--";
  const difficulty = song.difficulty || "beginner";
  const difficultyStyle = DIFFICULTY_STYLES[difficulty] ?? DIFFICULTY_STYLES.beginner;

  return (
    <Link href={`/songs/${song.id}`}>
      <div className="group cursor-pointer w-36 sm:w-40 flex-shrink-0" data-testid={`song-card-${song.id}`}>
        <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-2 border border-card-border group-hover:border-primary/50 transition-colors shadow-xs">
          {song.coverUrl ? (
            <img
              src={song.coverUrl}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-card">
              <Music className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}

          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center transform translate-y-3 group-hover:translate-y-0 transition-all duration-300 shadow-md">
              <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
            </div>
          </div>

          <div className="absolute top-2 left-2">
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-background/85 backdrop-blur text-foreground/80">
              {bpm} BPM
            </span>
          </div>
        </div>

        <h3 className="font-semibold text-sm truncate leading-tight">{title}</h3>
        <p className="text-muted-foreground text-xs truncate mt-0.5">{artist}</p>

        <div className="flex items-center gap-1.5 mt-1.5">
          {song.key && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground font-mono">
              {song.key}
            </span>
          )}
          <span className={`text-[10px] px-1.5 py-0.5 rounded capitalize ${difficultyStyle}`}>
            {difficulty}
          </span>
        </div>
      </div>
    </Link>
  );
}
