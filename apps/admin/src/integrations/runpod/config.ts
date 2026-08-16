import "server-only";
import { z } from "zod";

/**
 * Server-only environment configuration for the Runpod integration.
 *
 * Only `RUNPOD_API_KEY` is a secret. Everything else is an optional, non-secret
 * override with a safe documented default. This module never accepts a
 * credential value from a request body, form, or Server Action — the bootstrap
 * credential is read from `process.env` exclusively.
 *
 * See docs/security-model.md for the full credential-handling contract and
 * .env.example for setup instructions.
 */

const DEFAULT_REST_BASE_URL = "https://rest.runpod.io/v1";
const DEFAULT_GRAPHQL_URL = "https://api.runpod.io/graphql";
const DEFAULT_MAX_LIST_ITEMS = 500;
const DEFAULT_TIMEOUT_MS = 10_000;

// Runpod API keys are opaque bearer tokens. Runpod does not publish a fixed
// length or character set, so validation is intentionally conservative:
// non-empty, no whitespace, reasonable minimum length to catch obvious
// copy/paste mistakes (e.g. pasting a label instead of the key).
const apiKeyShape = z
  .string()
  .trim()
  .min(20, "Runpod API keys are long opaque tokens; this value is too short to be valid.")
  .refine((value) => !/\s/.test(value), "A Runpod API key must not contain whitespace.");

const envSchema = z.object({
  RUNPOD_API_KEY: z.string().optional(),
  RUNPOD_API_BASE_URL: z.string().url().optional(),
  RUNPOD_GRAPHQL_URL: z.string().url().optional(),
  RUNPOD_MAX_LIST_ITEMS: z.coerce.number().int().positive().optional(),
  RUNPOD_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().optional(),
});

export type RunpodConfigState =
  | { status: "not_configured" }
  | { status: "invalid_format"; reason: string }
  | { status: "configured"; apiKey: string; restBaseUrl: string; graphqlUrl: string; maxListItems: number; requestTimeoutMs: number };

function readEnv(): RunpodConfigState {
  const parsedEnv = envSchema.safeParse({
    RUNPOD_API_KEY: process.env.RUNPOD_API_KEY,
    RUNPOD_API_BASE_URL: process.env.RUNPOD_API_BASE_URL,
    RUNPOD_GRAPHQL_URL: process.env.RUNPOD_GRAPHQL_URL,
    RUNPOD_MAX_LIST_ITEMS: process.env.RUNPOD_MAX_LIST_ITEMS,
    RUNPOD_REQUEST_TIMEOUT_MS: process.env.RUNPOD_REQUEST_TIMEOUT_MS,
  });

  if (!parsedEnv.success) {
    return {
      status: "invalid_format",
      reason: "One or more RUNPOD_* environment variables have an invalid format. Check RUNPOD_API_BASE_URL / RUNPOD_GRAPHQL_URL are valid URLs and numeric overrides are positive integers.",
    };
  }

  const env = parsedEnv.data;
  const rawKey = env.RUNPOD_API_KEY?.trim();

  if (!rawKey) {
    return { status: "not_configured" };
  }

  const keyResult = apiKeyShape.safeParse(rawKey);
  if (!keyResult.success) {
    return {
      status: "invalid_format",
      reason: keyResult.error.issues[0]?.message ?? "RUNPOD_API_KEY has an invalid format.",
    };
  }

  return {
    status: "configured",
    apiKey: keyResult.data,
    restBaseUrl: env.RUNPOD_API_BASE_URL ?? DEFAULT_REST_BASE_URL,
    graphqlUrl: env.RUNPOD_GRAPHQL_URL ?? DEFAULT_GRAPHQL_URL,
    maxListItems: env.RUNPOD_MAX_LIST_ITEMS ?? DEFAULT_MAX_LIST_ITEMS,
    requestTimeoutMs: env.RUNPOD_REQUEST_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS,
  };
}

/**
 * Resolve Runpod configuration from the environment on every call. Deliberately
 * not memoized across requests so a restarted process (after editing
 * .env.local) always reflects the latest values, and so no credential is ever
 * cached in a way that could outlive process env changes.
 */
export function getRunpodConfig(): RunpodConfigState {
  return readEnv();
}

export const RUNPOD_REQUIRED_ENV_VARS = ["RUNPOD_API_KEY"] as const;
export const RUNPOD_OPTIONAL_ENV_VARS = [
  "RUNPOD_API_BASE_URL",
  "RUNPOD_GRAPHQL_URL",
  "RUNPOD_MAX_LIST_ITEMS",
  "RUNPOD_REQUEST_TIMEOUT_MS",
] as const;
