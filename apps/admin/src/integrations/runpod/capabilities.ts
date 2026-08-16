/**
 * Typed link to docs/service-capability-matrix.md. This is intentionally a
 * small, hand-maintained subset (not a markdown parser) so the UI can render
 * "Not exposed by official API" / "Partial" badges without duplicating the
 * full matrix. The full matrix remains the single source of truth; keep this
 * file in sync with it when capabilities change.
 */

export type CapabilityStatus = "implemented" | "partial" | "not_exposed" | "excluded";

export interface CapabilityDescriptor {
  id: string;
  domain: string;
  capability: string;
  status: CapabilityStatus;
  reason?: string;
  sourceUrl: string;
}

export const RUNPOD_CAPABILITIES: CapabilityDescriptor[] = [
  { id: "account.identity", domain: "Account", capability: "Verified account identity", status: "implemented", sourceUrl: "https://graphql-spec.runpod.io/#introduction" },
  { id: "account.balance", domain: "Account", capability: "Balance / spend limit snapshot", status: "partial", reason: "Read-only, single fetch, no REST equivalent.", sourceUrl: "https://graphql-spec.runpod.io/#introduction" },
  { id: "teams.manage", domain: "Organizations", capability: "Teams / members / roles", status: "not_exposed", reason: "No documented mutation to manage team membership.", sourceUrl: "https://graphql-spec.runpod.io/#introduction" },
  { id: "apikeys.manage", domain: "Credentials", capability: "Subordinate API key management", status: "not_exposed", reason: "No documented create/delete mutation.", sourceUrl: "https://graphql-spec.runpod.io/#introduction" },
  { id: "pods.crud", domain: "Compute", capability: "Pod lifecycle (create/read/update/actions/delete)", status: "implemented", sourceUrl: "https://rest.runpod.io/v1/openapi.json" },
  { id: "pods.telemetry", domain: "Compute", capability: "Real-time GPU/CPU telemetry", status: "not_exposed", reason: "GraphQL-only field, not mixed into REST-based Pod mutation surface.", sourceUrl: "https://graphql-spec.runpod.io/#introduction" },
  { id: "endpoints.crud", domain: "Serverless", capability: "Endpoint lifecycle (create/read/update/delete)", status: "implemented", sourceUrl: "https://rest.runpod.io/v1/openapi.json" },
  { id: "endpoints.jobs", domain: "Serverless", capability: "Job submission / run / cancel", status: "excluded", reason: "Application data-plane, out of admin scope.", sourceUrl: "https://docs.runpod.io/serverless/endpoints/send-requests" },
  { id: "webhooks.account", domain: "Serverless", capability: "Account-level event webhooks", status: "not_exposed", reason: "No documented event-subscription system with signature verification.", sourceUrl: "https://docs.runpod.io/serverless/endpoints/send-requests" },
  { id: "templates.crud", domain: "Templates", capability: "Template lifecycle (create/read/update/delete)", status: "implemented", sourceUrl: "https://rest.runpod.io/v1/openapi.json" },
  { id: "volumes.crud", domain: "Storage", capability: "Network volume lifecycle", status: "implemented", sourceUrl: "https://rest.runpod.io/v1/openapi.json" },
  { id: "registry.crud", domain: "Credentials", capability: "Container registry auth (create/read/delete)", status: "implemented", sourceUrl: "https://rest.runpod.io/v1/openapi.json" },
  { id: "registry.update", domain: "Credentials", capability: "Container registry auth update", status: "not_exposed", reason: "No documented PATCH endpoint; delete + recreate only.", sourceUrl: "https://rest.runpod.io/v1/openapi.json" },
  { id: "billing.reports", domain: "Billing", capability: "Pod / Serverless / Storage billing reports", status: "implemented", sourceUrl: "https://rest.runpod.io/v1/openapi.json" },
  { id: "billing.payments", domain: "Billing", capability: "Payment methods / invoices / Stripe", status: "excluded", reason: "Billing-portal concern; not duplicated here.", sourceUrl: "https://graphql-spec.runpod.io/#introduction" },
  { id: "diagnostics.logs", domain: "Diagnostics", capability: "Container/build/system logs", status: "not_exposed", reason: "No documented log-retrieval API; console-only.", sourceUrl: "https://docs.runpod.io/" },
  { id: "diagnostics.workerstate", domain: "Diagnostics", capability: "Endpoint worker state summary", status: "partial", reason: "Derived from workers[] in the Endpoint response, not a dedicated metrics endpoint.", sourceUrl: "https://rest.runpod.io/v1/openapi.json" },
];

export function getCapability(id: string): CapabilityDescriptor | undefined {
  return RUNPOD_CAPABILITIES.find((capability) => capability.id === id);
}
