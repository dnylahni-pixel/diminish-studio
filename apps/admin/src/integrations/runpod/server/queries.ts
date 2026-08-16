import "server-only";
import { getRunpodConfig, RUNPOD_REQUIRED_ENV_VARS } from "../config";
import { runpodGraphqlMyself, runpodRestRequest } from "./client";
import { RunpodApiError } from "./errors";
import { paginateInMemory } from "./pagination";
import { assertPermission, type RunpodPolicyContext } from "./policy";
import { listAuditLog as listAuditLogRows } from "./audit";
import {
  vendorPodSchema,
  vendorPodListSchema,
  vendorEndpointSchema,
  vendorEndpointListSchema,
  vendorTemplateSchema,
  vendorTemplateListSchema,
  vendorNetworkVolumeSchema,
  vendorNetworkVolumeListSchema,
  vendorContainerRegistryAuthListSchema,
  vendorBillingRecordListSchema,
  vendorNetworkVolumeBillingRecordListSchema,
} from "../schemas";
import type {
  AccountIdentity,
  AuditLogEntry,
  BillingRecordView,
  ConnectionStatus,
  ContainerRegistryAuthSummary,
  EndpointDetail,
  EndpointSummary,
  NetworkVolumeDetail,
  NetworkVolumeSummary,
  NetworkVolumeBillingRecordView,
  PaginatedResult,
  PodDetail,
  PodSummary,
  TemplateDetail,
  TemplateSummary,
  WorkerStateSummary,
} from "../types";
import { formatMaskedEmail } from "../formatters";
import type { VendorPod, VendorEndpoint, VendorTemplate, VendorNetworkVolume } from "../schemas";

// ---------------------------------------------------------------------------
// Connection status
// ---------------------------------------------------------------------------

export async function getConnectionStatus(): Promise<ConnectionStatus> {
  const config = getRunpodConfig();
  if (config.status === "not_configured") {
    return { state: "not_configured", requiredEnvVars: RUNPOD_REQUIRED_ENV_VARS };
  }
  if (config.status === "invalid_format") {
    return { state: "invalid_format", reason: config.reason };
  }

  // Try GraphQL identity first (gives richest account info).
  // If that fails (e.g. restricted key, GraphQL endpoint changes), fall back
  // to a lightweight REST health probe so the module still works for users
  // whose API key cannot access the GraphQL endpoint.
  try {
    const account = await getAccountIdentity();
    return { state: "connected", account };
  } catch {
    // GraphQL failed — probe via REST as fallback
    try {
      await runpodRestRequest(
        { path: "/pods", query: { includeMachine: true } },
        vendorPodListSchema
      );
      return {
        state: "connected",
        account: {
          userId: null,
          maskedEmail: null,
          clientBalance: null,
          spendLimit: null,
          currentSpendPerHr: null,
          machineQuota: null,
          maxServerlessConcurrency: null,
          creditAlertThreshold: null,
        },
      };
    } catch (restError) {
      if (restError instanceof RunpodApiError) {
        if (restError.category === "unauthenticated" || restError.category === "forbidden") {
          return { state: "unauthorized", message: restError.message };
        }
        return { state: "upstream_unavailable", message: restError.message };
      }
      return { state: "upstream_unavailable", message: "An unexpected error occurred while verifying the Runpod connection." };
    }
  }
}

export async function getAccountIdentity(): Promise<AccountIdentity> {
  const myself = await runpodGraphqlMyself();
  return {
    userId: myself.id,
    maskedEmail: formatMaskedEmail(myself.email ?? undefined),
    clientBalance: myself.clientBalance ?? null,
    spendLimit: myself.spendLimit ?? null,
    currentSpendPerHr: myself.currentSpendPerHr ?? null,
    machineQuota: myself.machineQuota ?? null,
    maxServerlessConcurrency: myself.maxServerlessConcurrency ?? null,
    creditAlertThreshold: myself.creditAlertThreshold ?? null,
  };
}

// ---------------------------------------------------------------------------
// View-model mappers
// ---------------------------------------------------------------------------

function toPodSummary(pod: VendorPod): PodSummary {
  return {
    id: pod.id,
    name: pod.name ?? null,
    desiredStatus: pod.desiredStatus ?? null,
    computeType: pod.cpuFlavorId ? "CPU" : pod.gpu ? "GPU" : null,
    gpuTypeId: pod.gpu?.id ?? null,
    gpuDisplayName: pod.gpu?.displayName ?? pod.machine?.gpuDisplayName ?? null,
    gpuCount: pod.gpu?.count ?? null,
    cpuFlavorId: pod.cpuFlavorId ?? null,
    imageName: pod.imageName ?? null,
    costPerHr: pod.costPerHr ?? null,
    adjustedCostPerHr: pod.adjustedCostPerHr ?? null,
    dataCenterId: pod.machine?.dataCenterId ?? null,
    createdAt: pod.createdAt ?? null,
    lastStatusChange: pod.lastStatusChange ?? null,
    endpointId: pod.endpointId ?? null,
    networkVolumeId: pod.networkVolumeId ?? null,
  };
}

