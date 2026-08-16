import { z } from "zod";

/**
 * Zod schemas used at trust boundaries:
 *  - `vendor*` schemas parse untrusted Runpod API responses (fields are kept
 *    optional/nullable wherever the OpenAPI contract does not mark them
 *    required, since Runpod's own schema frequently omits fields depending on
 *    `include*` query flags).
 *  - `*Input` schemas validate data coming from the browser (Server Action
 *    arguments) before it is ever sent upstream.
 *
 * Source: https://rest.runpod.io/v1/openapi.json (fetched directly from the
 * vendor during research; see docs/official-sources.md row 3).
 */

// ---------------------------------------------------------------------------
// Vendor response schemas (REST v1)
// ---------------------------------------------------------------------------

export const vendorPodSchema = z
  .object({
    id: z.string(),
    name: z.string().nullish(),
    desiredStatus: z.enum(["RUNNING", "EXITED", "TERMINATED"]).nullish(),
    imageName: z.string().nullish(),
    costPerHr: z.coerce.number().nullish(),
    adjustedCostPerHr: z.coerce.number().nullish(),
    createdAt: z.string().nullish(),
    lastStatusChange: z.string().nullish(),
    endpointId: z.string().nullish(),
    networkVolumeId: z.string().nullish(),
    containerDiskInGb: z.number().nullish(),
    volumeInGb: z.number().nullish(),
    volumeMountPath: z.string().nullish(),
    vcpuCount: z.number().nullish(),
    memoryInGb: z.number().nullish(),
    ports: z.string().nullish(),
    env: z.record(z.string(), z.string()).nullish(),
    templateId: z.string().nullish(),
    containerRegistryAuthId: z.string().nullish(),
    cpuFlavorId: z.string().nullish(),
    gpu: z
      .object({
        id: z.string().nullish(),
        count: z.number().nullish(),
        displayName: z.string().nullish(),
      })
      .nullish(),
    machine: z
      .object({
        dataCenterId: z.string().nullish(),
        gpuDisplayName: z.string().nullish(),
        secureCloud: z.boolean().nullish(),
      })
      .nullish(),
    runtime: z
      .object({
        uptimeInSeconds: z.number().nullish(),
      })
      .nullish(),
  })
  .passthrough();

export type VendorPod = z.infer<typeof vendorPodSchema>;

export const vendorPodListSchema = z.array(vendorPodSchema);

export const vendorEndpointSchema = z
  .object({
    id: z.string(),
    name: z.string().nullish(),
    computeType: z.enum(["GPU", "CPU"]).nullish(),
    templateId: z.string().nullish(),
    workersMin: z.number().nullish(),
    workersMax: z.number().nullish(),
    scalerType: z.enum(["QUEUE_DELAY", "REQUEST_COUNT"]).nullish(),
    scalerValue: z.number().nullish(),
    gpuCount: z.number().nullish(),
    gpuTypeIds: z.array(z.string()).nullish(),
    createdAt: z.string().nullish(),
    idleTimeout: z.number().nullish(),
    executionTimeoutMs: z.number().nullish(),
    networkVolumeId: z.string().nullish(),
    networkVolumeIds: z.array(z.string()).nullish(),
    dataCenterIds: z.array(z.string()).nullish(),
    env: z.record(z.string(), z.string()).nullish(),
    version: z.number().nullish(),
    template: z.object({ name: z.string().nullish() }).nullish(),
    workers: z.array(vendorPodSchema).nullish(),
  })
  .passthrough();

export type VendorEndpoint = z.infer<typeof vendorEndpointSchema>;

export const vendorEndpointListSchema = z.array(vendorEndpointSchema);

export const vendorTemplateSchema = z
  .object({
    id: z.string(),
    name: z.string().nullish(),
    imageName: z.string().nullish(),
    category: z.string().nullish(),
    isPublic: z.boolean().nullish(),
    isServerless: z.boolean().nullish(),
    isRunpod: z.boolean().nullish(),
    containerDiskInGb: z.number().nullish(),
    volumeInGb: z.number().nullish(),
    dockerEntrypoint: z.array(z.string()).nullish(),
    dockerStartCmd: z.array(z.string()).nullish(),
    env: z.record(z.string(), z.string()).nullish(),
    ports: z.string().nullish(),
    readme: z.string().nullish(),
    volumeMountPath: z.string().nullish(),
    containerRegistryAuthId: z.string().nullish(),
  })
  .passthrough();

export type VendorTemplate = z.infer<typeof vendorTemplateSchema>;

