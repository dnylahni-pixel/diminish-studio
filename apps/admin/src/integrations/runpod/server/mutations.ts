"use server";

import { revalidatePath } from "next/cache";
import { RUNPOD_ROUTE_PREFIX } from "../contract";
import { runpodRestRequest } from "./client";
import { RunpodApiError } from "./errors";
import { assertPermission } from "./policy";
import { resolveRunpodPolicyContext } from "./identity-adapter";
import { withAudit } from "./audit";
import {
  createPodInputSchema,
  updatePodInputSchema,
  podIdSchema,
  createEndpointInputSchema,
  updateEndpointInputSchema,
  endpointIdSchema,
  createTemplateInputSchema,
  updateTemplateInputSchema,
  templateIdSchema,
  createNetworkVolumeInputSchema,
  updateNetworkVolumeInputSchema,
  networkVolumeIdSchema,
  createContainerRegistryAuthInputSchema,
  containerRegistryAuthIdSchema,
  vendorPodSchema,
  vendorEndpointSchema,
  vendorTemplateSchema,
  vendorNetworkVolumeSchema,
  vendorContainerRegistryAuthSchema,
} from "../schemas";
import type { NormalizedRunpodError, EndpointSyncRunResult } from "../types";
import { endpointRunSync } from "./inference-client";
import { z } from "zod";

export type ActionResult<T = undefined> = { ok: true; data: T } | { ok: false; error: NormalizedRunpodError };

function toActionResult<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  return fn()
    .then((data) => ({ ok: true as const, data }))
    .catch((error) => {
      if (error instanceof RunpodApiError) {
        return { ok: false as const, error: error.toNormalized() };
      }
      return {
        ok: false as const,
        error: { category: "unexpected" as const, message: "An unexpected error occurred." },
      };
    });
}

function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new RunpodApiError({
      category: "validation",
      message: result.error.issues[0]?.message ?? "Invalid input.",
    });
  }
  return result.data;
}

function revalidateRunpod(path: string) {
  revalidatePath(`${RUNPOD_ROUTE_PREFIX}${path}`);
}

// ---------------------------------------------------------------------------
// Pods
// ---------------------------------------------------------------------------

export async function createPodAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const parsed = parseOrThrow(createPodInputSchema, input);
    const context = await resolveRunpodPolicyContext();
    assertPermission(context, "integration.mutate");

    const pod = await withAudit(
      { context, action: "pod.create", targetType: "pod", targetId: null },
      { imageName: parsed.imageName, computeType: parsed.computeType },
      () => runpodRestRequest({ method: "POST", path: "/pods", body: parsed }, vendorPodSchema)
    );
    revalidateRunpod("/pods");
    return { id: pod.id };
  });
}

export async function updatePodAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const parsed = parseOrThrow(updatePodInputSchema, input);
    const context = await resolveRunpodPolicyContext();
    assertPermission(context, "integration.mutate");

    const { podId, ...body } = parsed;
    const pod = await withAudit(
      { context, action: "pod.update", targetType: "pod", targetId: podId },
      undefined,
      () => runpodRestRequest({ method: "PATCH", path: `/pods/${encodeURIComponent(podId)}`, body }, vendorPodSchema)
    );
    revalidateRunpod("/pods");
    revalidateRunpod(`/pods/${podId}`);
    return { id: pod.id };
  });
}

async function podLifecycleAction(input: unknown, action: "start" | "stop" | "restart" | "reset"): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const { podId } = parseOrThrow(podIdSchema, input);
    const context = await resolveRunpodPolicyContext();
    assertPermission(context, "integration.mutate");

    const pod = await withAudit(
      { context, action: `pod.${action}`, targetType: "pod", targetId: podId },
      undefined,
      () => runpodRestRequest({ method: "POST", path: `/pods/${encodeURIComponent(podId)}/${action}` }, vendorPodSchema)
    );
    revalidateRunpod("/pods");
    revalidateRunpod(`/pods/${podId}`);
    return { id: pod.id };
  });
}

export async function startPodAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return podLifecycleAction(input, "start");
}
export async function stopPodAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return podLifecycleAction(input, "stop");
}
export async function restartPodAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return podLifecycleAction(input, "restart");
}
export async function resetPodAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return podLifecycleAction(input, "reset");
}

