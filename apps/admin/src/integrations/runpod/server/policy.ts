import "server-only";
import { RunpodApiError } from "./errors";

/**
 * Centralized, testable authorization policy. Every query/mutation/Server
 * Action in this module calls `assertPermission` before touching Runpod or
 * the local audit table — hiding a button in the UI is never treated as a
 * security boundary on its own.
 */
export type RunpodOperation =
  | "integration.read"
  | "integration.configure"
  | "integration.mutate"
  | "integration.delete"
  | "integration.billing.read"
  | "integration.audit.read";

export type RunpodAdminRole = "viewer" | "billing_viewer" | "operator" | "admin" | "owner";

export interface RunpodPolicyContext {
  actorId: string;
  role: RunpodAdminRole;
}

const ROLE_PERMISSIONS: Record<RunpodAdminRole, RunpodOperation[]> = {
  viewer: ["integration.read"],
  billing_viewer: ["integration.read", "integration.billing.read"],
  operator: ["integration.read", "integration.mutate", "integration.billing.read", "integration.audit.read"],
  admin: [
    "integration.read",
    "integration.configure",
    "integration.mutate",
    "integration.delete",
    "integration.billing.read",
    "integration.audit.read",
  ],
  owner: [
    "integration.read",
    "integration.configure",
    "integration.mutate",
    "integration.delete",
    "integration.billing.read",
    "integration.audit.read",
  ],
};

export function isPermitted(role: RunpodAdminRole, operation: RunpodOperation): boolean {
  return ROLE_PERMISSIONS[role]?.includes(operation) ?? false;
}

export class RunpodPermissionDeniedError extends RunpodApiError {
  constructor(operation: RunpodOperation, role: RunpodAdminRole) {
    super({
      category: "forbidden",
      message: `Your admin role ("${role}") does not include the "${operation}" capability required for this action.`,
    });
    this.name = "RunpodPermissionDeniedError";
  }
}

export function assertPermission(context: RunpodPolicyContext, operation: RunpodOperation): void {
  if (!isPermitted(context.role, operation)) {
    throw new RunpodPermissionDeniedError(operation, context.role);
  }
}
