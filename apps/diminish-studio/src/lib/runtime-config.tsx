import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import {
  useGetConfigBootstrap,
  type ConfigBootstrap,
  type RuntimeConfig,
} from "@workspace/api-client-react";

// ─────────────────────────────────────────────────────────────────────────────
// Fallback values — a verbatim mirror of the server's seeded registry defaults
// (`packages/db/src/schema/settings-registry.ts`), so a loading / failed /
// invalid bootstrap behaves exactly like the server's fallback (and like the
// app did before) — no behavior change unless bootstrap succeeds.
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_CONFIG: RuntimeConfig = {
  analyze: {
    enabled: false,
    timeoutMs: 300_000,
    version: "1",
    signedUrlExpiryS: 3600,
  },
  upload: {
    maxFileSizeBytes: 100 * 1024 * 1024, // 100MB (was: MAX_FILE_SIZE in process.tsx)
    maxDurationS: 600, // 10 minutes (was: MAX_DURATION in process.tsx)
    allowedMimeTypes: [
      "audio/mpeg",
      "audio/wav",
      "audio/flac",
      "audio/mp4",
      "audio/ogg",
    ],
    presignExpiryS: 900,
    rateLimit: { max: 10, windowMs: 60_000 },
  },
  storage: { quotaDefaultBytes: 1_073_741_824 },
  songs: { featuredCount: 8 },
  learning: { masteryMinAttempts: 5, masterySuccessRate: 0.8, demoEnabled: true },
  auth: { retryAfterSeconds: 60 },
  player: {
    masterUrlExpiryS: 900,
    chordLevels: ["simple", "medium", "pro"],
    speedMin: 0.3,
    speedMax: 2.0,
    semitonesMin: -12,
    semitonesMax: 12,
  },
  ui: {
    storageWarningThresholds: { warn: 70, critical: 90 },
    postLoginRedirect: "/library",
    urlImportEnabled: false,
    theme: "classic",
    homeCtaRedirect: "/register",
  },
  routes: {
    musicHubVisible: true,
    libraryVisible: true,
    learnVisible: true,
    processVisible: true,
    profileVisible: true,
  },
  branding: {
    appName: "DiminishStudio",
    appVersion: "v1.0.0",
  },
};

const KNOWN_CHORD_LEVELS = new Set(["simple", "medium", "pro"]);

// ── Small sanitizers: any invalid bootstrap field falls back to today's value ──

function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function pickPositive(value: unknown, fallback: number): number {
  return isPositiveNumber(value) ? value : fallback;
}

function pickString(value: unknown, fallback: string): string {
  return isNonEmptyString(value) ? value : fallback;
}

function pickStringList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const list = value.filter(isNonEmptyString);
  return list.length > 0 ? list : fallback;
}

function pickBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function pickChordLevels(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const levels = value.filter(
    (lvl): lvl is string =>
      typeof lvl === "string" && KNOWN_CHORD_LEVELS.has(lvl),
  );
  return levels.length > 0 ? levels : fallback;
}

function pickThresholds(
  value: { warn?: unknown; critical?: unknown } | undefined,
  fallback: { warn: number; critical: number },
): { warn: number; critical: number } {
  if (!value) return fallback;
  const { warn, critical } = value;
  if (
    isPositiveNumber(warn) &&
    isPositiveNumber(critical) &&
    warn <= critical
  ) {
    return { warn, critical };
  }
  return fallback;
}

function pickRange(
  value: { min?: unknown; max?: unknown } | undefined,
  fallback: { min: number; max: number },
): { min: number; max: number } {
  if (!value) return fallback;
  const { min, max } = value;
  if (isPositiveNumber(min) && isPositiveNumber(max) && min < max) {
    return { min, max };
  }
  return fallback;
}

// Speed ranges are strictly positive, but semitones may be negative — so it
// needs its own finite-number check instead of the positive-only guard.
function pickSignedRange(
  value: { min?: unknown; max?: unknown } | undefined,
  fallback: { min: number; max: number },
): { min: number; max: number } {
  if (!value) return fallback;
  const { min, max } = value;
  const lo = typeof min === "number" && Number.isFinite(min) ? min : Number.NaN;
  const hi = typeof max === "number" && Number.isFinite(max) ? max : Number.NaN;
  if (Number.isFinite(lo) && Number.isFinite(hi) && lo < hi) {
    return { min: lo, max: hi };
  }
  return fallback;
}