export async function deletePodAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const { podId } = parseOrThrow(podIdSchema, input);
    const context = await resolveRunpodPolicyContext();
    assertPermission(context, "integration.delete");

    await withAudit(
      { context, action: "pod.delete", targetType: "pod", targetId: podId },
      undefined,
      () => runpodRestRequest({ method: "DELETE", path: `/pods/${encodeURIComponent(podId)}` }, z.unknown())
    );
    revalidateRunpod("/pods");
    return { id: podId };
  });
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export async function createEndpointAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const parsed = parseOrThrow(createEndpointInputSchema, input);
    const context = await resolveRunpodPolicyContext();
    assertPermission(context, "integration.mutate");

    const endpoint = await withAudit(
      { context, action: "endpoint.create", targetType: "endpoint", targetId: null },
      { templateId: parsed.templateId },
      () => runpodRestRequest({ method: "POST", path: "/endpoints", body: parsed }, vendorEndpointSchema)
    );
    revalidateRunpod("/endpoints");
    return { id: endpoint.id };
  });
}

export async function updateEndpointAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const parsed = parseOrThrow(updateEndpointInputSchema, input);
    const context = await resolveRunpodPolicyContext();
    assertPermission(context, "integration.mutate");

    const { endpointId, ...body } = parsed;
    const endpoint = await withAudit(
      { context, action: "endpoint.update", targetType: "endpoint", targetId: endpointId },
      undefined,
      () => runpodRestRequest({ method: "PATCH", path: `/endpoints/${encodeURIComponent(endpointId)}`, body }, vendorEndpointSchema)
    );
    revalidateRunpod("/endpoints");
    revalidateRunpod(`/endpoints/${endpointId}`);
    return { id: endpoint.id };
  });
}

export async function deleteEndpointAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const { endpointId } = parseOrThrow(endpointIdSchema, input);
    const context = await resolveRunpodPolicyContext();
    assertPermission(context, "integration.delete");

    await withAudit(
      { context, action: "endpoint.delete", targetType: "endpoint", targetId: endpointId },
      undefined,
      () => runpodRestRequest({ method: "DELETE", path: `/endpoints/${encodeURIComponent(endpointId)}` }, z.unknown())
    );
    revalidateRunpod("/endpoints");
    return { id: endpointId };
  });
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function createTemplateAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const parsed = parseOrThrow(createTemplateInputSchema, input);
    const context = await resolveRunpodPolicyContext();
    assertPermission(context, "integration.mutate");

    const template = await withAudit(
      { context, action: "template.create", targetType: "template", targetId: null },
      { name: parsed.name },
      () => runpodRestRequest({ method: "POST", path: "/templates", body: parsed }, vendorTemplateSchema)
    );
    revalidateRunpod("/templates");
    return { id: template.id };
  });
}

export async function updateTemplateAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const parsed = parseOrThrow(updateTemplateInputSchema, input);
    const context = await resolveRunpodPolicyContext();
    assertPermission(context, "integration.mutate");

    const { templateId, ...body } = parsed;
    const template = await withAudit(
      { context, action: "template.update", targetType: "template", targetId: templateId },
      undefined,
      () => runpodRestRequest({ method: "PATCH", path: `/templates/${encodeURIComponent(templateId)}`, body }, vendorTemplateSchema)
    );
    revalidateRunpod("/templates");
    revalidateRunpod(`/templates/${templateId}`);
    return { id: template.id };
  });
}

export async function deleteTemplateAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const { templateId } = parseOrThrow(templateIdSchema, input);
    const context = await resolveRunpodPolicyContext();
    assertPermission(context, "integration.delete");

    await withAudit(
      { context, action: "template.delete", targetType: "template", targetId: templateId },
      undefined,
      () => runpodRestRequest({ method: "DELETE", path: `/templates/${encodeURIComponent(templateId)}` }, z.unknown())
    );
    revalidateRunpod("/templates");
    return { id: templateId };
  });
}

// ---------------------------------------------------------------------------
// Network volumes
// ---------------------------------------------------------------------------

