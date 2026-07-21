import { useGetStorageQuota } from "@workspace/api-client-react";
import { Progress } from "@/components/ui/progress";
import { HardDrive } from "lucide-react";

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function StorageQuotaBar() {
  const { data, isLoading, isError } = useGetStorageQuota();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-card border border-border animate-pulse">
        <HardDrive className="w-4 h-4 text-muted-foreground" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2 bg-muted rounded-full w-full" />
          <div className="h-3 bg-muted rounded w-24" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border text-xs text-muted-foreground">
        <HardDrive className="w-4 h-4" />
        Storage info unavailable
      </div>
    );
  }

  const used = data.storageUsedBytes;
  const quota = data.storageQuotaBytes;
  const pct = quota > 0 ? Math.min((used / quota) * 100, 100) : 0;

  const barColor =
    pct >= 90
      ? "[&>div]:bg-red-500"
      : pct >= 70
        ? "[&>div]:bg-amber-500"
        : "[&>div]:bg-emerald-500";

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-card border border-border">
      <HardDrive className="w-4 h-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0 space-y-1.5">
        <Progress value={pct} className={`h-2 ${barColor}`} />
        <p className="text-[11px] text-muted-foreground leading-none">
          {formatBytes(used)} / {formatBytes(quota)} used
          {pct >= 90 && (
            <span className="text-red-400 ml-1">— Almost full</span>
          )}
        </p>
      </div>
    </div>
  );
}