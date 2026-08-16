import "server-only";
import { getRunpodConfig } from "../config";
import { RunpodApiError } from "./errors";

/**
 * Server-only credential retrieval. This is the single place in the module
 * allowed to read `RUNPOD_API_KEY`. Every caller receives only the finished
 * `Authorization` header value; the raw key is never returned to a component
 * or logged.
 */
export function requireRunpodAuthHeader(): { Authorization: string } {
  const config = getRunpodConfig();
  if (config.status !== "configured") {
    throw new RunpodApiError({
      category: "unauthenticated",
      message:
        config.status === "not_configured"
          ? "Runpod is not configured. Set RUNPOD_API_KEY in .env.local and restart the application."
          : `Runpod configuration is invalid: ${config.status === "invalid_format" ? config.reason : "unknown error"}`,
    });
  }
  return { Authorization: `Bearer ${config.apiKey}` };
}

export function getRunpodTransportConfig() {
  const config = getRunpodConfig();
  if (config.status !== "configured") {
    return null;
  }
  return config;
}
