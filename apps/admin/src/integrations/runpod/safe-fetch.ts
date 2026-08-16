import { RunpodApiError } from "./server/errors";

export type FetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { message: string; category: string } };

/**
 * Wraps a Runpod data-fetching call so pages can render a friendly error
 * instead of crashing on timeout, network failure, or authorization errors.
 */
export async function safeFetch<T>(fn: () => Promise<T>): Promise<FetchResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    if (err instanceof RunpodApiError) {
      return { ok: false, error: { message: err.message, category: err.category } };
    }
    return {
      ok: false,
      error: {
        message: err instanceof Error ? err.message : "An unexpected error occurred.",
        category: "unexpected",
      },
    };
  }
}
