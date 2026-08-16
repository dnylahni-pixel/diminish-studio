/**
 * Safe public exports for the Runpod integration module. This file contains
 * no server-only credential access and no database import, so it may be
 * imported from anywhere in the host app (including client components and
 * the host's server-rendered sidebar) without pulling in secrets.
 */

export {
  RUNPOD_SERVICE_NAME,
  RUNPOD_SERVICE_SLUG,
  RUNPOD_ROUTE_PREFIX,
  RUNPOD_API_ROUTE_PREFIX,
  runpodNavDescriptor,
  runpodModuleMetadata,
} from "./contract";
export type { RunpodNavDescriptor, RunpodNavChild } from "./contract";

export { RUNPOD_CAPABILITIES, getCapability } from "./capabilities";
export type { CapabilityDescriptor, CapabilityStatus } from "./capabilities";

export * from "./types";

export {
  formatCredits,
  formatCreditsPerHour,
  formatGb,
  formatCount,
  formatMaskedEmail,
  formatTimestamp,
  formatUptime,
  podStatusTone,
  podStatusLabel,
} from "./formatters";
