import { useState } from "react";
import { Link } from "wouter";
import { Search, Filter, Play, Music, Headphones } from "lucide-react";
import { useListSongs } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function MusicHubPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useListSongs({ search });

  // استخراج لیست آهنگ‌ها با اطمینان از ساختار دیتا
  const songs = Array.isArray(data)
    ? data
    : (data as any)?.songs || (data as any)?.items || [];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter mb-2">MUSIC HUB</h1>
          <p className="text-muted-foreground text-lg">
            Discover and explore the global catalog.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by artist, title or genre..."
              className="pl-9 h-11 bg-card border-card-border"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
          ))}
        </div>
      ) : error ? (
        <div className="py-20 text-center bg-card rounded-2xl border border-dashed border-red-500/50">
          <p className="text-red-400">Failed to connect to the database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {songs.map((song: any) => (
            <Link key={song.id} href={`/songs/${song.id}`}>
              <div className="group relative bg-card rounded-2xl overflow-hidden border border-card-border hover:border-primary/50 transition-all duration-300 cursor-pointer">
                <div className="aspect-square relative overflow-hidden">
                  {song.coverUrl ? (
                    <img src={song.coverUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary">
                      <Music className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                     <Button className="w-full gap-2 font-bold shadow-xl">
                        <Play className="w-4 h-4 fill-current" /> PLAY NOW
                     </Button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{song.title}</h3>
                  <p className="text-muted-foreground text-sm flex items-center gap-2">
                    <Headphones className="w-3 h-3" /> {song.artist || "Unknown Artist"}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