export const vendorTemplateListSchema = z.array(vendorTemplateSchema);

export const vendorNetworkVolumeSchema = z
  .object({
    id: z.string(),
    name: z.string().nullish(),
    size: z.number().nullish(),
    dataCenterId: z.string().nullish(),
  })
  .passthrough();

export type VendorNetworkVolume = z.infer<typeof vendorNetworkVolumeSchema>;

export const vendorNetworkVolumeListSchema = z.array(vendorNetworkVolumeSchema);

export const vendorContainerRegistryAuthSchema = z
  .object({
    id: z.string(),
    name: z.string().nullish(),
  })
  .passthrough();

export const vendorContainerRegistryAuthListSchema = z.array(vendorContainerRegistryAuthSchema);

export const vendorBillingRecordSchema = z
  .object({
    time: z.string().nullish(),
    amount: z.coerce.number().nullish(),
    timeBilledMs: z.number().nullish(),
    podId: z.string().nullish(),
    endpointId: z.string().nullish(),
    gpuTypeId: z.string().nullish(),
    diskSpaceBilledGb: z.number().nullish(),
  })
  .passthrough();

export const vendorBillingRecordListSchema = z.array(vendorBillingRecordSchema);

export const vendorNetworkVolumeBillingRecordSchema = z
  .object({
    time: z.string().nullish(),
    amount: z.coerce.number().nullish(),
    diskSpaceBilledGb: z.number().nullish(),
    highPerformanceStorageAmount: z.coerce.number().nullish(),
    highPerformanceStorageDiskSpaceBilledGb: z.number().nullish(),
  })
  .passthrough();

export const vendorNetworkVolumeBillingRecordListSchema = z.array(vendorNetworkVolumeBillingRecordSchema);

// GraphQL `myself` minimal identity payload.
export const vendorMyselfSchema = z.object({
  id: z.string(),
  email: z.string().nullish(),
  clientBalance: z.coerce.number().nullish(),
  spendLimit: z.coerce.number().nullish(),
  currentSpendPerHr: z.coerce.number().nullish(),
  machineQuota: z.coerce.number().nullish(),
  maxServerlessConcurrency: z.coerce.number().nullish(),
  creditAlertThreshold: z.coerce.number().nullish(),
});