function toPodDetail(pod: VendorPod): PodDetail {
  return {
    ...toPodSummary(pod),
    containerDiskInGb: pod.containerDiskInGb ?? null,
    volumeInGb: pod.volumeInGb ?? null,
    volumeMountPath: pod.volumeMountPath ?? null,
    vcpuCount: pod.vcpuCount ?? null,
    memoryInGb: pod.memoryInGb ?? null,
    ports: pod.ports ?? null,
    env: pod.env ?? {},
    templateId: pod.templateId ?? null,
    containerRegistryAuthId: pod.containerRegistryAuthId ?? null,
    uptimeSeconds: pod.runtime?.uptimeInSeconds ?? null,
    machine: pod.machine
      ? {
          dataCenterId: pod.machine.dataCenterId ?? null,
          gpuDisplayName: pod.machine.gpuDisplayName ?? null,
          secureCloud: pod.machine.secureCloud ?? null,
        }
      : null,
  };
}

function summarizeWorkerState(workers: VendorPod[] | null | undefined): WorkerStateSummary {
  const summary: WorkerStateSummary = { total: 0, running: 0, idle: 0, initializing: 0, throttled: 0, unhealthy: 0, other: 0 };
  for (const worker of workers ?? []) {
    summary.total += 1;
    switch (worker.desiredStatus) {
      case "RUNNING":
        summary.running += 1;
        break;
      case "EXITED":
        summary.idle += 1;
        break;
      case "TERMINATED":
        summary.other += 1;
        break;
      default:
        summary.initializing += 1;
    }
  }
  return summary;
}

function toEndpointSummary(endpoint: VendorEndpoint): EndpointSummary {
  return {
    id: endpoint.id,
    name: endpoint.name ?? null,
    computeType: endpoint.computeType ?? null,
    templateId: endpoint.templateId ?? null,
    workersMin: endpoint.workersMin ?? null,
    workersMax: endpoint.workersMax ?? null,
    scalerType: endpoint.scalerType ?? null,
    scalerValue: endpoint.scalerValue ?? null,
    gpuCount: endpoint.gpuCount ?? null,
    gpuTypeIds: endpoint.gpuTypeIds ?? [],
    createdAt: endpoint.createdAt ?? null,
    workerState: summarizeWorkerState(endpoint.workers),
  };
}

function toEndpointDetail(endpoint: VendorEndpoint): EndpointDetail {
  return {
    ...toEndpointSummary(endpoint),
    idleTimeout: endpoint.idleTimeout ?? null,
    executionTimeoutMs: endpoint.executionTimeoutMs ?? null,
    networkVolumeId: endpoint.networkVolumeId ?? null,
    networkVolumeIds: endpoint.networkVolumeIds ?? [],
    dataCenterIds: endpoint.dataCenterIds ?? [],
    env: endpoint.env ?? {},
    version: endpoint.version ?? null,
    templateName: endpoint.template?.name ?? null,
    workers: (endpoint.workers ?? []).map(toPodSummary),
  };
}

function toTemplateSummary(template: VendorTemplate): TemplateSummary {
  return {
    id: template.id,
    name: template.name ?? null,
    imageName: template.imageName ?? null,
    category: template.category ?? null,
    isPublic: template.isPublic ?? null,
    isServerless: template.isServerless ?? null,
    isRunpod: template.isRunpod ?? null,
    containerDiskInGb: template.containerDiskInGb ?? null,
    volumeInGb: template.volumeInGb ?? null,
  };
}

function toTemplateDetail(template: VendorTemplate): TemplateDetail {
  return {
    ...toTemplateSummary(template),
    dockerEntrypoint: template.dockerEntrypoint ?? [],
    dockerStartCmd: template.dockerStartCmd ?? [],
    env: template.env ?? {},
    ports: template.ports ?? null,
    readme: template.readme ?? null,
    volumeMountPath: template.volumeMountPath ?? null,
    containerRegistryAuthId: template.containerRegistryAuthId ?? null,
  };
}

function toNetworkVolumeSummary(volume: VendorNetworkVolume): NetworkVolumeSummary {
  return {
    id: volume.id,
    name: volume.name ?? null,
    size: volume.size ?? null,
    dataCenterId: volume.dataCenterId ?? null,
  };
}

// ---------------------------------------------------------------------------
// Pods
// ---------------------------------------------------------------------------

