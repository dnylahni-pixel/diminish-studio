/**
 * Serializable domain/view types shared between the server integration layer
 * and the UI. These are stable, hand-written shapes — raw Runpod API
 * payloads are mapped into these types at the transport boundary
 * (server/queries.ts, server/mutations.ts) and never leaked further.
 */

export type RunpodErrorCategory =
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "validation"
  | "rate_limited"
  | "upstream_unavailable"
  | "unexpected";

export interface NormalizedRunpodError {
  category: RunpodErrorCategory;
  message: string;
  httpStatus?: number;
  vendorRequestId?: string;
  retryAfterSeconds?: number;
}

export type ConnectionStatus =
  | { state: "not_configured"; requiredEnvVars: readonly string[] }
  | { state: "invalid_format"; reason: string }
  | { state: "unauthorized"; message: string }
  | { state: "upstream_unavailable"; message: string }
  | {
      state: "connected";
      account: AccountIdentity;
    };

export interface AccountIdentity {
  userId: string | null;
  maskedEmail: string | null;
  clientBalance: number | null;
  spendLimit: number | null;
  currentSpendPerHr: number | null;
  machineQuota: number | null;
  maxServerlessConcurrency: number | null;
  creditAlertThreshold: number | null;
}

export type PodDesiredStatus = "RUNNING" | "EXITED" | "TERMINATED";

export interface PodSummary {
  id: string;
  name: string | null;
  desiredStatus: PodDesiredStatus | null;
  computeType: "GPU" | "CPU" | null;
  gpuTypeId: string | null;
  gpuDisplayName: string | null;
  gpuCount: number | null;
  cpuFlavorId: string | null;
  imageName: string | null;
  costPerHr: number | null;
  adjustedCostPerHr: number | null;
  dataCenterId: string | null;
  createdAt: string | null;
  lastStatusChange: string | null;
  endpointId: string | null;
  networkVolumeId: string | null;
}

export interface PodDetail extends PodSummary {
  containerDiskInGb: number | null;
  volumeInGb: number | null;
  volumeMountPath: string | null;
  vcpuCount: number | null;
  memoryInGb: number | null;
  ports: string | null;
  env: Record<string, string>;
  templateId: string | null;
  containerRegistryAuthId: string | null;
  uptimeSeconds: number | null;
  machine: {
    dataCenterId: string | null;
    gpuDisplayName: string | null;
    secureCloud: boolean | null;
  } | null;
}

export type EndpointComputeType = "GPU" | "CPU";
export type EndpointScalerType = "QUEUE_DELAY" | "REQUEST_COUNT";

export interface WorkerStateSummary {
  total: number;
  running: number;
  idle: number;
  initializing: number;
  throttled: number;
  unhealthy: number;
  other: number;
}

export interface EndpointSummary {
  id: string;
  name: string | null;
  computeType: EndpointComputeType | null;
  templateId: string | null;
  workersMin: number | null;
  workersMax: number | null;
  scalerType: EndpointScalerType | null;
  scalerValue: number | null;
  gpuCount: number | null;
  gpuTypeIds: string[];
  createdAt: string | null;
  workerState: WorkerStateSummary;
}

export interface EndpointDetail extends EndpointSummary {
  idleTimeout: number | null;
  executionTimeoutMs: number | null;
  networkVolumeId: string | null;
  networkVolumeIds: string[];
  dataCenterIds: string[];
  env: Record<string, string>;
  version: number | null;
  templateName: string | null;
  workers: PodSummary[];
}

export interface TemplateSummary {
  id: string;
  name: string | null;
  imageName: string | null;
  category: string | null;
  isPublic: boolean | null;
  isServerless: boolean | null;
  isRunpod: boolean | null;
  containerDiskInGb: number | null;
  volumeInGb: number | null;
}

export interface TemplateDetail extends TemplateSummary {
  dockerEntrypoint: string[];
  dockerStartCmd: string[];
  env: Record<string, string>;
  ports: string | null;
  readme: string | null;
  volumeMountPath: string | null;
  containerRegistryAuthId: string | null;
}

export interface NetworkVolumeSummary {
  id: string;
  name: string | null;
  size: number | null;
  dataCenterId: string | null;
}

export type NetworkVolumeDetail = NetworkVolumeSummary;

export interface ContainerRegistryAuthSummary {
  id: string;
  name: string | null;
}

export interface BillingRecordView {
  time: string | null;
  amount: number | null;
  timeBilledMs: number | null;
  podId: string | null;
  endpointId: string | null;
  gpuTypeId: string | null;
  diskSpaceBilledGb: number | null;
}

export interface NetworkVolumeBillingRecordView {
  time: string | null;
  amount: number | null;
  diskSpaceBilledGb: number | null;
  highPerformanceStorageAmount: number | null;
  highPerformanceStorageDiskSpaceBilledGb: number | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  truncated: boolean;
}

export type AuditActionStatus = "succeeded" | "failed";

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string | null;
  status: AuditActionStatus;
  durationMs: number;
  vendorRequestId: string | null;
  errorCategory: RunpodErrorCategory | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface DataCenterOption {
  id: string;
  label: string;
}

// ---------------------------------------------------------------------------
// Endpoint inference jobs (v2 Inference API)
// ---------------------------------------------------------------------------

export type EndpointJobStatus = "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

/**
 * Result returned by POST /v2/{endpoint_id}/runsync (synchronous inference).
 */
export interface EndpointSyncRunResult {
  id: string;
  status: EndpointJobStatus;
  output: unknown;
  delayTime: number;
  executionTime: number;
  error?: string;
}