export const vendorUnauthorizedErrorSchema = z.object({
  message: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Input validation schemas (browser -> Server Action)
// ---------------------------------------------------------------------------

const dataCenterIdSchema = z.string().trim().min(1).max(32);
const gpuTypeIdSchema = z.string().trim().min(1).max(128);
const envRecordSchema = z.record(z.string().min(1).max(256), z.string().max(4096)).default({});

export const createPodInputSchema = z.object({
  name: z.string().trim().min(1).max(191).optional(),
  imageName: z.string().trim().min(1).max(512),
  computeType: z.enum(["GPU", "CPU"]).default("GPU"),
  cloudType: z.enum(["SECURE", "COMMUNITY"]).default("SECURE"),
  gpuTypeIds: z.array(gpuTypeIdSchema).max(20).optional(),
  gpuCount: z.coerce.number().int().min(1).max(8).optional(),
  cpuFlavorIds: z.array(z.string()).max(10).optional(),
  containerDiskInGb: z.coerce.number().int().min(1).max(9000).default(50),
  volumeInGb: z.coerce.number().int().min(0).max(50000).optional(),
  volumeMountPath: z.string().trim().max(255).optional(),
  ports: z.string().trim().max(512).optional(),
  env: envRecordSchema,
  dataCenterIds: z.array(dataCenterIdSchema).max(30).optional(),
  templateId: z.string().trim().max(191).optional(),
  containerRegistryAuthId: z.string().trim().max(191).optional(),
});
export type CreatePodInput = z.infer<typeof createPodInputSchema>;

export const updatePodInputSchema = z.object({
  podId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(191).optional(),
  imageName: z.string().trim().min(1).max(512).optional(),
  env: envRecordSchema.optional(),
  containerDiskInGb: z.coerce.number().int().min(1).max(9000).optional(),
});
export type UpdatePodInput = z.infer<typeof updatePodInputSchema>;

export const podIdSchema = z.object({ podId: z.string().trim().min(1) });

export const createEndpointInputSchema = z.object({
  name: z.string().trim().min(1).max(191).optional(),
  templateId: z.string().trim().min(1),
  computeType: z.enum(["GPU", "CPU"]).default("GPU"),
  gpuTypeIds: z.array(gpuTypeIdSchema).max(20).optional(),
  gpuCount: z.coerce.number().int().min(1).max(8).optional(),
  workersMin: z.coerce.number().int().min(0).max(100).default(0),
  workersMax: z.coerce.number().int().min(1).max(100).default(3),
  idleTimeout: z.coerce.number().int().min(1).max(3600).default(5),
  executionTimeoutMs: z.coerce.number().int().min(1000).max(86_400_000).optional(),
  scalerType: z.enum(["QUEUE_DELAY", "REQUEST_COUNT"]).default("QUEUE_DELAY"),
  scalerValue: z.coerce.number().int().min(1).max(1000).default(4),
  dataCenterIds: z.array(dataCenterIdSchema).max(30).optional(),
  networkVolumeId: z.string().trim().max(191).optional(),
  env: envRecordSchema,
});
export type CreateEndpointInput = z.infer<typeof createEndpointInputSchema>;

export const updateEndpointInputSchema = z.object({
  endpointId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(191).optional(),
  workersMin: z.coerce.number().int().min(0).max(100).optional(),
  workersMax: z.coerce.number().int().min(1).max(100).optional(),
  idleTimeout: z.coerce.number().int().min(1).max(3600).optional(),
  scalerType: z.enum(["QUEUE_DELAY", "REQUEST_COUNT"]).optional(),
  scalerValue: z.coerce.number().int().min(1).max(1000).optional(),
  env: envRecordSchema.optional(),
});
export type UpdateEndpointInput = z.infer<typeof updateEndpointInputSchema>;

export const endpointIdSchema = z.object({ endpointId: z.string().trim().min(1) });

export const createTemplateInputSchema = z.object({
  name: z.string().trim().min(1).max(191),
  imageName: z.string().trim().min(1).max(512),
  category: z.string().trim().max(64).optional(),
  isServerless: z.boolean().default(false),
  containerDiskInGb: z.coerce.number().int().min(1).max(9000).optional(),
  volumeInGb: z.coerce.number().int().min(0).max(50000).optional(),
  volumeMountPath: z.string().trim().max(255).optional(),
  ports: z.string().trim().max(512).optional(),
  env: envRecordSchema,
  readme: z.string().trim().max(20_000).optional(),
  containerRegistryAuthId: z.string().trim().max(191).optional(),
});
export type CreateTemplateInput = z.infer<typeof createTemplateInputSchema>;

export const updateTemplateInputSchema = createTemplateInputSchema.partial().extend({
  templateId: z.string().trim().min(1),
});
export type UpdateTemplateInput = z.infer<typeof updateTemplateInputSchema>;

export const templateIdSchema = z.object({ templateId: z.string().trim().min(1) });

export const createNetworkVolumeInputSchema = z.object({
  name: z.string().trim().min(1).max(191),
  size: z.coerce.number().int().min(1).max(100_000),
  dataCenterId: dataCenterIdSchema,
});
export type CreateNetworkVolumeInput = z.infer<typeof createNetworkVolumeInputSchema>;

export const updateNetworkVolumeInputSchema = z.object({
  networkVolumeId: z.string().trim().min(1),
  name: z.string().trim().min(1).max(191).optional(),
  size: z.coerce.number().int().min(1).max(100_000).optional(),
});
export type UpdateNetworkVolumeInput = z.infer<typeof updateNetworkVolumeInputSchema>;

export const networkVolumeIdSchema = z.object({ networkVolumeId: z.string().trim().min(1) });

export const createContainerRegistryAuthInputSchema = z.object({
  name: z.string().trim().min(1).max(191),
  username: z.string().trim().min(1).max(255),
  password: z.string().min(1).max(1024),
});
export type CreateContainerRegistryAuthInput = z.infer<typeof createContainerRegistryAuthInputSchema>;

export const containerRegistryAuthIdSchema = z.object({ containerRegistryAuthId: z.string().trim().min(1) });

export const billingReportQuerySchema = z.object({
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  bucketSize: z.enum(["hour", "day", "week", "month"]).optional(),
  grouping: z.string().optional(),
  gpuTypeId: z.string().optional(),
  podId: z.string().optional(),
  endpointId: z.string().optional(),
});
export type BillingReportQuery = z.infer<typeof billingReportQuerySchema>;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(191).optional(),
  desiredStatus: z.enum(["RUNNING", "EXITED", "TERMINATED"]).optional(),
  computeType: z.enum(["GPU", "CPU"]).optional(),
  sort: z.string().optional(),
});
export type ListQuery = z.infer<typeof listQuerySchema>;