function sanitizeConfig(raw: ConfigBootstrap | undefined): RuntimeConfig {
  const settings = raw?.settings;
  if (!settings) return FALLBACK_CONFIG;

  const speed = pickRange(
    { min: settings.player?.speedMin, max: settings.player?.speedMax },
    { min: FALLBACK_CONFIG.player.speedMin, max: FALLBACK_CONFIG.player.speedMax },
  );
  const semitones = pickSignedRange(
    { min: settings.player?.semitonesMin, max: settings.player?.semitonesMax },
    { min: FALLBACK_CONFIG.player.semitonesMin, max: FALLBACK_CONFIG.player.semitonesMax },
  );

  return {
    analyze: settings.analyze ?? FALLBACK_CONFIG.analyze,
    upload: {
      maxFileSizeBytes: pickPositive(
        settings.upload?.maxFileSizeBytes,
        FALLBACK_CONFIG.upload.maxFileSizeBytes,
      ),
      maxDurationS: pickPositive(
        settings.upload?.maxDurationS,
        FALLBACK_CONFIG.upload.maxDurationS,
      ),
      allowedMimeTypes: pickStringList(
        settings.upload?.allowedMimeTypes,
        FALLBACK_CONFIG.upload.allowedMimeTypes,
      ),
      presignExpiryS: pickPositive(
        settings.upload?.presignExpiryS,
        FALLBACK_CONFIG.upload.presignExpiryS,
      ),
      rateLimit: settings.upload?.rateLimit ?? FALLBACK_CONFIG.upload.rateLimit,
    },
    storage: settings.storage ?? FALLBACK_CONFIG.storage,
    songs: settings.songs ?? FALLBACK_CONFIG.songs,
    learning: settings.learning ?? FALLBACK_CONFIG.learning,
    auth: settings.auth ?? FALLBACK_CONFIG.auth,
    player: {
      masterUrlExpiryS: pickPositive(
        settings.player?.masterUrlExpiryS,
        FALLBACK_CONFIG.player.masterUrlExpiryS,
      ),
      chordLevels: pickChordLevels(
        settings.player?.chordLevels,
        FALLBACK_CONFIG.player.chordLevels,
      ),
      speedMin: speed.min,
      speedMax: speed.max,
      semitonesMin: semitones.min,
      semitonesMax: semitones.max,
    },
    ui: {
      storageWarningThresholds: pickThresholds(
        settings.ui?.storageWarningThresholds,
        FALLBACK_CONFIG.ui.storageWarningThresholds,
      ),
      postLoginRedirect: pickString(
        settings.ui?.postLoginRedirect,
        FALLBACK_CONFIG.ui.postLoginRedirect,
      ),
      urlImportEnabled:
        typeof settings.ui?.urlImportEnabled === "boolean"
          ? settings.ui.urlImportEnabled
          : FALLBACK_CONFIG.ui.urlImportEnabled,
      theme: pickString(settings.ui?.theme, FALLBACK_CONFIG.ui.theme),
      homeCtaRedirect: pickString(
        settings.ui?.homeCtaRedirect,
        FALLBACK_CONFIG.ui.homeCtaRedirect,
      ),
    },
    routes: {
      musicHubVisible: pickBoolean(
        settings.routes?.musicHubVisible,
        FALLBACK_CONFIG.routes.musicHubVisible,
      ),
      libraryVisible: pickBoolean(
        settings.routes?.libraryVisible,
        FALLBACK_CONFIG.routes.libraryVisible,
      ),
      learnVisible: pickBoolean(
        settings.routes?.learnVisible,
        FALLBACK_CONFIG.routes.learnVisible,
      ),
      processVisible: pickBoolean(
        settings.routes?.processVisible,
        FALLBACK_CONFIG.routes.processVisible,
      ),
      profileVisible: pickBoolean(
        settings.routes?.profileVisible,
        FALLBACK_CONFIG.routes.profileVisible,
      ),
    },
    branding: {
      appName: pickString(
        settings.branding?.appName,
        FALLBACK_CONFIG.branding.appName,
      ),
      appVersion: pickString(
        settings.branding?.appVersion,
        FALLBACK_CONFIG.branding.appVersion,
      ),
    },
  };
}

const RuntimeConfigContext = createContext<RuntimeConfig | undefined>(undefined);

/**
 * Fetches the runtime settings snapshot from `GET /config/bootstrap` and makes
 * it available to the whole tree. Until the query settles (or if it fails),
 * consumers receive today's hardcoded values — no behavior change.
 */
export function RuntimeConfigProvider({ children }: { children: ReactNode }) {
  const { data } = useGetConfigBootstrap();
  const config = useMemo(() => sanitizeConfig(data), [data]);

  useEffect(() => {
    document.documentElement.dataset.appTheme = config.ui.theme;
  }, [config]);

  return (
    <RuntimeConfigContext.Provider value={config}>
      {children}
    </RuntimeConfigContext.Provider>
  );
}

/**
 * Access the runtime settings snapshot. Falls back to the previous hardcoded
 * values whenever the bootstrap is still loading, fails, or returns an invalid
 * field.
 */
export function useRuntimeConfig(): RuntimeConfig {
  const config = useContext(RuntimeConfigContext);
  return config ?? FALLBACK_CONFIG;
}
