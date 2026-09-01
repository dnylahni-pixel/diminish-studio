import { z } from "zod";

// Dummy publishable key used only for preview when Vercel env var is missing.
// Must start with pk_test_ so Clerk's own format check doesn't throw at import,
// but main.tsx will detect it as dummy and skip ClerkProvider entirely.
export const DUMMY_CLERK_PUBLISHABLE_KEY =
  "pk_test_dummy_for_preview_00000000000000000000000000";

// Fallback API base used only for preview when env is missing; lab still
// renders (degraded) instead of white-screening on config parse.
export const DUMMY_API_BASE_URL = "https://api.example.invalid";

const frontendEnvironmentSchema = z.object({
  VITE_APP_ENVIRONMENT: z.enum([
    "development",
    "preview",
    "staging",
    "production",
    "test",
  ]),
  VITE_API_BASE_URL: z.string().trim().url(),
  VITE_CLERK_PUBLISHABLE_KEY: z.string().trim().min(1),
});

/**
 * Returns true when the key is the preview dummy (or any string containing
 * "dummy"). Centralised so main.tsx and config both agree on what counts as
 * "no real Clerk".
 */
export function isDummyClerkKey(
  key: string | undefined | null,
): boolean {
  if (!key) return true;
  const trimmed = key.trim();
  if (trimmed === DUMMY_CLERK_PUBLISHABLE_KEY) return true;
  // also treat the literal "dummy" used in build tests as dummy
  if (trimmed.toLowerCase().includes("dummy")) return true;
  return false;
}

/**
 * Returns true only for a real Clerk publishable key that should be passed
 * to <ClerkProvider>.  Rejects dummy, empty, and malformed keys.
 */
export function isClerkPublishableKeyValid(
  key: string | undefined | null,
): boolean {
  if (!key) return false;
  const trimmed = key.trim();
  if (isDummyClerkKey(trimmed)) return false;
  if (
    !trimmed.startsWith("pk_test_") &&
    !trimmed.startsWith("pk_live_")
  )
    return false;
  // real keys are ~50+ chars; dummy with pk_test_ prefix but short should fail
  if (trimmed.length < 20) return false;
  return true;
}

export function parseFrontendEnvironment(environment: Record<string, unknown>) {
  // Clone so we don't mutate the caller's object (import.meta.env is readonly in some runtimes)
  const envCopy: Record<string, unknown> = { ...environment };

  const rawAppEnv = envCopy.VITE_APP_ENVIRONMENT;
  const rawKey = envCopy.VITE_CLERK_PUBLISHABLE_KEY;
  const rawApi = envCopy.VITE_API_BASE_URL;

  const isKeyMissing =
    typeof rawKey !== "string" || rawKey.trim() === "";
  const isApiMissing =
    typeof rawApi !== "string" || rawApi.trim() === "";

  // For preview builds on Vercel the env var is often absent because .env.local
  // is gitignored and not mirrored in the dashboard.  Inject dummies so
  // `parseFrontendEnvironment` does NOT throw ("Invalid frontend environment")
  // and the app can still render /lab/sidebar-atomic without Clerk instead of
  // white-screening.  Production/staging keep the strict throw.
  if (rawAppEnv === "preview") {
    if (isKeyMissing) {
      envCopy.VITE_CLERK_PUBLISHABLE_KEY = DUMMY_CLERK_PUBLISHABLE_KEY;
    }
    if (isApiMissing) {
      envCopy.VITE_API_BASE_URL = DUMMY_API_BASE_URL;
    }
  }

  const result = frontendEnvironmentSchema.safeParse(envCopy);

  if (result.success) {
    return result.data;
  }

  const details = result.error.issues
    .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid frontend environment:\n${details}`);
}