export async function createNetworkVolumeAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const parsed = parseOrThrow(createNetworkVolumeInputSchema, input);
    const context = await resolveRunpodPolicyContext();
    assertPermission(context, "integration.mutate");

    const volume = await withAudit(
      { context, action: "network_volume.create", targetType: "network_volume", targetId: null },
      { name: parsed.name, size: parsed.size },
      () => runpodRestRequest({ method: "POST", path: "/networkvolumes", body: parsed }, vendorNetworkVolumeSchema)
    );
    revalidateRunpod("/network-volumes");
    return { id: volume.id };
  });
}

export async function updateNetworkVolumeAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const parsed = parseOrThrow(updateNetworkVolumeInputSchema, input);
    const context = await resolveRunpodPolicyContext();
    assertPermission(context, "integration.mutate");

    const { networkVolumeId, ...body } = parsed;
    const volume = await withAudit(
      { context, action: "network_volume.update", targetType: "network_volume", targetId: networkVolumeId },
      undefined,
      () => runpodRestRequest({ method: "PATCH", path: `/networkvolumes/${encodeURIComponent(networkVolumeId)}`, body }, vendorNetworkVolumeSchema)
    );
    revalidateRunpod("/network-volumes");
    revalidateRunpod(`/network-volumes/${networkVolumeId}`);
    return { id: volume.id };
  });
}

export async function deleteNetworkVolumeAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const { networkVolumeId } = parseOrThrow(networkVolumeIdSchema, input);
    const context = await resolveRunpodPolicyContext();
    assertPermission(context, "integration.delete");

    await withAudit(
      { context, action: "network_volume.delete", targetType: "network_volume", targetId: networkVolumeId },
      undefined,
      () => runpodRestRequest({ method: "DELETE", path: `/networkvolumes/${encodeURIComponent(networkVolumeId)}` }, z.unknown())
    );
    revalidateRunpod("/network-volumes");
    return { id: networkVolumeId };
  });
}

// ---------------------------------------------------------------------------
// Container registry auths
// ---------------------------------------------------------------------------

export async function createContainerRegistryAuthAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const parsed = parseOrThrow(createContainerRegistryAuthInputSchema, input);
    const context = await resolveRunpodPolicyContext();
    assertPermission(context, "integration.configure");

    const auth = await withAudit(
      { context, action: "registry_auth.create", targetType: "registry_auth", targetId: null },
      { name: parsed.name },
      () => runpodRestRequest({ method: "POST", path: "/containerregistryauth", body: parsed }, vendorContainerRegistryAuthSchema)
    );
    revalidateRunpod("/registry-auths");
    return { id: auth.id };
  });
}

export async function deleteContainerRegistryAuthAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  return toActionResult(async () => {
    const { containerRegistryAuthId } = parseOrThrow(containerRegistryAuthIdSchema, input);
    const context = await resolveRunpodPolicyContext();
    assertPermission(context, "integration.delete");

    await withAudit(
      { context, action: "registry_auth.delete", targetType: "registry_auth", targetId: containerRegistryAuthId },
      undefined,
      () => runpodRestRequest({ method: "DELETE", path: `/containerregistryauth/${encodeURIComponent(containerRegistryAuthId)}` }, z.unknown())
    );
    revalidateRunpod("/registry-auths");
    return { id: containerRegistryAuthId };
  });
}

// ---------------------------------------------------------------------------
// Endpoint inference jobs (v2 Inference API)
// ---------------------------------------------------------------------------

const runEndpointJobInputSchema = z.object({
  endpointId: z.string().trim().min(1),
  inputPayload: z.record(z.string(), z.unknown()),
});

/**
 * Run a synchronous inference job on a serverless endpoint.
 * Calls POST /v2/{endpointId}/runsync and returns the result.
 */
export async function runEndpointJobAction(input: unknown): Promise<ActionResult<EndpointSyncRunResult>> {
  return toActionResult(async () => {
    const { endpointId, inputPayload } = parseOrThrow(runEndpointJobInputSchema, input);
    const context = await resolveRunpodPolicyContext();
    assertPermission(context, "integration.mutate");

    const result = await withAudit(
      { context, action: "endpoint.run_job", targetType: "endpoint", targetId: endpointId },
      { inputPayload },
      () => endpointRunSync(endpointId, inputPayload),
    );

    return result;
  });
}
