import { useLocation } from "wouter";
import { CheckCircle2, Loader2, Upload, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadStore } from "@/stores/uploadStore";

interface UploadIndicatorProps {
  /** Whether to render in compact mode (sidebar) or full mode */
  compact?: boolean;
}

export function UploadIndicator({ compact = true }: UploadIndicatorProps) {
  const store = useUploadStore();
  const [, navigate] = useLocation();

  const status = store.status;

  // Don't render anything when idle
  if (status === "idle") return null;

  const isUploading = status === "uploading" || status === "processing";
  const isCompleted = status === "completed";
  const isError = status === "error";

  const handleClick = () => {
    navigate("/process");
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted) {
      store.dismissCompleted();
    } else if (isError) {
      store.dismissError();
    }
  };

  // ── Compact mode (sidebar) ──
  if (compact) {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "group flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-colors text-xs select-none",
          isUploading && "bg-primary/10 hover:bg-primary/20",
          isCompleted && "bg-green-500/10 hover:bg-green-500/20",
          isError && "bg-red-500/10 hover:bg-red-500/20"
        )}
        title={
          isUploading
            ? `Uploading ${store.fileName} — ${store.progress}%`
            : isCompleted
              ? "Upload complete — click to view"
              : isError
                ? `Upload failed: ${store.errorMessage}`
                : ""
        }
      >
        {/* Icon */}
        <span className="flex-shrink-0">
          {isUploading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          )}
          {isCompleted && (
            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
          )}
          {isError && (
            <XCircle className="w-3.5 h-3.5 text-red-500" />
          )}
        </span>

        {/* Compact text */}
        <span className="truncate min-w-0 leading-tight">
          {isUploading && (
            <span className="text-primary">
              {store.fileName ? truncateFileName(store.fileName) : "Uploading"}
              <span className="ml-1 opacity-60">{store.progress}%</span>
            </span>
          )}
          {isCompleted && (
            <span className="text-green-500">{truncateFileName(store.fileName) ?? "Done"}</span>
          )}
          {isError && (
            <span className="text-red-500">Upload failed</span>
          )}
        </span>

        {/* Dismiss button (only for completed/error) */}
        {(isCompleted || isError) && (
          <button
            onClick={handleDismiss}
            className="ml-auto flex-shrink-0 p-0.5 rounded hover:bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // ── Full mode (mobile header / other) ──
  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors",
        isUploading && "bg-primary/10 hover:bg-primary/20",
        isCompleted && "bg-green-500/10 hover:bg-green-500/20",
        isError && "bg-red-500/10 hover:bg-red-500/20"
      )}
    >
      <span className="flex-shrink-0">
        {isUploading && (
          isUploading && store.status === "processing" ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <Upload className="w-5 h-5 text-primary" />
          )
        )}
        {isCompleted && <CheckCircle2 className="w-5 h-5 text-green-500" />}
        {isError && <XCircle className="w-5 h-5 text-red-500" />}
      </span>

      <span className="text-sm flex-1 min-w-0 truncate">
        {isUploading && (
          <>
            <span className="font-medium">{store.fileName ?? "Uploading..."}</span>
            <span className="text-muted-foreground ml-2">{store.progress}%</span>
          </>
        )}
        {isCompleted && (
          <span className="text-green-600 dark:text-green-400">
            {store.fileName ?? "Upload complete"}
          </span>
        )}
        {isError && (
          <span className="text-red-600 dark:text-red-400">
            Upload failed
          </span>
        )}
      </span>

      {(isCompleted || isError) && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-muted/50 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/** Truncate file name to fit sidebar: keep first 10 chars + ext */
function truncateFileName(name: string | null): string {
  if (!name) return "";
  const dotIdx = name.lastIndexOf(".");
  if (dotIdx === -1) {
    return name.length > 12 ? name.slice(0, 10) + "..." : name;
  }
  const base = name.slice(0, dotIdx);
  const ext = name.slice(dotIdx);
  if (name.length <= 14) return name;
  return base.slice(0, 8) + "..." + ext;
}