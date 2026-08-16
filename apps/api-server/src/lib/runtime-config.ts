import { sql } from "drizzle-orm";
import {
  db,
  appSettingsTable,
  SETTINGS_REGISTRY,
  getSettingsEntry,
} from "@workspace/db";
import type {
  SettingKey,
  SettingsRegistryEntry,
  SettingValue,
  SettingValueType,
} from "@workspace/db";
import { logger } from "./logger";

/**
 * Runtime config read path — the "effective state is computed, not stored"
 * layer on top of the `app_settings` hub.
 *
 * The typed {@link RuntimeConfig} below mirrors the closed key set in
 * `packages/db` (settings-registry.ts) as a flat, camelCase object. Values are
 * read into an in-process cache that is refreshed by a version poll: inside
 * the TTL the cache is served with zero DB reads; outside it, a single
 * `max(version_number)` query decides whether a full reload is needed. A
 * missing row (or an invalid value) always falls back to the registry default,
 * so the runtime behaves exactly like the previously hardcoded values.
 */

// ─── Types ────────────────────────────────────────────────────────────────

export interface RuntimeAnalyzeConfig {
  enabled: boolean;
  timeoutMs: number;
  version: string;
  signedUrlExpiryS: number;
}

export interface RuntimeUploadConfig {
  maxFileSizeBytes: number;
  maxDurationS: number;
  allowedMimeTypes: string[];
  presignExpiryS: number;
  rateLimit: { max: number; windowMs: number };
}

export interface RuntimeStorageConfig {
  quotaDefaultBytes: number;
}

export interface RuntimeSongsConfig {
  featuredCount: number;
}

export interface RuntimeLearningConfig {
  masteryMinAttempts: number;
  masterySuccessRate: number;
  demoEnabled: boolean;
}

export interface RuntimeAuthConfig {
  retryAfterSeconds: number;
}

export interface RuntimePlayerConfig {
  masterUrlExpiryS: number;
  chordLevels: string[];
  speedMin: number;
  speedMax: number;
  semitonesMin: number;
  semitonesMax: number;
}

export interface RuntimeUiConfig {
  storageWarningThresholds: { warn: number; critical: number };
  postLoginRedirect: string;
  urlImportEnabled: boolean;
  theme: string;
  homeCtaRedirect: string;
}

export interface RuntimeRoutesConfig {
  musicHubVisible: boolean;
  libraryVisible: boolean;
  learnVisible: boolean;
  processVisible: boolean;
  profileVisible: boolean;
}

export interface RuntimeBrandingConfig {
  appName: string;
  appVersion: string;
}

/** The effective, fully-decoded runtime settings (flat camelCase groups). */
export interface RuntimeConfig {
  analyze: RuntimeAnalyzeConfig;
  upload: RuntimeUploadConfig;
  storage: RuntimeStorageConfig;
  songs: RuntimeSongsConfig;
  learning: RuntimeLearningConfig;
  auth: RuntimeAuthConfig;
  player: RuntimePlayerConfig;
  ui: RuntimeUiConfig;
  routes: RuntimeRoutesConfig;
  branding: RuntimeBrandingConfig;
}

/** One `app_settings` row as consumed by `computeRuntimeConfig`. */
export interface RuntimeSettingsRow {
  key: SettingKey;
  value: SettingValue;
  valueType: SettingValueType;
}

/** Immutable snapshot served to consumers (and by `GET /config/bootstrap`). */
export interface RuntimeConfigSnapshot {
  /** Global settings fingerprint: `max(app_settings.version_number)`. */
  version: number | null;
  /** ISO timestamp of the newest applied settings change. */
  updatedAt: string | null;
  settings: RuntimeConfig;
}

// ─── Decoding (pure) ──────────────────────────────────────────────────────

/** Registered keys, used defensively to ignore drifted DB rows. */
const VALID_SETTING_KEYS = new Set<SettingKey>(
  SETTINGS_REGISTRY.map((entry) => entry.key),
);

function isPlainObject(value: SettingValue): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Decode a raw setting value by its registry entry's declared type. Values
 * that do not match the expected shape are rejected in favor of the registry
 * default — the closed registry is the source of truth for both shape and
 * fallback, so a corrupt row can never poison the runtime.
 */