export interface PodListFilters {
  page: number;
  pageSize: number;
  search?: string;
  desiredStatus?: "RUNNING" | "EXITED" | "TERMINATED";
  computeType?: "GPU" | "CPU";
}

export async function listPods(context: RunpodPolicyContext, filters: PodListFilters): Promise<PaginatedResult<PodSummary>> {
  assertPermission(context, "integration.read");
  const config = getRunpodConfig();
  const maxItems = config.status === "configured" ? config.maxListItems : 500;

  const vendorPods = await runpodRestRequest(
    {
      path: "/pods",
      query: {
        desiredStatus: filters.desiredStatus,
        computeType: filters.computeType,
        includeMachine: true,
      },
    },
    vendorPodListSchema
  );

  let summaries = vendorPods.map(toPodSummary);
  if (filters.search) {
    const needle = filters.search.toLowerCase();
    summaries = summaries.filter(
      (pod) =>
        pod.id.toLowerCase().includes(needle) ||
        (pod.name ?? "").toLowerCase().includes(needle) ||
        (pod.imageName ?? "").toLowerCase().includes(needle)
    );
  }

  return paginateInMemory(summaries, { page: filters.page, pageSize: filters.pageSize, maxItems });
}

export async function getPod(context: RunpodPolicyContext, podId: string): Promise<PodDetail> {
  assertPermission(context, "integration.read");
  const vendorPod = await runpodRestRequest(
    { path: `/pods/${encodeURIComponent(podId)}`, query: { includeMachine: true, includeTemplate: true, includeNetworkVolume: true } },
    vendorPodSchema
  );
  return toPodDetail(vendorPod);
}

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------

export interface EndpointListFilters {
  page: number;
  pageSize: number;
  search?: string;
}

export async function listEndpoints(context: RunpodPolicyContext, filters: EndpointListFilters): Promise<PaginatedResult<EndpointSummary>> {
  assertPermission(context, "integration.read");
  const config = getRunpodConfig();
  const maxItems = config.status === "configured" ? config.maxListItems : 500;

  const vendorEndpoints = await runpodRestRequest(
    { path: "/endpoints", query: { includeWorkers: true, includeTemplate: true } },
    vendorEndpointListSchema
  );

  let summaries = vendorEndpoints.map(toEndpointSummary);
  if (filters.search) {
    const needle = filters.search.toLowerCase();
    summaries = summaries.filter((endpoint) => endpoint.id.toLowerCase().includes(needle) || (endpoint.name ?? "").toLowerCase().includes(needle));
  }

  return paginateInMemory(summaries, { page: filters.page, pageSize: filters.pageSize, maxItems });
}

