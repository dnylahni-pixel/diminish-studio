import { SongCard } from "./SongCard";

interface SongRowProps {
  title: string;
  songs: any[];
}

export function SongRow({ title, songs }: SongRowProps) {
  if (songs.length === 0) return null;

  return (
    <div className="mb-7" data-testid={`song-row-${title}`}>
      <h2 className="text-lg font-bold tracking-tight mb-3 px-1">{title}</h2>
      <div
        className="flex gap-3.5 overflow-x-auto pb-1 px-1 thin-scrollbar"
        style={{ scrollSnapType: "x proximity" }}
      >
        {songs.map((song) => (
          <div key={song.id} style={{ scrollSnapAlign: "start" }}>
            <SongCard song={song} />
          </div>
        ))}
      </div>
    </div>
  );
}
