/**
 * Settings Registry — mirror of `packages/db/src/schema/settings-registry.ts`
 * (the single source of truth for the closed set of application settings).
 *
 * admin-new deliberately does NOT depend on `@workspace/db`; per the existing
 * convention it mirrors the shared Postgres schema locally (see the other files
 * under `src/db/schema/`). This file is the compile-time contract: key names,
 * groups, value types and defaults. Keep it in sync with packages/db.
 */

export const SETTINGS_GROUPS = [
  "analyze",
  "upload",
  "storage",
  "songs",
  "learning",
  "auth",
  "player",
  "ui",
  "routes",
  "branding",
] as const;

export type SettingsGroup = (typeof SETTINGS_GROUPS)[number];

export const SETTING_VALUE_TYPES = [
  "boolean",
  "number",
  "string",
  "string[]",
  "number[]",
  "object",
] as const;

export type SettingValueType = (typeof SETTING_VALUE_TYPES)[number];

/** The concrete JSON shapes that a setting value may take. */
export type SettingValue =
  | boolean
  | number
  | string
  | string[]
  | number[]
  | Record<string, unknown>;

export interface SettingsRegistryEntry {
  /** Stable, namespaced key — the closed set `app_settings.key` allows. */
  key: string;
  group: SettingsGroup;
  valueType: SettingValueType;
  defaultValue: SettingValue;
  description: string;
}