function decodeSettingValue(
  entry: SettingsRegistryEntry,
  raw: SettingValue,
): SettingValue {
  switch (entry.valueType) {
    case "boolean":
      return typeof raw === "boolean" ? raw : entry.defaultValue;
    case "number":
      return typeof raw === "number" && Number.isFinite(raw)
        ? raw
        : entry.defaultValue;
    case "string":
      return typeof raw === "string" ? raw : entry.defaultValue;
    case "string[]":
      return Array.isArray(raw) && raw.every((item) => typeof item === "string")
        ? raw
        : entry.defaultValue;
    case "number[]":
      return Array.isArray(raw) && raw.every((item) => typeof item === "number")
        ? raw
        : entry.defaultValue;
    case "object":
      return isPlainObject(raw) ? raw : entry.defaultValue;
    default:
      // Unreachable while `valueType` is a closed union — defensive fallback.
      return entry.defaultValue;
  }
}

/**
 * Compute the effective {@link RuntimeConfig} from raw `app_settings` rows.
 *
 * Pure function: no I/O, no per-request DB reads. Rows are decoded by their
 * registry entry and missing keys fall back to the registry default, so an
 * empty (or unseeded) table yields exactly today's hardcoded behavior.
 */
export function computeRuntimeConfig(rows: RuntimeSettingsRow[]): RuntimeConfig {
  const values = new Map<SettingKey, SettingValue>();

  for (const row of rows) {
    // The registry is the closed source of truth — skip unknown keys rather
    // than throwing on a drifted row.
    if (!VALID_SETTING_KEYS.has(row.key)) {
      continue;
    }
    const entry = getSettingsEntry(row.key);
    values.set(row.key, decodeSettingValue(entry, row.value));
  }

  // Read a decoded value, falling back to the registry default when missing.
  const read = (key: SettingKey): SettingValue =>
    values.get(key) ?? getSettingsEntry(key).defaultValue;

  return {
    analyze: {
      enabled: read("analyze.enabled") as boolean,
      timeoutMs: read("analyze.timeout_ms") as number,
      version: read("analyze.version") as string,
      signedUrlExpiryS: read("analyze.signed_url_expiry_s") as number,
    },
    upload: {
      maxFileSizeBytes: read("upload.max_file_size_bytes") as number,
      maxDurationS: read("upload.max_duration_s") as number,
      allowedMimeTypes: read("upload.allowed_mime_types") as string[],
      presignExpiryS: read("upload.presign_expiry_s") as number,
      rateLimit: read("upload.rate_limit") as { max: number; windowMs: number },
    },
    storage: {
      quotaDefaultBytes: read("storage.quota_default_bytes") as number,
    },
    songs: {
      featuredCount: read("songs.featured_count") as number,
    },
    learning: {
      masteryMinAttempts: read("learning.mastery_min_attempts") as number,
      masterySuccessRate: read("learning.mastery_success_rate") as number,
      demoEnabled: read("learning.demo_enabled") as boolean,
    },
    auth: {
      retryAfterSeconds: read("auth.retry_after_seconds") as number,
    },
    player: {
      masterUrlExpiryS: read("player.master_url_expiry_s") as number,
      chordLevels: read("player.chord_levels") as string[],
      speedMin: read("player.speed_min") as number,
      speedMax: read("player.speed_max") as number,
      semitonesMin: read("player.semitones_min") as number,
      semitonesMax: read("player.semitones_max") as number,
    },
    ui: {
      storageWarningThresholds: read("ui.storage_warning_thresholds") as {
        warn: number;
        critical: number;
      },
      postLoginRedirect: read("ui.post_login_redirect") as string,
      urlImportEnabled: read("ui.url_import_enabled") as boolean,
      theme: read("ui.theme") as string,
      homeCtaRedirect: read("ui.home_cta_redirect") as string,
    },
    routes: {
      musicHubVisible: read("routes.music_hub_visible") as boolean,
      libraryVisible: read("routes.library_visible") as boolean,
      learnVisible: read("routes.learn_visible") as boolean,
      processVisible: read("routes.process_visible") as boolean,
      profileVisible: read("routes.profile_visible") as boolean,
    },
    branding: {
      appName: read("branding.app_name") as string,
      appVersion: read("branding.app_version") as string,
    },
  };
}

// ─── Version-polled cache ─────────────────────────────────────────────────

/** Interval (ms) between version polls that may refresh the in-memory config. */
export const RUNTIME_CONFIG_POLL_TTL_MS = 30_000;