export async function getEndpoint(context: RunpodPolicyContext, endpointId: string): Promise<EndpointDetail> {
  assertPermission(context, "integration.read");
  const vendorEndpoint = await runpodRestRequest(
    { path: `/endpoints/${encodeURIComponent(endpointId)}`, query: { includeWorkers: true, includeTemplate: true } },
    vendorEndpointSchema
  );
  return toEndpointDetail(vendorEndpoint);
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export interface TemplateListFilters {
  page: number;
  pageSize: number;
  search?: string;
}

export async function listTemplates(context: RunpodPolicyContext, filters: TemplateListFilters): Promise<PaginatedResult<TemplateSummary>> {
  assertPermission(context, "integration.read");
  const config = getRunpodConfig();
  const maxItems = config.status === "configured" ? config.maxListItems : 500;

  const vendorTemplates = await runpodRestRequest({ path: "/templates" }, vendorTemplateListSchema);

  let summaries = vendorTemplates.map(toTemplateSummary);
  if (filters.search) {
    const needle = filters.search.toLowerCase();
    summaries = summaries.filter((template) => template.id.toLowerCase().includes(needle) || (template.name ?? "").toLowerCase().includes(needle));
  }

  return paginateInMemory(summaries, { page: filters.page, pageSize: filters.pageSize, maxItems });
}

export async function getTemplate(context: RunpodPolicyContext, templateId: string): Promise<TemplateDetail> {
  assertPermission(context, "integration.read");
  const vendorTemplate = await runpodRestRequest({ path: `/templates/${encodeURIComponent(templateId)}` }, vendorTemplateSchema);
  return toTemplateDetail(vendorTemplate);
}

// ---------------------------------------------------------------------------
// Network volumes
// ---------------------------------------------------------------------------

export interface NetworkVolumeListFilters {
  page: number;
  pageSize: number;
  search?: string;
}

export async function listNetworkVolumes(
  context: RunpodPolicyContext,
  filters: NetworkVolumeListFilters
): Promise<PaginatedResult<NetworkVolumeSummary>> {
  assertPermission(context, "integration.read");
  const config = getRunpodConfig();
  const maxItems = config.status === "configured" ? config.maxListItems : 500;

  const vendorVolumes = await runpodRestRequest({ path: "/networkvolumes" }, vendorNetworkVolumeListSchema);

  let summaries = vendorVolumes.map(toNetworkVolumeSummary);
  if (filters.search) {
    const needle = filters.search.toLowerCase();
    summaries = summaries.filter((volume) => volume.id.toLowerCase().includes(needle) || (volume.name ?? "").toLowerCase().includes(needle));
  }

  return paginateInMemory(summaries, { page: filters.page, pageSize: filters.pageSize, maxItems });
}

export async function getNetworkVolume(context: RunpodPolicyContext, networkVolumeId: string): Promise<NetworkVolumeDetail> {
  assertPermission(context, "integration.read");
  const vendorVolume = await runpodRestRequest({ path: `/networkvolumes/${encodeURIComponent(networkVolumeId)}` }, vendorNetworkVolumeSchema);
  return toNetworkVolumeSummary(vendorVolume);
}

// ---------------------------------------------------------------------------
// Container registry auths
// ---------------------------------------------------------------------------

export async function listContainerRegistryAuths(context: RunpodPolicyContext): Promise<ContainerRegistryAuthSummary[]> {
  assertPermission(context, "integration.read");
  const vendorAuths = await runpodRestRequest({ path: "/containerregistryauth" }, vendorContainerRegistryAuthListSchema);
  return vendorAuths.map((auth) => ({ id: auth.id, name: auth.name ?? null }));
}

// ---------------------------------------------------------------------------
// Billing reports
// ---------------------------------------------------------------------------

export interface BillingQuery {
  startTime?: string;
  endTime?: string;
  bucketSize?: string;
  gpuTypeId?: string;
  podId?: string;
  endpointId?: string;
}

export async function getPodBillingReport(context: RunpodPolicyContext, query: BillingQuery): Promise<BillingRecordView[]> {
  assertPermission(context, "integration.billing.read");
  const records = await runpodRestRequest(
    { path: "/billing/pods", query: { startTime: query.startTime, endTime: query.endTime, bucketSize: query.bucketSize, gpuTypeId: query.gpuTypeId, podId: query.podId } },
    vendorBillingRecordListSchema
  );
  return records.map((record) => ({
    time: record.time ?? null,
    amount: record.amount ?? null,
    timeBilledMs: record.timeBilledMs ?? null,
    podId: record.podId ?? null,
    endpointId: record.endpointId ?? null,
    gpuTypeId: record.gpuTypeId ?? null,
    diskSpaceBilledGb: record.diskSpaceBilledGb ?? null,
  }));
}

export async function getEndpointBillingReport(context: RunpodPolicyContext, query: BillingQuery): Promise<BillingRecordView[]> {
  assertPermission(context, "integration.billing.read");
  const records = await runpodRestRequest(
    { path: "/billing/endpoints", query: { startTime: query.startTime, endTime: query.endTime, bucketSize: query.bucketSize, gpuTypeId: query.gpuTypeId, endpointId: query.endpointId } },
    vendorBillingRecordListSchema
  );
  return records.map((record) => ({
    time: record.time ?? null,
    amount: record.amount ?? null,
    timeBilledMs: record.timeBilledMs ?? null,
    podId: record.podId ?? null,
    endpointId: record.endpointId ?? null,
    gpuTypeId: record.gpuTypeId ?? null,
    diskSpaceBilledGb: record.diskSpaceBilledGb ?? null,
  }));
}

export async function getNetworkVolumeBillingReport(
  context: RunpodPolicyContext,
  query: BillingQuery
): Promise<NetworkVolumeBillingRecordView[]> {
  assertPermission(context, "integration.billing.read");
  const records = await runpodRestRequest(
    { path: "/billing/networkvolumes", query: { startTime: query.startTime, endTime: query.endTime, bucketSize: query.bucketSize } },
    vendorNetworkVolumeBillingRecordListSchema
  );
  return records.map((record) => ({
    time: record.time ?? null,
    amount: record.amount ?? null,
    diskSpaceBilledGb: record.diskSpaceBilledGb ?? null,
    highPerformanceStorageAmount: record.highPerformanceStorageAmount ?? null,
    highPerformanceStorageDiskSpaceBilledGb: record.highPerformanceStorageDiskSpaceBilledGb ?? null,
  }));
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

export async function listAuditLog(context: RunpodPolicyContext, page: number, pageSize: number): Promise<PaginatedResult<AuditLogEntry>> {
  assertPermission(context, "integration.audit.read");
  return listAuditLogRows(page, pageSize);
}
