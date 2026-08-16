/**
 * Module metadata and navigation descriptor consumed by the host's sidebar.
 * This file contains no server-only or client-only code so it is safe to
 * import from anywhere (including the host's server-rendered navigation).
 */

export const RUNPOD_SERVICE_NAME = "Runpod" as const;
export const RUNPOD_SERVICE_SLUG = "runpod" as const;
export const RUNPOD_ROUTE_PREFIX = "/integrations/runpod" as const;
export const RUNPOD_API_ROUTE_PREFIX = "/api/integrations/runpod" as const;

/** Stable ids for sub-nav entries — keys in messages under `runpod.nav.<id>`. */
export type RunpodNavId =
  | "overview"
  | "pods"
  | "endpoints"
  | "templates"
  | "networkVolumes"
  | "registryAuths"
  | "reports"
  | "activity"
  | "settings";

export interface RunpodNavChild {
  id: RunpodNavId;
  label: string;
  href: string;
  /** Lucide icon name, resolved by the host's icon registry. */
  icon: string;
}

export interface RunpodNavDescriptor {
  group: "Integrations";
  label: string;
  href: string;
  icon: string;
  description: string;
  /** Matches this entry as "active" for any pathname starting with `href`. */
  activeMatch: "prefix";
  children: RunpodNavChild[];
}

export const runpodNavDescriptor: RunpodNavDescriptor = {
  group: "Integrations",
  label: "Runpod",
  href: RUNPOD_ROUTE_PREFIX,
  icon: "Server",
  description: "Manage Runpod GPU/CPU Pods, Serverless endpoints, storage, and billing.",
  activeMatch: "prefix",
  children: [
    { id: "overview", label: "Overview", href: RUNPOD_ROUTE_PREFIX, icon: "LayoutDashboard" },
    { id: "pods", label: "Pods", href: `${RUNPOD_ROUTE_PREFIX}/pods`, icon: "Cpu" },
    { id: "endpoints", label: "Endpoints", href: `${RUNPOD_ROUTE_PREFIX}/endpoints`, icon: "Network" },
    { id: "templates", label: "Templates", href: `${RUNPOD_ROUTE_PREFIX}/templates`, icon: "FileStack" },
    { id: "networkVolumes", label: "Network volumes", href: `${RUNPOD_ROUTE_PREFIX}/network-volumes`, icon: "HardDrive" },
    { id: "registryAuths", label: "Registry credentials", href: `${RUNPOD_ROUTE_PREFIX}/registry-auths`, icon: "KeyRound" },
    { id: "reports", label: "Reports", href: `${RUNPOD_ROUTE_PREFIX}/reports`, icon: "BarChart3" },
    { id: "activity", label: "Activity", href: `${RUNPOD_ROUTE_PREFIX}/activity`, icon: "History" },
    { id: "settings", label: "Settings", href: `${RUNPOD_ROUTE_PREFIX}/settings`, icon: "Settings" },
  ],
};

export const runpodModuleMetadata = {
  service: RUNPOD_SERVICE_NAME,
  serviceSlug: RUNPOD_SERVICE_SLUG,
  officialDocumentation: [
    "https://graphql-spec.runpod.io/#introduction",
    "https://docs.runpod.io/api-reference/overview",
    "https://rest.runpod.io/v1/openapi.json",
    "https://docs.runpod.io/get-started/api-keys",
  ],
} as const;
