import "server-only";
import type { NormalizedRunpodError, RunpodErrorCategory } from "../types";

/**
 * Normalized, throwable error type for every Runpod transport failure. Never
 * carries the Authorization header, the API key, or a raw response body —
 * only the fields needed to render an actionable, redacted message.
 */
export class RunpodApiError extends Error {
  readonly category: RunpodErrorCategory;
  readonly httpStatus?: number;
  readonly vendorRequestId?: string;
  readonly retryAfterSeconds?: number;

  constructor(normalized: NormalizedRunpodError) {
    super(normalized.message);
    this.name = "RunpodApiError";
    this.category = normalized.category;
    this.httpStatus = normalized.httpStatus;
    this.vendorRequestId = normalized.vendorRequestId;
    this.retryAfterSeconds = normalized.retryAfterSeconds;
  }

  toNormalized(): NormalizedRunpodError {
    return {
      category: this.category,
      message: this.message,
      httpStatus: this.httpStatus,
      vendorRequestId: this.vendorRequestId,
      retryAfterSeconds: this.retryAfterSeconds,
    };
  }
}

export function categoryFromStatus(status: number): RunpodErrorCategory {
  if (status === 401) return "unauthenticated";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 409) return "conflict";
  if (status === 422) return "validation";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "upstream_unavailable";
  return "unexpected";
}

function safeMessageForCategory(category: RunpodErrorCategory, vendorMessage?: string): string {
  switch (category) {
    case "unauthenticated":
      return "Runpod rejected the configured API key. Verify RUNPOD_API_KEY in .env.local is current and has not been revoked.";
    case "forbidden":
      return "The configured Runpod API key does not have permission to perform this action. A Restricted or Read Only key cannot perform every operation.";
    case "not_found":
      return "The requested Runpod resource was not found. It may have already been deleted or the id is incorrect.";
    case "conflict":
      return vendorMessage
        ? `Runpod rejected this action due to a conflict: ${truncate(vendorMessage)}`
        : "Runpod rejected this action due to a conflict with the resource's current state.";
    case "validation":
      return vendorMessage
        ? `Runpod rejected the request: ${truncate(vendorMessage)}`
        : "Runpod rejected the request as invalid.";
    case "rate_limited":
      return "Runpod is rate-limiting this account. Please wait and try again.";
    case "upstream_unavailable":
      return "Runpod's API is currently unavailable. Please try again shortly.";
    default:
      return "An unexpected error occurred while communicating with Runpod.";
  }
}

function truncate(value: string, max = 300): string {
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

export function buildNormalizedError(params: {
  status: number;
  vendorMessage?: string;
  vendorRequestId?: string;
  retryAfterSeconds?: number;
}): NormalizedRunpodError {
  const category = categoryFromStatus(params.status);
  return {
    category,
    message: safeMessageForCategory(category, params.vendorMessage),
    httpStatus: params.status,
    vendorRequestId: params.vendorRequestId,
    retryAfterSeconds: params.retryAfterSeconds,
  };
}

export function networkFailureError(reason: "timeout" | "network"): RunpodApiError {
  return new RunpodApiError({
    category: "upstream_unavailable",
    message:
      reason === "timeout"
        ? "The request to Runpod timed out. Please try again."
        : "Could not reach Runpod's API. Please check connectivity and try again.",
  });
}
