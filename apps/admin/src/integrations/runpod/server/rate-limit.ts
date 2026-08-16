import "server-only";

/**
 * Bounded retry/backoff for idempotent (GET) Runpod requests only. Runpod's
 * documentation does not publish a specific rate-limit budget or retry
 * contract (see docs/assumptions-and-limitations.md), so this module adopts a
 * conservative, documented default rather than inventing vendor behavior:
 * retry only 429/5xx responses, only for safe methods, at most 3 attempts,
 * honoring `Retry-After` when present, with exponential backoff + jitter
 * otherwise.
 */
export interface RetryDecision {
  shouldRetry: boolean;
  delayMs: number;
}

export function decideRetry(params: {
  method: string;
  attempt: number;
  maxAttempts: number;
  status?: number;
  retryAfterSeconds?: number;
}): RetryDecision {
  const isSafeMethod = params.method === "GET";
  const isRetryableStatus = params.status === 429 || (params.status !== undefined && params.status >= 500);

  if (!isSafeMethod || !isRetryableStatus || params.attempt >= params.maxAttempts) {
    return { shouldRetry: false, delayMs: 0 };
  }

  if (params.retryAfterSeconds !== undefined) {
    return { shouldRetry: true, delayMs: Math.min(params.retryAfterSeconds * 1000, 10_000) };
  }

  const base = 250 * 2 ** (params.attempt - 1);
  const jitter = Math.random() * 100;
  return { shouldRetry: true, delayMs: Math.min(base + jitter, 4_000) };
}

export function parseRetryAfter(headerValue: string | null): number | undefined {
  if (!headerValue) return undefined;
  const seconds = Number(headerValue);
  if (!Number.isNaN(seconds)) return seconds;
  const date = new Date(headerValue);
  if (!Number.isNaN(date.getTime())) {
    return Math.max(0, Math.round((date.getTime() - Date.now()) / 1000));
  }
  return undefined;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