export const SETTINGS_REGISTRY = [
  // ── analyze ─────────────────────────────────────────────────────────
  {
    key: "analyze.enabled",
    group: "analyze",
    valueType: "boolean",
    defaultValue: false,
    description:
      "Global kill-switch for RunPod analysis. Today it is derived from the backend config (backendConfig.runPod); runtime consumers should treat `false` as analysis disabled.",
  },
  {
    key: "analyze.timeout_ms",
    group: "analyze",
    valueType: "number",
    defaultValue: 300_000,
    description: "RunPod analysis request timeout in milliseconds (5 minutes).",
  },
  {
    key: "analyze.version",
    group: "analyze",
    valueType: "string",
    defaultValue: "1",
    description:
      "Analysis version tag stamped on completed analyses (analysisVersion).",
  },
  {
    key: "analyze.signed_url_expiry_s",
    group: "analyze",
    valueType: "number",
    defaultValue: 3600,
    description:
      "Presigned URL expiry (seconds) for RunPod to fetch the source audio (1 hour).",
  },

  // ── upload ──────────────────────────────────────────────────────────
  {
    key: "upload.max_file_size_bytes",
    group: "upload",
    valueType: "number",
    defaultValue: 104_857_600,
    description: "Maximum upload file size in bytes (100 MB).",
  },
  {
    key: "upload.max_duration_s",
    group: "upload",
    valueType: "number",
    defaultValue: 600,
    description: "Maximum audio duration in seconds (10 minutes).",
  },
  {
    key: "upload.allowed_mime_types",
    group: "upload",
    valueType: "string[]",
    defaultValue: [
      "audio/mpeg",
      "audio/wav",
      "audio/flac",
      "audio/mp4",
      "audio/ogg",
    ],
    description: "Allowed audio MIME types for uploads (5 types).",
  },
  {
    key: "upload.presign_expiry_s",
    group: "upload",
    valueType: "number",
    defaultValue: 900,
    description: "Presign URL expiry in seconds (15 minutes).",
  },
  {
    key: "upload.rate_limit",
    group: "upload",
    valueType: "object",
    defaultValue: { max: 10, windowMs: 60_000 },
    description:
      "Per-process upload rate limit: max requests in a rolling window (windowMs).",
  },

  // ── storage ─────────────────────────────────────────────────────────
  {
    key: "storage.quota_default_bytes",
    group: "storage",
    valueType: "number",
    defaultValue: 1_073_741_824,
    description:
      "Default per-user storage quota in bytes (1 GB); also the default for users.storage_quota_bytes.",
  },

  // ── songs ───────────────────────────────────────────────────────────
  {
    key: "songs.featured_count",
    group: "songs",
    valueType: "number",
    defaultValue: 8,
    description: "Number of featured songs returned by GET /songs/featured.",
  },

  // ── learning ────────────────────────────────────────────────────────
  {
    key: "learning.mastery_min_attempts",
    group: "learning",
    valueType: "number",
    defaultValue: 5,
    description: "Minimum attempts before a chord is eligible for mastery.",
  },
  {
    key: "learning.mastery_success_rate",
    group: "learning",
    valueType: "number",
    defaultValue: 0.8,
    description: "Required success rate (0..1) to master a chord; 0.8 = 80%.",
  },
  {
    key: "learning.demo_enabled",
    group: "learning",
    valueType: "boolean",
    defaultValue: true,
    description:
      "Demo mode: learning/chords routes answer for a demo user without Clerk auth (DEMO_USER_ID = 1).",
  },

  // ── auth ────────────────────────────────────────────────────────────
  {
    key: "auth.retry_after_seconds",
    group: "auth",
    valueType: "number",
    defaultValue: 60,
    description:
      "Clerk auth retry-after window in seconds (repeated in users.ts and library.ts).",
  },

  // ── player ──────────────────────────────────────────────────────────
  {
    key: "player.master_url_expiry_s",
    group: "player",
    valueType: "number",
    defaultValue: 900,
    description: "Master track signed URL expiry in seconds (15 minutes).",
  },
  {
    key: "player.chord_levels",
    group: "player",
    valueType: "string[]",
    defaultValue: ["simple", "medium", "pro"],
    description: "Available chord complexity levels offered by the player.",
  },
  {
    key: "player.speed_min",
    group: "player",
    valueType: "number",
    defaultValue: 0.3,
    description: "Minimum playback speed multiplier.",
  },
  {
    key: "player.speed_max",
    group: "player",
    valueType: "number",
    defaultValue: 2.0,
    description: "Maximum playback speed multiplier.",
  },
  {
    key: "player.semitones_min",
    group: "player",
    valueType: "number",
    defaultValue: -12,
    description: "Minimum pitch-shift range in semitones.",
  },
  {
    key: "player.semitones_max",
    group: "player",
    valueType: "number",
    defaultValue: 12,
    description: "Maximum pitch-shift range in semitones.",
  },

  // ── ui ──────────────────────────────────────────────────────────────
  {
    key: "ui.storage_warning_thresholds",
    group: "ui",
    valueType: "object",
    defaultValue: { warn: 70, critical: 90 },
    description:
      "Storage quota usage percentages (0..100) that turn the quota bar amber (warn) and red (critical).",
  },
  {
    key: "ui.post_login_redirect",
    group: "ui",
    valueType: "string",
    defaultValue: "/library",
    description: "Redirect target after a successful login/registration.",
  },
  {
    key: "ui.url_import_enabled",
    group: "ui",
    valueType: "boolean",
    defaultValue: false,
    description:
      "Enables the 'import by URL' form on the Process page (currently disabled — 'coming soon').",
  },
  {
    key: "ui.theme",
    group: "ui",
    valueType: "string",
    defaultValue: "classic",
    description:
      "User-app theme variant: 'classic' keeps the current look; 'new' activates the new theme surface (data-app-theme=new).",
  },
  {
    key: "ui.home_cta_redirect",
    group: "ui",
    valueType: "string",
    defaultValue: "/register",
    description:
      "Landing page primary CTA target — where the 'Start creating' button redirects the user.",
  },

  // ── branding ────────────────────────────────────────────────────────
  {
    key: "branding.app_name",
    group: "branding",
    valueType: "string",
    defaultValue: "DiminishStudio",
    description: "Application brand name shown in the sidebar/header.",
  },
  {
    key: "branding.app_version",
    group: "branding",
    valueType: "string",
    defaultValue: "v1.0.0",
    description: "Application version shown in the footer.",
  },

  // ── routes (menu / module visibility) ───────────────────────────────
  {
    key: "routes.music_hub_visible",
    group: "routes",
    valueType: "boolean",
    defaultValue: true,
    description: "Show the Music Hub module in the user-app navigation.",
  },
  {
    key: "routes.library_visible",
    group: "routes",
    valueType: "boolean",
    defaultValue: true,
    description: "Show the Library module in the user-app navigation.",
  },
  {
    key: "routes.learn_visible",
    group: "routes",
    valueType: "boolean",
    defaultValue: true,
    description: "Show the Learn module in the user-app navigation.",
  },
  {
    key: "routes.process_visible",
    group: "routes",
    valueType: "boolean",
    defaultValue: true,
    description: "Show the Process (upload) module in the user-app navigation.",
  },
  {
    key: "routes.profile_visible",
    group: "routes",
    valueType: "boolean",
    defaultValue: true,
    description: "Show the Profile module in the user-app navigation.",
  },
] as const satisfies readonly SettingsRegistryEntry[];

/** The closed union of all valid setting keys (NOT freeform). */
export type SettingKey = (typeof SETTINGS_REGISTRY)[number]["key"];

/** Look up a registry entry by key (compile-time-checked). */
export function getSettingsEntry(key: SettingKey): SettingsRegistryEntry {
  const entry = SETTINGS_REGISTRY.find((e) => e.key === key);
  if (!entry) {
    throw new Error(`Unknown setting key: ${key}`);
  }
  return entry;
}
