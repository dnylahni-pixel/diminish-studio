import "server-only";
import type { ZodType } from "zod";
import { getRunpodTransportConfig, requireRunpodAuthHeader } from "./auth";
import { buildNormalizedError, networkFailureError, RunpodApiError } from "./errors";
import { decideRetry, parseRetryAfter, sleep } from "./rate-limit";
import { vendorMyselfSchema, vendorUnauthorizedErrorSchema } from "../schemas";

/**
 * Single service transport boundary for the Runpod REST v1 API
 * (https://rest.runpod.io/v1, see docs/official-sources.md row 3) plus one
 * minimal GraphQL call used only for identity verification (row 1/5). No
 * other file in this module is permitted to call `fetch` against Runpod
 * directly — this keeps auth headers, timeouts, retries, error mapping, and
 * redaction in exactly one place.
 */

const MAX_RETRY_ATTEMPTS = 3;

export interface RunpodRequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  query?: Record<string, string | number | boolean | string[] | undefined>;
  body?: unknown;
}

function buildUrl(baseUrl: string, path: string, query?: RunpodRequestOptions["query"]): string {
  const url = new URL(`${baseUrl}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const item of value) url.searchParams.append(key, String(item));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

async function performFetch(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw networkFailureError("timeout");
    }
    throw networkFailureError("network");
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Perform a single REST v1 call, returning parsed+validated JSON. Only GET
 * requests are retried, and only on 429/5xx, per docs/security-model.md and
 * server/rate-limit.ts.
 */
export async function runpodRestRequest<T>(
  options: RunpodRequestOptions,
  schema: ZodType<T>
): Promise<T> {
  const authHeader = requireRunpodAuthHeader();
  const config = getRunpodTransportConfig();
  if (!config) {
    // requireRunpodAuthHeader() above always throws before this point when
    // configuration is missing/invalid; this branch is unreachable but kept
    // for type narrowing.
    throw new RunpodApiError({ category: "unauthenticated", message: "Runpod is not configured." });
  }
  const method = options.method ?? "GET";
  const url = buildUrl(config.restBaseUrl, options.path, options.query);

  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    attempt += 1;
    const startedAt = Date.now();
    const response = await performFetch(
      url,
      {
        method,
        headers: {
          ...authHeader,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      },
      config.requestTimeoutMs
    );
    const durationMs = Date.now() - startedAt;
    // Structured, redacted request log — never logs headers or bodies.
    console.info(`[runpod] ${method} ${options.path} -> ${response.status} (${durationMs}ms)`);

    if (response.ok) {
      if (response.status === 204) {
        return schema.parse(undefined as never);
      }
      const json = await response.json().catch(() => undefined);
      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        throw new RunpodApiError({
          category: "unexpected",
          message: "Runpod returned a response that did not match the documented schema.",
        });
      }
      return parsed.data;
    }

    const retryAfterSeconds = parseRetryAfter(response.headers.get("retry-after"));
    const vendorRequestId = response.headers.get("x-request-id") ?? undefined;
    const errorJson = await response.json().catch(() => undefined);
    const parsedError = vendorUnauthorizedErrorSchema.safeParse(errorJson);
    const vendorMessage = parsedError.success ? parsedError.data.message : undefined;

    const retryDecision = decideRetry({
      method,
      attempt,
      maxAttempts: MAX_RETRY_ATTEMPTS,
      status: response.status,
      retryAfterSeconds,
    });

    if (retryDecision.shouldRetry) {
      await sleep(retryDecision.delayMs);
      continue;
    }

    throw new RunpodApiError(
      buildNormalizedError({
        status: response.status,
        vendorMessage,
        vendorRequestId,
        retryAfterSeconds,
      })
    );
  }
}

/**
 * Minimal GraphQL identity call. Used exclusively to verify the configured
 * API key resolves to a real account before any REST calls are attempted.
 * Source: https://graphql-spec.runpod.io/#introduction (`myself` query).
 */
export async function runpodGraphqlMyself() {
  const authHeader = requireRunpodAuthHeader();
  const config = getRunpodTransportConfig();
  if (!config) {
    throw new RunpodApiError({ category: "unauthenticated", message: "Runpod is not configured." });
  }

  const query = `query myself {
    myself {
      id
      email
      clientBalance
      spendLimit
      currentSpendPerHr
      machineQuota
      maxServerlessConcurrency
      creditAlertThreshold
    }
  }`;

  const response = await performFetch(
    config.graphqlUrl,
    {
      method: "POST",
      headers: {
        ...authHeader,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({ query }),
    },
    config.requestTimeoutMs
  );

  if (!response.ok) {
    throw new RunpodApiError(buildNormalizedError({ status: response.status }));
  }

  const json = (await response.json().catch(() => undefined)) as
    | { data?: { myself?: unknown }; errors?: { message: string }[] }
    | undefined;

  if (json?.errors?.length) {
    const message = json.errors[0]?.message ?? "Runpod GraphQL returned an error.";
    const isAuthError = /auth|unauthoriz|forbidden/i.test(message);
    throw new RunpodApiError({
      category: isAuthError ? "unauthenticated" : "unexpected",
      message: isAuthError
        ? "Runpod rejected the configured API key."
        : "Runpod GraphQL returned an unexpected error.",
    });
  }

  const parsed = vendorMyselfSchema.safeParse(json?.data?.myself);
  if (!parsed.success) {
    throw new RunpodApiError({
      category: "unexpected",
      message: "Runpod returned an identity response that did not match the documented schema.",
    });
  }

  return parsed.data;
}
