/**
 * MOLECULE: UploadIndicator — atomic-scoped, token-driven
 * Compact indicator for SidebarFooter area. Mirrors src/components/layout/upload-indicator.tsx
 * but uses __atomic_preview tokens + motion.easing.lux, no index.css vars.
 */
import { CheckCircle2, Loader2, Upload, XCircle, X } from "lucide-react";
import { ThemeTokens, motion } from "../../tokens";
import { useUploadStore } from "../../stores/uploadStore";

type Props = {
  tokens: ThemeTokens;
  compact?: boolean;
  onNavigateUpload?: () => void;
};

function truncateFileName(name: string | null): string {
  if (!name) return "";
  const dotIdx = name.lastIndexOf(".");
  if (dotIdx === -1) return name.length > 12 ? name.slice(0, 10) + "..." : name;
  const base = name.slice(0, dotIdx);
  const ext = name.slice(dotIdx);
  if (name.length <= 14) return name;
  return base.slice(0, 8) + "..." + ext;
}

export function UploadIndicator({ tokens, compact = true, onNavigateUpload }: Props) {
  const store = useUploadStore();
  const status = store.status;

  if (status === "idle") return null;

  const isUploading = status === "uploading" || status === "processing";
  const isCompleted = status === "completed";
  const isError = status === "error";

  const handleClick = () => {
    onNavigateUpload?.();
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCompleted) store.dismissCompleted();
    else if (isError) store.dismissError();
  };

  const bg = isUploading
    ? themeAlpha(tokens.accent, 0.12)
    : isCompleted
      ? "rgba(34,197,94,0.10)"
      : "rgba(239,68,68,0.10)";

  const hoverBg = isUploading
    ? themeAlpha(tokens.accent, 0.18)
    : isCompleted
      ? "rgba(34,197,94,0.16)"
      : "rgba(239,68,68,0.16)";

  const common: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: compact ? 8 : 10,
    padding: compact ? "8px 10px" : "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    border: `1px solid ${tokens.borderColor}`,
    background: bg,
    transition: `background 200ms ${motion.easing.lux}`,
    userSelect: "none",
  };

  if (compact) {
    return (
      <div
        onClick={handleClick}
        style={common}
        onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = hoverBg)}
        onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = bg)}
        title={
          isUploading
            ? `Uploading ${store.fileName} — ${store.progress}%`
            : isCompleted
              ? "Upload complete — click to view"
              : `Upload failed: ${store.errorMessage}`
        }
      >
        <span style={{ display: "grid", placeItems: "center", flexShrink: 0 }}>
          {isUploading && <Loader2 size={14} style={{ color: tokens.accent }} className="animate-spin" />}
          {isCompleted && <CheckCircle2 size={14} style={{ color: "#22C55E" }} />}
          {isError && <XCircle size={14} style={{ color: "#EF4444" }} />}
        </span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {isUploading && <span style={{ color: tokens.accent }}>{store.fileName ? truncateFileName(store.fileName) : "Uploading"} <span style={{ opacity: 0.7, marginLeft: 6 }}>{store.progress}%</span></span>}
          {isCompleted && <span style={{ color: "#22C55E" }}>{truncateFileName(store.fileName) || "Done"}</span>}
          {isError && <span style={{ color: "#EF4444" }}>Upload failed</span>}
        </span>
        {(isCompleted || isError) && (
          <button
            onClick={handleDismiss}
            style={{
              width: 20,
              height: 20,
              borderRadius: 999,
              border: "none",
              background: tokens.themePillBg,
              color: tokens.textMuted,
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
            title="Dismiss"
          >
            <X size={10} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      style={common}
      onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = hoverBg)}
      onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = bg)}
    >
      <span style={{ display: "grid", placeItems: "center", flexShrink: 0 }}>
        {isUploading && (store.status === "processing" ? <Loader2 size={18} style={{ color: tokens.accent }} className="animate-spin" /> : <Upload size={18} style={{ color: tokens.accent }} />)}
        {isCompleted && <CheckCircle2 size={18} style={{ color: "#22C55E" }} />}
        {isError && <XCircle size={18} style={{ color: "#EF4444" }} />}
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: tokens.textPrimary }}>
        {isUploading && <><span>{store.fileName ?? "Uploading..."}</span><span style={{ color: tokens.textMuted, marginLeft: 8 }}>{store.progress}%</span></>}
        {isCompleted && <span style={{ color: "#16A34A" }}>{store.fileName ?? "Upload complete"}</span>}
        {isError && <span style={{ color: "#EF4444" }}>Upload failed</span>}
      </span>
      {(isCompleted || isError) && (
        <button onClick={handleDismiss} style={{ width: 28, height: 28, borderRadius: 999, border: `1px solid ${tokens.borderColor}`, background: tokens.themePillBg, display: "grid", placeItems: "center", cursor: "pointer" }}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function themeAlpha(color: string, alpha: number): string {
  // tokens.accent is hex like #5EEAD4 or #0F766E — convert to rgba
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const num = parseInt(full, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }
  // fallback: if already rgb/hsl, just return with opacity string? use original with alpha via opacity?
  return color;
}
