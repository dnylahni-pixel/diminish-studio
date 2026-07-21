import { useState } from "react";
import { Link } from "wouter";
import { Search, Filter, Play, Clock, Music } from "lucide-react";
import { useGetUserLibrary } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { StorageQuotaBar } from "@/components/library/StorageQuotaBar";

export function LibraryPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useGetUserLibrary();

  const songs = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.songs)
      ? (data as any).songs
      : Array.isArray((data as any)?.items)
        ? (data as any).items
        : Array.isArray((data as any)?.data)
          ? (data as any).data
          : [];

  const filteredSongs = search.trim()
    ? songs.filter((s: any) =>
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.artist?.toLowerCase().includes(search.toLowerCase())
      )
    : songs;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="mb-4">
        <StorageQuotaBar />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Music Hub</h1>
          <p className="text-muted-foreground">
            Explore and analyze songs in the catalog.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search songs..."
              className="pl-9 bg-card border-card-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="bg-card">
            <Filter className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <Skeleton className="w-full aspect-square rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-20 text-center text-red-400">
          Failed to load songs.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSongs.map((song: any) => (
            <Link key={song.id} href={`/songs/${song.id}`}>
              <div className="group cursor-pointer">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-3 border border-border group-hover:border-primary/50 transition-colors">
                  {song.coverUrl ? (
                    <img
                      src={song.coverUrl}
                      alt={song.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-card">
                      <Music className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <Play className="w-5 h-5 ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 flex gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-background/80 backdrop-blur text-xs font-mono"
                    >
                      {song.bpm} BPM
                    </Badge>
                  </div>
                </div>
                <h3 className="font-bold text-lg truncate">{song.title}</h3>
                <p className="text-muted-foreground text-sm truncate">
                  {song.artist}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.floor(song.duration / 60)}:
                    {(song.duration % 60).toString().padStart(2, "0")}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-secondary">
                    {song.key}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded ${
                      song.difficulty === "beginner"
                        ? "bg-green-500/20 text-green-400"
                        : song.difficulty === "intermediate"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {song.difficulty}
                  </span>
                </div>
              </div>
            </Link>
          ))}

          {filteredSongs.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              No songs found. Try a different search.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
