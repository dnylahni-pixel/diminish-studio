import { ArtistCard } from "./ArtistCard";

interface ArtistEntry {
  name: string;
  imageUrl?: string;
  songCount: number;
}

interface ArtistRowProps {
  title: string;
  artists: ArtistEntry[];
}

export function ArtistRow({ title, artists }: ArtistRowProps) {
  if (artists.length === 0) return null;

  return (
    <div className="mb-7" data-testid="artist-row">
      <h2 className="text-lg font-bold tracking-tight mb-3 px-1">{title}</h2>
      <div
        className="flex gap-4 overflow-x-auto pb-1 px-1 thin-scrollbar"
        style={{ scrollSnapType: "x proximity" }}
      >
        {artists.map((artist) => (
          <div key={artist.name} style={{ scrollSnapAlign: "start" }}>
            <ArtistCard name={artist.name} imageUrl={artist.imageUrl} songCount={artist.songCount} />
          </div>
        ))}
      </div>
    </div>
  );
}
