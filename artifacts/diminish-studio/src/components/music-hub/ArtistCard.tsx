import { Link } from "wouter";
import { Music2 } from "lucide-react";

interface ArtistCardProps {
  name: string;
  imageUrl?: string;
  songCount: number;
}

export function ArtistCard({ name, imageUrl, songCount }: ArtistCardProps) {
  // اسلاگ ساده از روی اسم هنرمند برای مسیر صفحه (خودت بعداً متصلش می‌کنی)
  const slug = encodeURIComponent(name);

  return (
    <Link href={`/artists/${slug}`}>
      <div className="group cursor-pointer w-28 sm:w-32 flex-shrink-0 flex flex-col items-center text-center" data-testid={`artist-card-${slug}`}>
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-muted mb-2.5 border border-card-border group-hover:border-primary/50 transition-colors shadow-xs">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-card">
              <Music2 className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
        </div>

        <h3 className="font-semibold text-sm truncate w-full leading-tight">{name}</h3>
        <p className="text-muted-foreground text-xs mt-0.5">
          {songCount} {songCount === 1 ? "آهنگ" : "آهنگ"}
        </p>
      </div>
    </Link>
  );
}
