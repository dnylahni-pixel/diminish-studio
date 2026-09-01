/**
 * MOLECULE: StorageQuotaBarAtomic — atomic tokens version of StorageQuotaBar
 * - tokens (colors[theme]) + motion.easing.lux, rounded 12
 * - Real API: useGetStorageQuota, useRuntimeConfig thresholds (warn 70% amber, 90% red)
 * - Surfaces loading skeleton, error, and normal with Progress bar (token inline, not shadcn Progress)
 * - Scoped atomic styles, no Tailwind bg-card/border vars
 */
import { HardDrive } from "lucide-react";
import { useGetStorageQuota } from "@workspace/api-client-react";
import { useRuntimeConfig } from "@/lib/runtime-config";
import { colors, motion as motionTokens, typography } from "../../tokens";
import type { Theme, ThemeTokens } from "../../tokens/colors";
import { useTheme } from "@/hooks/use-theme";

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, i);
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

type Props = {
  theme?: Theme;
  tokens?: ThemeTokens;
};

export function StorageQuotaBarAtomic(props: Props) {
  const { isDark } = useTheme();
  const derived: Theme = isDark ? "dark" : "light";
  const theme = props.theme ?? derived;
  const tokens = props.tokens ?? colors[theme];
  const { data, isLoading, isError } = useGetStorageQuota();
  const config = useRuntimeConfig();

  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 16px",
    borderRadius: 12,
    background: tokens.sidebar,
    border: `1px solid ${tokens.borderColor}`,
    boxShadow: theme === "light" ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
    transition: `all 300ms ${motionTokens.easing.lux}`,
  };

  if (isLoading) {
    return (
      <div style={containerStyle} aria-busy="true" aria-label="Loading storage quota">
        <HardDrive size={16} style={{ color: tokens.textMuted, flexShrink: 0 }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}>
          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: tokens.themePillBg,
              border: `1px solid ${tokens.borderColor}`,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                width: "40%",
                background: `linear-gradient(90deg, transparent, ${tokens.borderColor}, transparent)`,
                animation: "skeletonSlide 1.2s ease-in-out infinite",
              }}
            />
          </div>
          <div
            style={{
              height: 10,
              width: 96,
              borderRadius: 6,
              background: tokens.themePillBg,
              animation: "pulseDot 1.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderRadius: 12,
          background: tokens.sidebar,
          border: `1px solid ${tokens.borderColor}`,
          color: tokens.textMuted,
          fontSize: 12,
          fontFamily: typography.fontSans,
          boxShadow: theme === "light" ? "0 1px 3px rgba(0,0,0,0.04)" : "none",
        }}
        role="status"
        aria-live="polite"
      >
        <HardDrive size={16} style={{ flexShrink: 0 }} />
        <span>Storage info unavailable</span>
      </div>
    );
  }

  const used = (data as any).storageUsedBytes ?? 0;
  const quota = (data as any).storageQuotaBytes ?? 0;
  const pct = quota > 0 ? Math.min((used / quota) * 100, 100) : 0;
  const { warn, critical } = config.ui.storageWarningThresholds;

  const barColor = pct >= critical ? "#EF4444" : pct >= warn ? "#F59E0B" : "#10B981";
  const warnLabel = pct >= critical ? " — Almost full" : pct >= warn ? " — High usage" : "";

  return (
    <div style={containerStyle} role="status" aria-label={`Storage ${formatBytes(used)} of ${formatBytes(quota)} used`}>
      <HardDrive size={16} style={{ color: tokens.textMuted, flexShrink: 0 }} aria-hidden />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {/* progress track */}
        <div
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{
            height: 8,
            borderRadius: 999,
            background: tokens.themePillBg,
            border: `1px solid ${tokens.borderColor}`,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: barColor,
              borderRadius: 999,
              transition: `width 400ms ${motionTokens.easing.lux}, background 300ms ${motionTokens.easing.lux}`,
            }}
          />
        </div>
        <p
          style={{
            fontFamily: typography.fontSans,
            fontSize: 11,
            color: tokens.textMuted,
            lineHeight: 1,
            margin: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {formatBytes(used)} / {formatBytes(quota)} used
          {warnLabel && (
            <span style={{ color: barColor, marginLeft: 6, fontWeight: 600 }}>{warnLabel}</span>
          )}
        </p>
      </div>
      <span
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 11,
          fontWeight: 600,
          color: barColor,
          background: tokens.themePillBg,
          border: `1px solid ${tokens.borderColor}`,
          padding: "2px 8px",
          borderRadius: 999,
          flexShrink: 0,
        }}
      >
        {Math.round(pct)}%
      </span>
    </div>
  );
}

export default StorageQuotaBarAtomic;
