import "server-only";
import { requireRunpodAuthHeader } from "./auth";
import { RunpodApiError, networkFailureError, buildNormalizedError } from "./errors";
import type { EndpointSyncRunResult } from "../types";

/**
 * Thin transport for the Runpod v2 Inference API
 * (https://api.runpod.ai/v2). Unlike the REST v1 management client, this
 * endpoint is hit directly from Server Actions so the request body and
 * response are known up-front; no generic schema parameter needed.
 *
 * Currently only wraps the synchronous run endpoint (runsync). Add
 * POST .../run + GET .../status/{id} for an async + poll flow when needed.
 */

const INFERENCE_BASE_URL = "https://api.runpod.ai/v2";
const REQUEST_TIMEOUT_MS = 120_000; // inference can be slow

async function performFetch(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
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
 * POST /v2/{endpointId}/runsync
 *
 * Sends a synchronous inference request and waits for the result.
 * Runpod v2 Inference API reference:
 *   https://docs.runpod.io/serverless/workers/vllm/overview
 */
export async function endpointRunSync(
  endpointId: string,
  input: Record<string, unknown>,
): Promise<EndpointSyncRunResult> {
  const authHeader = requireRunpodAuthHeader();
  const url = `${INFERENCE_BASE_URL}/${encodeURIComponent(endpointId)}/runsync`;

  const response = await performFetch(url, {
    method: "POST",
    headers: {
      ...authHeader,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    throw new RunpodApiError(
      buildNormalizedError({
        status: response.status,
        vendorRequestId: response.headers.get("x-request-id") ?? undefined,
      }),
    );
  }

  const json = await response.json().catch(() => undefined) as Record<string, unknown> | undefined;

  if (!json || typeof json.id !== "string") {
    throw new RunpodApiError({
      category: "unexpected",
      message: "Runpod inference API returned an unexpected response shape.",
    });
  }

  return {
    id: json.id,
    status: (json.status as EndpointSyncRunResult["status"]) ?? "FAILED",
    output: json.output,
    delayTime: (json.delayTime as number) ?? 0,
    executionTime: (json.executionTime as number) ?? 0,
    error: json.error as string | undefined,
  };
}
