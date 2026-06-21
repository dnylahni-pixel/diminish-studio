import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";
import { useListSongs } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SongRow } from "@/components/music-hub/SongRow";

const UNKNOWN_TIME_SIGNATURE = "نامشخص";

function timeSignatureLabel(song: any): string {
  const ts = song.timeSignature;
  if (!ts || !ts.numerator || !ts.denominator) return UNKNOWN_TIME_SIGNATURE;
  return `ریتم ${ts.numerator}/${ts.denominator}`;
}

export function MusicHubPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useListSongs({ search });

  const songs = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.songs)
      ? (data as any).songs
      : Array.isArray((data as any)?.items)
        ? (data as any).items
        : Array.isArray((data as any)?.data)
          ? (data as any).data
          : [];

  // ── group songs into horizontal rows ──────────────────────────────────────
  const { byTimeSignature, byArtist, recentlyAdded } = useMemo(() => {
    const timeSigMap = new Map<string, any[]>();
    const artistMap = new Map<string, any[]>();

    for (const song of songs) {
      const tsLabel = timeSignatureLabel(song);
      if (!timeSigMap.has(tsLabel)) timeSigMap.set(tsLabel, []);
      timeSigMap.get(tsLabel)!.push(song);

      const artistLabel = song.artist || "Unknown Artist";
      if (!artistMap.has(artistLabel)) artistMap.set(artistLabel, []);
      artistMap.get(artistLabel)!.push(song);
    }

    // فقط هنرمندهایی که بیش از یک آهنگ دارن به‌عنوان دسته‌ی جدا نشون داده می‌شن
    const artistEntries = Array.from(artistMap.entries())
      .filter(([name, list]) => name !== "Unknown Artist" && list.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    // ریتم‌های رایج (۴/۴) رو اول نشون بده، بعد بقیه
    const timeSigEntries = Array.from(timeSigMap.entries()).sort((a, b) => {
      if (a[0] === "ریتم 4/4") return -1;
      if (b[0] === "ریتم 4/4") return 1;
      if (a[0] === UNKNOWN_TIME_SIGNATURE) return 1;
      if (b[0] === UNKNOWN_TIME_SIGNATURE) return -1;
      return 0;
    });

    // جدیدترین‌ها: فرض بر اینه آرایه‌ی اصلی به ترتیب id/تاریخ مرتبه؛ آخرین ۱۲ تا
    const recent = [...songs].slice(-12).reverse();

    return { byTimeSignature: timeSigEntries, byArtist: artistEntries, recentlyAdded: recent };
  }, [songs]);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
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
        <div className="space-y-7">
          {[...Array(3)].map((_, rowIdx) => (
            <div key={rowIdx}>
              <Skeleton className="h-6 w-40 mb-3" />
              <div className="flex gap-3.5 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="w-36 sm:w-40 flex-shrink-0 flex flex-col gap-2">
                    <Skeleton className="w-full aspect-square rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="py-20 text-center text-destructive">
          Failed to load songs.
        </div>
      ) : songs.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          No songs found. Try a different search.
        </div>
      ) : (
        <div>
          {/* جستجو فعاله: یه گرید ساده از نتایج نشون بده، نه دسته‌بندی‌شده */}
          {search.trim() ? (
            <SongRow title={`نتایج برای "${search}"`} songs={songs} />
          ) : (
            <>
              <SongRow title="به‌تازگی اضافه‌شده" songs={recentlyAdded} />
              {byTimeSignature.map(([label, list]) => (
                <SongRow key={label} title={label} songs={list} />
              ))}
              {byArtist.map(([artist, list]) => (
                <SongRow key={artist} title={artist} songs={list} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