interface CachedRuntimeConfig {
  version: number | null;
  updatedAt: string | null;
  settings: RuntimeConfig;
  /** `Date.now()` of the last time the cache was (re)validated. */
  loadedAt: number;
}

let cached: CachedRuntimeConfig | null = null;
/** Single-flight guard so concurrent TTL expirations share one reload. */
let refreshing: Promise<RuntimeConfigSnapshot> | null = null;

interface SettingsVersionRow {
  maxVersion: number | null;
  maxUpdatedAt: Date | null;
}

/** Trivial poll query — the version fingerprint plus the newest timestamp. */
async function readSettingsVersion(): Promise<SettingsVersionRow> {
  const [row] = await db
    .select({
      maxVersion: sql<number | null>`max(${appSettingsTable.versionNumber})`,
      maxUpdatedAt: sql<Date | null>`max(${appSettingsTable.updatedAt})`,
    })
    .from(appSettingsTable);

  return {
    maxVersion: row?.maxVersion ?? null,
    maxUpdatedAt: row?.maxUpdatedAt ?? null,
  };
}

async function loadSettingsRows(): Promise<RuntimeSettingsRow[]> {
  const rows = await db
    .select({
      key: appSettingsTable.key,
      value: appSettingsTable.value,
      valueType: appSettingsTable.valueType,
    })
    .from(appSettingsTable);

  // The DB columns are plain text; the closed registry is the source of truth
  // for the valid key/value-type unions.
  return rows.map((row) => ({
    key: row.key as SettingKey,
    value: row.value,
    valueType: row.valueType as SettingValueType,
  }));
}

/**
 * Refresh the cache: poll the version, and only reload rows (and recompute the
 * effective config) when the version actually changed. Errors are tolerated —
 * the last good snapshot (or registry defaults on first load) is served.
 */
async function refresh(now: number): Promise<RuntimeConfigSnapshot> {
  try {
    const { maxVersion, maxUpdatedAt } = await readSettingsVersion();

    if (cached && cached.version === maxVersion) {
      // Version unchanged — keep the computed config, just advance the TTL.
      cached = { ...cached, loadedAt: now };
      return {
        version: cached.version,
        updatedAt: cached.updatedAt,
        settings: cached.settings,
      };
    }

    const rows = await loadSettingsRows();
    const settings = computeRuntimeConfig(rows);

    // Atomic reference swap: publish the new config as one immutable object.
    cached = {
      version: maxVersion,
      updatedAt: maxUpdatedAt ? new Date(maxUpdatedAt).toISOString() : null,
      settings,
      loadedAt: now,
    };

    return {
      version: cached.version,
      updatedAt: cached.updatedAt,
      settings: cached.settings,
    };
  } catch (err) {
    logger.error(
      { err },
      "Failed to refresh runtime config; serving cached/default",
    );
    if (cached) {
      return {
        version: cached.version,
        updatedAt: cached.updatedAt,
        settings: cached.settings,
      };
    }
    return { version: null, updatedAt: null, settings: computeRuntimeConfig([]) };
  }
}

/**
 * Return the effective runtime config. Inside the poll TTL this is a pure
 * in-memory read (zero DB); outside it runs one `max(version_number)` query
 * and only reloads rows when the version changed. Never rejects — failures
 * fall back to the last good snapshot or registry defaults.
 */
export async function getRuntimeConfig(): Promise<RuntimeConfigSnapshot> {
  const now = Date.now();

  if (cached && now - cached.loadedAt < RUNTIME_CONFIG_POLL_TTL_MS) {
    return {
      version: cached.version,
      updatedAt: cached.updatedAt,
      settings: cached.settings,
    };
  }

  // Dedupe concurrent refreshes (single-flight) so only one caller pays the
  // full row load when the TTL expires under load.
  if (refreshing) {
    return refreshing;
  }

  refreshing = refresh(now).finally(() => {
    refreshing = null;
  });

  return refreshing;
}

/**
 * Warm the runtime config cache at boot so the first request never pays a cold
 * load. Failures are logged and swallowed — the cache falls back to registry
 * defaults until the next poll succeeds.
 */
export async function warmRuntimeConfig(): Promise<void> {
  try {
    await getRuntimeConfig();
    logger.info("Runtime config cache warmed");
  } catch (err) {
    logger.error({ err }, "Failed to warm runtime config cache");
  }
}
